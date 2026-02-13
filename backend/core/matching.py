import json
import logging
from decimal import Decimal

from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from openai import OpenAI

from core.models import GiftCard, Trade

logger = logging.getLogger("core")


def _calculate_value_similarity(user_card_value, other_card_value):
    """
    Value similarity score (0-40 points).

    Cards within +/-20% value of each other get 40 points.
    Linear decay outside that range, down to 0 points.
    Exact match = 40 points.
    """
    if user_card_value == 0:
        return 0

    diff_ratio = abs(user_card_value - other_card_value) / user_card_value
    threshold = Decimal("0.20")

    if diff_ratio <= threshold:
        return 40
    # Linear decay from 40 down to 0 as diff_ratio goes from 0.20 to 1.0
    # At diff_ratio == 1.0 (100% difference), score = 0
    max_ratio = Decimal("1.0")
    if diff_ratio >= max_ratio:
        return 0
    decay_range = max_ratio - threshold
    score = 40 * (1 - float((diff_ratio - threshold) / decay_range))
    return max(0, round(score))


def _calculate_brand_preference(user, other_card, user_card):
    """
    Brand preference score (0-20 points).

    +20 if the user has previously completed a trade for this brand.
    +10 if the other card's brand is in the same category as the user's card brand.
    These are not cumulative beyond 20; the max is 20.
    """
    score = 0

    # Check if user has previously completed trades involving this brand
    # (i.e., the user received a card of this brand in a completed trade)
    completed_trades_with_brand = Trade.objects.filter(
        Q(
            initiator=user,
            responder_card__brand=other_card.brand,
            status="completed",
        )
        | Q(
            responder=user,
            initiator_card__brand=other_card.brand,
            status="completed",
        )
    ).exists()

    if completed_trades_with_brand:
        score += 20

    # Check if brands share the same category
    if (
        score < 20
        and user_card.brand.category
        and other_card.brand.category
        and user_card.brand.category == other_card.brand.category
    ):
        score += 10

    return min(score, 20)


def _calculate_reputation_score(other_user):
    """
    Reputation score (0-25 points).

    Based on the other user's trust_score (0-100) mapped linearly to 0-25.
    Verified users get a +5 bonus (capped at 25).
    """
    # Map trust_score 0-100 to 0-25
    trust = min(other_user.trust_score, 100)
    score = (trust / 100) * 25

    if other_user.is_verified:
        score += 5

    return min(round(score), 25)


def _calculate_recency_score(card):
    """
    Recency score (0-15 points).

    Listed in last 24 hours = 15 points.
    Listed in last 7 days = 10 points.
    Older = 5 points.
    """
    now = timezone.now()
    age = now - card.created_at

    if age.total_seconds() <= 86400:  # 24 hours
        return 15
    elif age.days <= 7:
        return 10
    else:
        return 5


def get_swap_suggestions(user, limit=10):
    """
    Rule-based matching algorithm that suggests swap partners for the
    authenticated user.

    Steps:
    1. Get user's active swap-listed cards.
    2. Get other users' active swap-listed cards (excluding user's own).
    3. For each potential swap pair, calculate a composite score from
       value similarity, brand preference, reputation, and recency.
    4. Sort by score descending, return top ``limit`` results.
    5. Each result contains match_score, suggested_card, user_card,
       owner_reputation, value_difference, and estimated_fee.
    """
    # 1. Get user's active swap-listed cards
    user_cards = GiftCard.objects.filter(
        owner=user,
        listing_type=GiftCard.ListingType.SWAP,
        status=GiftCard.Status.ACTIVE,
    ).select_related("brand")

    if not user_cards.exists():
        return []

    # 2. Get other users' active swap-listed cards
    other_cards = (
        GiftCard.objects.filter(
            listing_type=GiftCard.ListingType.SWAP,
            status=GiftCard.Status.ACTIVE,
        )
        .exclude(owner=user)
        .select_related("brand", "owner")
    )

    if not other_cards.exists():
        return []

    # 3. Score every (user_card, other_card) pair
    scored_matches = []
    fee_rate = Decimal("0.05")

    for user_card in user_cards:
        for other_card in other_cards:
            value_score = _calculate_value_similarity(
                user_card.value, other_card.value
            )
            brand_score = _calculate_brand_preference(user, other_card, user_card)
            reputation_score = _calculate_reputation_score(other_card.owner)
            recency_score = _calculate_recency_score(other_card)

            total_score = value_score + brand_score + reputation_score + recency_score

            other_user = other_card.owner
            rep = other_user.reputation

            scored_matches.append({
                "match_score": total_score,
                "suggested_card": {
                    "id": other_card.id,
                    "brand": other_card.brand.name,
                    "value": str(other_card.value),
                    "listing_type": other_card.listing_type,
                    "expiry_date": (
                        other_card.expiry_date.isoformat()
                        if other_card.expiry_date
                        else None
                    ),
                    "owner_username": other_user.username,
                },
                "user_card": {
                    "id": user_card.id,
                    "brand": user_card.brand.name,
                    "value": str(user_card.value),
                },
                "owner_reputation": {
                    "total_trades": rep["total_trades"],
                    "successful_trades": rep["successful_trades"],
                    "disputes": rep["disputes"],
                    "is_verified": other_user.is_verified,
                    "trust_score": other_user.trust_score,
                },
                "value_difference": str(abs(user_card.value - other_card.value)),
                "estimated_fee": str((user_card.value * fee_rate).quantize(
                    Decimal("0.01")
                )),
            })

    # 4. Sort by score descending
    scored_matches.sort(key=lambda m: m["match_score"], reverse=True)

    # 5. Return top ``limit`` results
    top_matches = scored_matches[:limit]

    # 6. Enrich with AI-generated match reasons via OpenAI
    top_matches = _enrich_with_ai_reasons(top_matches)

    return top_matches


def _enrich_with_ai_reasons(matches):
    """
    Use OpenAI to generate a short, human-friendly reason for each match.
    Falls back gracefully — if OpenAI is unavailable, matches are returned as-is.
    """
    if not matches or not getattr(settings, "OPENAI_API_KEY", ""):
        return matches

    # Build a concise prompt describing the top matches
    match_summaries = []
    for i, m in enumerate(matches):
        match_summaries.append(
            f"{i+1}. Your {m['user_card']['brand']} (${m['user_card']['value']}) "
            f"↔ {m['suggested_card']['owner_username']}'s "
            f"{m['suggested_card']['brand']} (${m['suggested_card']['value']}) "
            f"— score {m['match_score']}/100, "
            f"trust {m['owner_reputation']['trust_score']}/100"
        )

    prompt = (
        "You are a gift card swap assistant for Perkify. "
        "For each match below, write a short (1 sentence, max 20 words) reason "
        "why this swap is a good deal. Be specific about value, brand, or trust. "
        "Return ONLY a JSON array of strings, one reason per match.\n\n"
        "Matches:\n" + "\n".join(match_summaries)
    )

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=500,
        )
        content = response.choices[0].message.content.strip()
        # Parse JSON array from response
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        reasons = json.loads(content)

        for i, match in enumerate(matches):
            if i < len(reasons):
                match["ai_match_reason"] = reasons[i]
    except Exception as exc:
        logger.warning("OpenAI match enrichment failed: %s", exc)
        # Graceful fallback — matches work fine without AI reasons

    return matches
