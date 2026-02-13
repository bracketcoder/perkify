import logging
from datetime import timedelta
from decimal import Decimal

from django.db import models
from django.utils import timezone

from core.models import Dispute, FraudFlag, GiftCard, Trade, User

logger = logging.getLogger(__name__)


# ─── Thresholds ───
RAPID_TRADES_THRESHOLD = 3  # More than this many trades in the window
RAPID_TRADES_WINDOW_HOURS = 1

REPEATED_DISPUTES_THRESHOLD = 2  # More than this many disputes in the window
REPEATED_DISPUTES_WINDOW_DAYS = 7

ABNORMAL_VALUE_THRESHOLD = Decimal("500.00")
ABNORMAL_VALUE_TRUST_TIER = 0  # Only applies to new users

AUTO_RESTRICT_FLAG_THRESHOLD = 2  # 2+ unresolved flags triggers auto-restrict

# Trust tier upgrade requirements
TIER_1_SUCCESSFUL_TRADES = 5
TIER_2_SUCCESSFUL_TRADES = 20


def _get_user_trade_count_in_window(user, hours):
    """Count trades created by this user (as initiator or responder) within the last N hours."""
    cutoff = timezone.now() - timedelta(hours=hours)
    return Trade.objects.filter(
        models.Q(initiator=user) | models.Q(responder=user),
        created_at__gte=cutoff,
    ).exclude(
        status__in=[Trade.Status.CANCELLED],
    ).count()


def _get_user_dispute_count_in_window(user, days):
    """Count disputes raised by this user within the last N days."""
    cutoff = timezone.now() - timedelta(days=days)
    return Dispute.objects.filter(
        raised_by=user,
        created_at__gte=cutoff,
    ).count()


def _get_user_max_single_trade_value(user):
    """Get the maximum single card value in trades initiated by a new user."""
    max_as_initiator = Trade.objects.filter(
        initiator=user,
    ).exclude(
        status=Trade.Status.CANCELLED,
    ).aggregate(
        max_val=models.Max("initiator_card__value"),
    )["max_val"]

    max_as_responder = Trade.objects.filter(
        responder=user,
    ).exclude(
        status=Trade.Status.CANCELLED,
    ).aggregate(
        max_val=models.Max("responder_card__value"),
    )["max_val"]

    values = [v for v in [max_as_initiator, max_as_responder] if v is not None]
    return max(values) if values else Decimal("0")


def _has_existing_pending_flag(user, flag_type):
    """Check if user already has a pending/reviewed flag of this type to avoid duplicates."""
    return FraudFlag.objects.filter(
        user=user,
        flag_type=flag_type,
        status__in=[FraudFlag.Status.PENDING, FraudFlag.Status.REVIEWED],
    ).exists()


def _create_flag(user, flag_type, details):
    """Create a FraudFlag and handle auto-restriction if needed."""
    flag = FraudFlag.objects.create(
        user=user,
        flag_type=flag_type,
        details=details,
    )
    logger.info("Fraud flag created: %s for user %s (id=%d)", flag_type, user.username, user.pk)

    # Check if auto-restriction should be applied
    _maybe_auto_restrict(user, flag)

    return flag


def _maybe_auto_restrict(user, flag):
    """If user has 2+ unresolved flags, auto-restrict their account."""
    unresolved_count = FraudFlag.objects.filter(
        user=user,
        status__in=[FraudFlag.Status.PENDING, FraudFlag.Status.REVIEWED],
    ).count()

    if unresolved_count >= AUTO_RESTRICT_FLAG_THRESHOLD:
        if user.status != User.Status.RESTRICTED:
            user.status = User.Status.RESTRICTED
            user.save(update_fields=["status"])
            logger.warning(
                "User %s (id=%d) auto-restricted due to %d unresolved fraud flags",
                user.username,
                user.pk,
                unresolved_count,
            )
        flag.auto_restricted = True
        flag.save(update_fields=["auto_restricted"])


# ─── Individual Check Functions ───


def check_rapid_trades(user):
    """
    Check if user has more than RAPID_TRADES_THRESHOLD trades
    created in the last RAPID_TRADES_WINDOW_HOURS hour(s).
    """
    if _has_existing_pending_flag(user, FraudFlag.FlagType.RAPID_TRADES):
        return None

    trade_count = _get_user_trade_count_in_window(user, RAPID_TRADES_WINDOW_HOURS)

    if trade_count > RAPID_TRADES_THRESHOLD:
        details = (
            f"User {user.username} has {trade_count} trades in the last "
            f"{RAPID_TRADES_WINDOW_HOURS} hour(s), exceeding the threshold of "
            f"{RAPID_TRADES_THRESHOLD}."
        )
        return _create_flag(user, FraudFlag.FlagType.RAPID_TRADES, details)

    return None


