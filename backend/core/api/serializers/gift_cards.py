import re
from datetime import date

from rest_framework import serializers

from core.models import Brand, GiftCard


# ─── Brand Serializer ───


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "logo", "category", "is_popular", "is_active", "created_at"]
        read_only_fields = fields


# ─── Gift Card List Serializer ───


class GiftCardListSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    owner = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = GiftCard
        fields = [
            "id",
            "brand",
            "owner",
            "value",
            "selling_price",
            "listing_type",
            "status",
            "expiry_date",
            "image",
            "created_at",
        ]
        read_only_fields = fields


# ─── Gift Card Detail Serializer ───


class GiftCardDetailSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    owner = serializers.CharField(source="owner.username", read_only=True)
    moderation_note = serializers.CharField(read_only=True)

    class Meta:
        model = GiftCard
        fields = [
            "id",
            "brand",
            "owner",
            "value",
            "selling_price",
            "listing_type",
            "status",
            "expiry_date",
            "confirmed_unused",
            "moderation_note",
            "image",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


# ─── Gift Card Create Serializer ───


class GiftCardCreateSerializer(serializers.ModelSerializer):
    brand = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.filter(is_active=True))
    card_number = serializers.CharField(write_only=True)
    pin = serializers.CharField(write_only=True)

    class Meta:
        model = GiftCard
        fields = [
            "brand",
            "value",
            "expiry_date",
            "card_number",
            "pin",
            "listing_type",
            "selling_price",
            "confirmed_unused",
            "image",
        ]

    def validate_card_number(self, value):
        cleaned = value.strip().replace("-", "").replace(" ", "")
        if not re.match(r"^[A-Za-z0-9]{8,25}$", cleaned):
            raise serializers.ValidationError(
                "Card number must be 8-25 alphanumeric characters."
            )
        return cleaned

    def validate_pin(self, value):
        cleaned = value.strip()
        if not re.match(r"^[A-Za-z0-9]{3,10}$", cleaned):
            raise serializers.ValidationError(
                "PIN must be 3-10 alphanumeric characters."
            )
        return cleaned

    def validate_expiry_date(self, value):
        if value <= date.today():
            raise serializers.ValidationError("Expiry date must be in the future.")
        return value

    def validate(self, attrs):
        listing_type = attrs.get("listing_type")
        selling_price = attrs.get("selling_price")
        value = attrs.get("value")

        if listing_type == GiftCard.ListingType.SELL:
            if selling_price is None:
                raise serializers.ValidationError(
                    {"selling_price": "Selling price is required for sell listings."}
                )
            if selling_price > value:
                raise serializers.ValidationError(
                    {"selling_price": "Selling price cannot exceed card value."}
                )

        return attrs

    def create(self, validated_data):
        card_number = validated_data.pop("card_number")
        pin = validated_data.pop("pin")

        instance = GiftCard(**validated_data)
        instance.set_card_number(card_number)
        instance.set_pin(pin)
        instance.save()

        return instance


# ─── Gift Card Update Serializer ───


class GiftCardUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftCard
        fields = [
            "value",
            "expiry_date",
            "listing_type",
            "selling_price",
            "confirmed_unused",
            "image",
        ]

    def validate_expiry_date(self, value):
        if value <= date.today():
            raise serializers.ValidationError("Expiry date must be in the future.")
        return value

    def validate(self, attrs):
        listing_type = attrs.get("listing_type", self.instance.listing_type)
        selling_price = attrs.get("selling_price", self.instance.selling_price)
        value = attrs.get("value", self.instance.value)

        if listing_type == GiftCard.ListingType.SELL:
            if selling_price is not None and selling_price > value:
                raise serializers.ValidationError(
                    {"selling_price": "Selling price cannot exceed card value."}
                )

        return attrs


# ─── Gift Card Code Serializer ───


class GiftCardCodeSerializer(serializers.Serializer):
    card_number = serializers.CharField(read_only=True)
    pin = serializers.CharField(read_only=True)


# ─── Marketplace Serializer ───


class MarketplaceSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    owner = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = GiftCard
        fields = [
            "id",
            "brand",
            "owner",
            "value",
            "selling_price",
            "listing_type",
            "status",
            "expiry_date",
            "image",
            "created_at",
        ]
        read_only_fields = fields
