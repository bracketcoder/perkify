from django.db.models import Q
from rest_framework import serializers

from core.models import EscrowSession, GiftCard, Trade


# ─── Nested Serializers ───


class TradeGiftCardSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    owner_username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = GiftCard
        fields = [
            "id",
            "brand_name",
            "owner_username",
            "value",
            "listing_type",
            "status",
            "expiry_date",
        ]
        read_only_fields = fields


class EscrowSerializer(serializers.ModelSerializer):
    is_confirmation_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = EscrowSession
        fields = [
            "id",
            "status",
            "locked_at",
            "released_at",
            "confirmation_deadline",
            "finalized_at",
            "is_confirmation_expired",
        ]
        read_only_fields = fields


# ─── Trade Serializers ───


class TradeListSerializer(serializers.ModelSerializer):
    initiator = serializers.CharField(source="initiator.username", read_only=True)
    responder = serializers.CharField(source="responder.username", read_only=True)
    initiator_card = TradeGiftCardSerializer(read_only=True)
    responder_card = TradeGiftCardSerializer(read_only=True)
    escrow_status = serializers.CharField(
        source="escrow.status", read_only=True, default=None
    )

    class Meta:
        model = Trade
        fields = [
            "trade_id",
            "initiator",
            "responder",
            "initiator_card",
            "responder_card",
            "platform_fee_initiator",
            "platform_fee_responder",
            "status",
            "initiator_confirmed",
            "responder_confirmed",
            "escrow_status",
            "created_at",
        ]
        read_only_fields = fields


class TradeDetailSerializer(serializers.ModelSerializer):
    initiator = serializers.CharField(source="initiator.username", read_only=True)
    responder = serializers.CharField(source="responder.username", read_only=True)
    initiator_card = TradeGiftCardSerializer(read_only=True)
    responder_card = TradeGiftCardSerializer(read_only=True)
    escrow = EscrowSerializer(read_only=True)

    class Meta:
        model = Trade
        fields = [
            "trade_id",
            "initiator",
            "responder",
            "initiator_card",
            "responder_card",
            "platform_fee_initiator",
            "platform_fee_responder",
            "status",
            "initiator_confirmed",
            "responder_confirmed",
            "notes",
            "escrow",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class TradeCreateSerializer(serializers.Serializer):
    initiator_card = serializers.PrimaryKeyRelatedField(
        queryset=GiftCard.objects.all()
    )
    responder_card = serializers.PrimaryKeyRelatedField(
        queryset=GiftCard.objects.all()
    )

    def validate_initiator_card(self, value):
        request = self.context["request"]
        if value.owner != request.user:
            raise serializers.ValidationError("You can only offer your own gift card.")
        if value.status != GiftCard.Status.ACTIVE:
            raise serializers.ValidationError("Your gift card must be active.")
        if value.listing_type != GiftCard.ListingType.SWAP:
            raise serializers.ValidationError(
                "Your gift card must be listed for swap."
            )
        if value.is_expired:
            raise serializers.ValidationError("Your gift card is expired.")
        return value

    def validate_responder_card(self, value):
        request = self.context["request"]
        if value.owner == request.user:
            raise serializers.ValidationError(
                "You cannot trade with your own gift card."
            )
        if value.status != GiftCard.Status.ACTIVE:
            raise serializers.ValidationError(
                "The responder's gift card must be active."
            )
        if value.listing_type != GiftCard.ListingType.SWAP:
            raise serializers.ValidationError(
                "The responder's gift card must be listed for swap."
            )
        if value.is_expired:
            raise serializers.ValidationError("The responder's gift card is expired.")
        return value

    def validate(self, attrs):
        if attrs["initiator_card"] == attrs["responder_card"]:
            raise serializers.ValidationError("Cannot trade a card with itself.")

        request = self.context["request"]
        user = request.user

        # ── Active trade limit enforcement ──
        active_statuses = [
            Trade.Status.PROPOSED,
            Trade.Status.ACCEPTED,
            Trade.Status.IN_ESCROW,
            Trade.Status.CODES_RELEASED,
            Trade.Status.CONFIRMING,
        ]
        active_count = Trade.objects.filter(
            Q(initiator=user) | Q(responder=user),
            status__in=active_statuses,
        ).count()
        if active_count >= user.max_active_trades:
            raise serializers.ValidationError(
                "You have reached your active trade limit. "
                "Complete or cancel existing trades before starting new ones."
            )

        # ── Daily trade limit enforcement ──
        user.reset_daily_limits_if_needed()
        if user.daily_trade_count >= user.max_daily_trades:
            raise serializers.ValidationError(
                "You have reached your daily trade limit."
            )
        card_value = attrs["initiator_card"].value
        if user.daily_trade_value + card_value > user.max_daily_value:
            raise serializers.ValidationError(
                "This trade would exceed your daily trade value limit."
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        initiator_card = validated_data["initiator_card"]
        responder_card = validated_data["responder_card"]

        trade = Trade(
            initiator=request.user,
            responder=responder_card.owner,
            initiator_card=initiator_card,
            responder_card=responder_card,
            status=Trade.Status.PROPOSED,
        )
        trade.calculate_fees()
        trade.save()

        # Update daily limits
        user = request.user
        user.daily_trade_count += 1
        user.daily_trade_value += initiator_card.value
        user.save(update_fields=["daily_trade_count", "daily_trade_value"])

        return trade


class TradeRespondSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["accept", "decline"])


class TradeConfirmSerializer(serializers.Serializer):
    """Empty serializer for the confirm action."""
    pass
