from rest_framework import serializers

from core.models import Review, Sale, Trade


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = serializers.CharField(source="reviewer.username", read_only=True)
    target_user = serializers.CharField(source="target_user.username", read_only=True)
    trade_id = serializers.CharField(source="trade.trade_id", read_only=True, default=None)
    sale_id = serializers.CharField(source="sale.sale_id", read_only=True, default=None)

    class Meta:
        model = Review
        fields = [
            "id",
            "trade_id",
            "sale_id",
            "reviewer",
            "target_user",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = fields


class ReviewCreateSerializer(serializers.ModelSerializer):
    trade = serializers.PrimaryKeyRelatedField(
        queryset=Trade.objects.all(), required=False, allow_null=True
    )
    sale = serializers.PrimaryKeyRelatedField(
        queryset=Sale.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Review
        fields = ["trade", "sale", "rating", "comment"]

    def validate(self, attrs):
        trade = attrs.get("trade")
        sale = attrs.get("sale")
        if not trade and not sale:
            raise serializers.ValidationError(
                "Either trade or sale must be provided."
            )
        if trade and sale:
            raise serializers.ValidationError(
                "Provide either trade or sale, not both."
            )

        request = self.context["request"]
        if trade:
            if request.user not in [trade.initiator, trade.responder]:
                raise serializers.ValidationError(
                    "You can only review trades you participated in."
                )
            if trade.status != "completed":
                raise serializers.ValidationError(
                    "Can only review completed trades."
                )
        if sale:
            if request.user not in [sale.buyer, sale.seller]:
                raise serializers.ValidationError(
                    "You can only review sales you participated in."
                )
            if sale.status != "completed":
                raise serializers.ValidationError(
                    "Can only review completed sales."
                )
        return attrs

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        trade = validated_data.get("trade")
        sale = validated_data.get("sale")

        if trade:
            target = trade.responder if request.user == trade.initiator else trade.initiator
        else:
            target = sale.seller if request.user == sale.buyer else sale.buyer

        return Review.objects.create(
            trade=trade,
            sale=sale,
            reviewer=request.user,
            target_user=target,
            rating=validated_data["rating"],
            comment=validated_data.get("comment", ""),
        )
