from django.db.models import Q
from rest_framework import serializers

from core.models import EscrowSession, GiftCard, Trade


# ─── Nested Serializers ───


class TradeGiftCardSerializer(serializers.ModelSerializer):
    brand = serializers.CharField(source="brand.name", read_only=True)
    owner_username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = GiftCard
        fields = [
            "id",
            "brand",
            "owner_username",
            "value",
            "listing_type",
            "status",
            "expiry_date",
        ]
        read_only_fields = fields


class TradeDetailGiftCardSerializer(serializers.ModelSerializer):
    """Extended card serializer that includes card_number/pin for revealed trades."""

    brand = serializers.CharField(source="brand.name", read_only=True)
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    card_number = serializers.SerializerMethodField()
    pin = serializers.SerializerMethodField()

    class Meta:
        model = GiftCard
        fields = [
            "id",
            "brand",
            "owner_username",
            "value",
            "listing_type",
            "status",
            "expiry_date",
            "card_number",
            "pin",
        ]
        read_only_fields = fields

    def get_card_number(self, obj):
        trade = self.context.get("trade")
        if trade and trade.status in (
            Trade.Status.CODES_RELEASED,
            Trade.Status.CONFIRMING,
            Trade.Status.COMPLETED,
        ):
            return obj.get_card_number()
        return None

    def get_pin(self, obj):
        trade = self.context.get("trade")
        if trade and trade.status in (
            Trade.Status.CODES_RELEASED,
            Trade.Status.CONFIRMING,
            Trade.Status.COMPLETED,
        ):
            return obj.get_pin()
        return None


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


class TradeUserSerializer(serializers.Serializer):
    """Minimal user info for trade participants."""

    id = serializers.IntegerField()
    username = serializers.CharField()


# ─── Trade Serializers ───


class TradeListSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="trade_id", read_only=True)
    initiator_card = TradeGiftCardSerializer(read_only=True)
    responder_card = TradeGiftCardSerializer(read_only=True)
    escrow_status = serializers.CharField(
        source="escrow.status", read_only=True, default=None
    )
    counterparty = serializers.SerializerMethodField()
    is_initiator = serializers.SerializerMethodField()
    platform_fee = serializers.SerializerMethodField()

    class Meta:
        model = Trade
        fields = [
            "id",
            "counterparty",
            "is_initiator",
            "initiator_card",
            "responder_card",
            "platform_fee",
            "platform_fee_initiator",
            "platform_fee_responder",
            "status",
            "initiator_confirmed",
            "responder_confirmed",
            "escrow_status",
            "created_at",
        ]
        read_only_fields = fields

    def _get_request_user(self):
        request = self.context.get("request")
        return request.user if request else None

    def get_counterparty(self, obj):
        user = self._get_request_user()
        if user and obj.initiator_id == user.id:
            return {"id": str(obj.responder_id), "username": obj.responder.username}
        return {"id": str(obj.initiator_id), "username": obj.initiator.username}

    def get_is_initiator(self, obj):
        user = self._get_request_user()
        if user:
            return obj.initiator_id == user.id
        return False

    def get_platform_fee(self, obj):
        user = self._get_request_user()
        if user and obj.initiator_id == user.id:
            return float(obj.platform_fee_initiator)
        return float(obj.platform_fee_responder)


class TradeDetailSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="trade_id", read_only=True)
    initiator = serializers.SerializerMethodField()
    responder = serializers.SerializerMethodField()
    initiator_card = serializers.SerializerMethodField()
    responder_card = serializers.SerializerMethodField()
    escrow = EscrowSerializer(read_only=True)
    is_initiator = serializers.SerializerMethodField()
    is_responder = serializers.SerializerMethodField()
    initiator_fee = serializers.DecimalField(
        source="platform_fee_initiator", max_digits=10, decimal_places=2, read_only=True
    )
    responder_fee = serializers.DecimalField(
        source="platform_fee_responder", max_digits=10, decimal_places=2, read_only=True
    )
    platform_fee = serializers.SerializerMethodField()
    confirmation_deadline = serializers.SerializerMethodField()
    my_fee_paid = serializers.SerializerMethodField()

    class Meta:
        model = Trade
        fields = [
            "id",
            "initiator",
            "responder",
            "initiator_card",
            "responder_card",
            "initiator_fee",
            "responder_fee",
            "platform_fee",
            "status",
            "initiator_confirmed",
            "responder_confirmed",
            "initiator_paid",
            "responder_paid",
            "my_fee_paid",
            "is_initiator",
            "is_responder",
            "confirmation_deadline",
            "notes",
            "escrow",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def _get_request_user(self):
        request = self.context.get("request")
        return request.user if request else None

    def get_initiator(self, obj):
        return {"id": str(obj.initiator_id), "username": obj.initiator.username}

    def get_responder(self, obj):
        return {"id": str(obj.responder_id), "username": obj.responder.username}

    def get_initiator_card(self, obj):
        return TradeDetailGiftCardSerializer(
            obj.initiator_card, context={"trade": obj}
        ).data

    def get_responder_card(self, obj):
        return TradeDetailGiftCardSerializer(
            obj.responder_card, context={"trade": obj}
        ).data

    def get_is_initiator(self, obj):
        user = self._get_request_user()
        if user:
            return obj.initiator_id == user.id
        return False

    def get_is_responder(self, obj):
        user = self._get_request_user()
        if user:
            return obj.responder_id == user.id
        return False

    def get_platform_fee(self, obj):
        return float(obj.platform_fee_initiator + obj.platform_fee_responder)

    def get_my_fee_paid(self, obj):
        user = self._get_request_user()
        if user:
            if obj.initiator_id == user.id:
                return obj.initiator_paid
            return obj.responder_paid
        return False

    def get_confirmation_deadline(self, obj):
        if hasattr(obj, "escrow") and obj.escrow:
            deadline = obj.escrow.confirmation_deadline
            if deadline:
                return deadline.isoformat()
        return None


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

        # ── Avatar required ──
        if not user.avatar:
            raise serializers.ValidationError(
                "You must upload a profile image before trading. "
                "Go to your Profile page to add one."
            )

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