def check_repeated_disputes(user):
    """
    Check if user has more than REPEATED_DISPUTES_THRESHOLD disputes
    filed in the last REPEATED_DISPUTES_WINDOW_DAYS days.
    """
    if _has_existing_pending_flag(user, FraudFlag.FlagType.REPEATED_DISPUTES):
        return None

    dispute_count = _get_user_dispute_count_in_window(user, REPEATED_DISPUTES_WINDOW_DAYS)

    if dispute_count > REPEATED_DISPUTES_THRESHOLD:
        details = (
            f"User {user.username} has filed {dispute_count} disputes in the last "
            f"{REPEATED_DISPUTES_WINDOW_DAYS} days, exceeding the threshold of "
            f"{REPEATED_DISPUTES_THRESHOLD}."
        )
        return _create_flag(user, FraudFlag.FlagType.REPEATED_DISPUTES, details)

    return None


def check_multi_ip(user):
    """
    Placeholder for multi-IP detection.
    Would need request logging / IP tracking to be implemented.
    """
    # TODO: Implement once request IP logging is in place.
    # This would check if a user has logged in from an unusual number
    # of distinct IP addresses within a short time window.
    return None


def check_abnormal_value(user):
    """
    Check if a new user (trust_tier=0) has a single trade involving
    a card valued over ABNORMAL_VALUE_THRESHOLD.
    """
    if user.trust_tier != ABNORMAL_VALUE_TRUST_TIER:
        return None

    if _has_existing_pending_flag(user, FraudFlag.FlagType.ABNORMAL_VALUE):
        return None

    max_value = _get_user_max_single_trade_value(user)

    if max_value > ABNORMAL_VALUE_THRESHOLD:
        details = (
            f"New user {user.username} (trust_tier={user.trust_tier}) has a trade "
            f"involving a card valued at ${max_value}, exceeding the threshold of "
            f"${ABNORMAL_VALUE_THRESHOLD} for new users."
        )
        return _create_flag(user, FraudFlag.FlagType.ABNORMAL_VALUE, details)

    return None


# ─── Main Entry Point ───


def run_fraud_checks(user=None):
    """
    Run all fraud detection checks for the given user, or for all active users
    if no user is specified.

    Returns a list of newly created FraudFlag instances.
    """
    new_flags = []

    if user is not None:
        users = [user]
    else:
        users = User.objects.filter(status=User.Status.ACTIVE, is_active=True)

    for u in users:
        checks = [
            check_rapid_trades,
            check_repeated_disputes,
            check_multi_ip,
            check_abnormal_value,
        ]
        for check_fn in checks:
            try:
                flag = check_fn(u)
                if flag is not None:
                    new_flags.append(flag)
            except Exception:
                logger.exception(
                    "Error running fraud check %s for user %s (id=%d)",
                    check_fn.__name__,
                    u.username,
                    u.pk,
                )

    return new_flags


# ─── Trust Tier Upgrades ───


def check_and_upgrade_trust_tier(user):
    """
    Evaluate whether a user qualifies for a trust tier upgrade based on
    their trade history and fraud record.

    Tier upgrade rules:
    - Tier 0 -> 1: 5+ successful trades, 0 confirmed fraud flags
    - Tier 1 -> 2: 20+ successful trades, 0 confirmed fraud flags

    Returns True if the user's tier was upgraded, False otherwise.
    """
    successful_trades = Trade.objects.filter(
        models.Q(initiator=user) | models.Q(responder=user),
        status=Trade.Status.COMPLETED,
    ).count()

    confirmed_fraud = FraudFlag.objects.filter(
        user=user,
        status=FraudFlag.Status.CONFIRMED,
    ).count()

    if confirmed_fraud > 0:
        return False

    upgraded = False

    if user.trust_tier == User.TrustTier.NEW and successful_trades >= TIER_1_SUCCESSFUL_TRADES:
        user.trust_tier = User.TrustTier.ESTABLISHED
        upgraded = True
        logger.info(
            "User %s (id=%d) upgraded to trust tier 1 (Established) with %d successful trades",
            user.username,
            user.pk,
            successful_trades,
        )

    elif user.trust_tier == User.TrustTier.ESTABLISHED and successful_trades >= TIER_2_SUCCESSFUL_TRADES:
        user.trust_tier = User.TrustTier.TRUSTED
        upgraded = True
        logger.info(
            "User %s (id=%d) upgraded to trust tier 2 (Trusted) with %d successful trades",
            user.username,
            user.pk,
            successful_trades,
        )

    if upgraded:
        user.save(update_fields=["trust_tier"])

    return upgraded
