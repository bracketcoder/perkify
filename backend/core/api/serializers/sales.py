from rest_framework import serializers

from core.models import GiftCard, Sale


# ─── Nested Serializers ───


class SaleGiftCardSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    owner_username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = GiftCard
        fields = [
            "id",
            "brand_name",
            "owner_username",
            "value",
            "selling_price",
            "listing_type",
            "status",
            "expiry_date",
        ]
        read_only_fields = fields


# ─── Sale Serializers ───


class SaleListSerializer(serializers.ModelSerializer):
    buyer = serializers.CharField(source="buyer.username", read_only=True)
    seller = serializers.CharField(source="seller.username", read_only=True)
    gift_card = SaleGiftCardSerializer(read_only=True)

    class Meta:
        model = Sale
        fields = [
            "sale_id",
            "buyer",
            "seller",
            "gift_card",
            "amount",
            "platform_fee",
            "status",
            "code_revealed",
            "created_at",
        ]
        read_only_fields = fields


class SaleDetailSerializer(serializers.ModelSerializer):
    buyer = serializers.CharField(source="buyer.username", read_only=True)
    seller = serializers.CharField(source="seller.username", read_only=True)
    gift_card = SaleGiftCardSerializer(read_only=True)

    class Meta:
        model = Sale
        fields = [
            "sale_id",
            "buyer",
            "seller",
            "gift_card",
            "amount",
            "platform_fee",
            "status",
            "code_revealed",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class SaleCreateSerializer(serializers.Serializer):
    gift_card_id = serializers.PrimaryKeyRelatedField(
        queryset=GiftCard.objects.all(), source="gift_card"
    )

    def validate_gift_card(self, value):
        request = self.context["request"]
        if value.owner == request.user:
            raise serializers.ValidationError("You cannot buy your own gift card.")
        if value.status != GiftCard.Status.ACTIVE:
            raise serializers.ValidationError("This gift card is not available.")
        if value.listing_type != GiftCard.ListingType.SELL:
            raise serializers.ValidationError(
                "This gift card is not listed for sale."
            )
        if value.is_expired:
            raise serializers.ValidationError("This gift card is expired.")
        if not value.selling_price:
            raise serializers.ValidationError(
                "This gift card does not have a selling price set."
            )
        return value

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        gift_card = attrs["gift_card"]

        # ── Trade limit enforcement ──
        user.reset_daily_limits_if_needed()
        if user.daily_trade_count >= user.max_daily_trades:
            raise serializers.ValidationError(
                "You have reached your daily trade limit."
            )
        card_value = gift_card.selling_price
        if user.daily_trade_value + card_value > user.max_daily_value:
            raise serializers.ValidationError(
                "This purchase would exceed your daily trade value limit."
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        gift_card = validated_data["gift_card"]

        sale = Sale.objects.create(
            buyer=request.user,
            seller=gift_card.owner,
            gift_card=gift_card,
            amount=gift_card.selling_price,
            status=Sale.Status.PENDING,
        )

        # Mark card as in_trade
        gift_card.status = GiftCard.Status.IN_TRADE
        gift_card.save(update_fields=["status", "updated_at"])

        # Update daily limits
        user = request.user
        user.daily_trade_count += 1
        user.daily_trade_value += gift_card.selling_price
        user.save(update_fields=["daily_trade_count", "daily_trade_value"])

        return sale
