from decimal import Decimal

from rest_framework import serializers

from core.models import (
    AuditLog,
    Dispute,
    EscrowSession,
    FraudFlag,
    GiftCard,
    PlatformSettings,
    Sale,
    Trade,
    User,
)


# ─── Admin User Serializers ───


class AdminUserListSerializer(serializers.ModelSerializer):
    trust_tier_display = serializers.CharField(
        source="get_trust_tier_display", read_only=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "status",
            "is_verified",
            "trust_score",
            "trust_tier",
            "trust_tier_display",
            "wallet_balance",
            "phone",
            "phone_verified",
            "location",
            "daily_trade_count",
            "daily_trade_value",
            "date_joined",
            "last_login",
            "created_at",
        ]
        read_only_fields = fields


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["status", "trust_tier"]

    def validate_status(self, value):
        allowed = [c[0] for c in User.Status.choices]
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(allowed)}"
            )
        return value

    def validate_trust_tier(self, value):
        allowed = [c[0] for c in User.TrustTier.choices]
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid trust tier. Must be one of: {', '.join(str(a) for a in allowed)}"
            )
        return value


# ─── Admin Trade Serializer ───


class AdminTradeGiftCardSerializer(serializers.ModelSerializer):
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


class AdminEscrowSerializer(serializers.ModelSerializer):
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


class AdminTradeSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    initiator = serializers.CharField(source="initiator.username", read_only=True)
    responder = serializers.CharField(source="responder.username", read_only=True)
    initiator_card = AdminTradeGiftCardSerializer(read_only=True)
    responder_card = AdminTradeGiftCardSerializer(read_only=True)
    escrow = AdminEscrowSerializer(read_only=True)

    class Meta:
        model = Trade
        fields = [
            "type",
            "id",
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

    def get_type(self, obj):
        return "trade"


# ─── Admin Sale Serializer ───


class AdminSaleGiftCardSerializer(serializers.ModelSerializer):
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
        ]
        read_only_fields = fields


class AdminSaleSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    buyer = serializers.CharField(source="buyer.username", read_only=True)
    seller = serializers.CharField(source="seller.username", read_only=True)
    gift_card = AdminSaleGiftCardSerializer(read_only=True)

    class Meta:
        model = Sale
        fields = [
            "type",
            "id",
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

    def get_type(self, obj):
        return "sale"


# ─── Admin Dispute Serializers ───


class AdminDisputeListSerializer(serializers.ModelSerializer):
    raised_by = serializers.CharField(source="raised_by.username", read_only=True)
    resolved_by = serializers.CharField(
        source="resolved_by.username", read_only=True, default=None
    )
    trade_id = serializers.CharField(
        source="trade.trade_id", read_only=True, default=None
    )
    sale_id = serializers.CharField(
        source="sale.sale_id", read_only=True, default=None
    )

    class Meta:
        model = Dispute
        fields = [
            "id",
            "trade_id",
            "sale_id",
            "raised_by",
            "reason",
            "status",
            "resolution",
            "admin_response",
            "resolved_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AdminDisputeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = ["status", "resolution", "admin_response"]

    def validate_status(self, value):
        allowed = [c[0] for c in Dispute.Status.choices]
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(allowed)}"
            )
        return value

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and request.user:
            instance.resolved_by = request.user
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


# ─── Admin Fraud Flag Serializers ───


class AdminFraudFlagListSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source="user.username", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    reviewed_by = serializers.CharField(
        source="reviewed_by.username", read_only=True, default=None
    )

    class Meta:
        model = FraudFlag
        fields = [
            "id",
            "user",
            "user_id",
            "flag_type",
            "details",
            "status",
            "auto_restricted",
            "reviewed_by",
            "admin_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class AdminFraudFlagReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = FraudFlag
        fields = ["status", "admin_notes"]

    def validate_status(self, value):
        allowed = [c[0] for c in FraudFlag.Status.choices]
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid status. Must be one of: {', '.join(allowed)}"
            )
        return value

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and request.user:
            instance.reviewed_by = request.user
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


# ─── Admin Audit Log Serializer ───


class AdminAuditLogSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source="user.username", read_only=True, default=None)
    user_id = serializers.IntegerField(source="user.id", read_only=True, default=None)
    action_display = serializers.CharField(
        source="get_action_display", read_only=True
    )

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "user_id",
            "action",
            "action_display",
            "description",
            "ip_address",
            "user_agent",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields


# ─── Admin Revenue Serializer ───


class RevenueBreakdownSerializer(serializers.Serializer):
    period = serializers.CharField()
    trade_fees = serializers.DecimalField(max_digits=12, decimal_places=2)
    sale_fees = serializers.DecimalField(max_digits=12, decimal_places=2)
    total = serializers.DecimalField(max_digits=12, decimal_places=2)


class AdminRevenueSerializer(serializers.Serializer):
    total_trade_fees = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_sale_fees = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    daily = RevenueBreakdownSerializer(many=True)
    weekly = RevenueBreakdownSerializer(many=True)
    monthly = RevenueBreakdownSerializer(many=True)


# ─── Admin Dashboard Serializer ───


class AdminDashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    total_trades = serializers.IntegerField()
    active_trades = serializers.IntegerField()
    total_sales = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_disputes = serializers.IntegerField()
    fraud_flags_count = serializers.IntegerField()


# ─── Admin Platform Settings Serializers ───


class AdminPlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = [
            "id",
            "key",
            "value",
            "description",
            "category",
            "updated_at",
        ]
        read_only_fields = ["id", "key", "description", "category", "updated_at"]


class AdminPlatformSettingsListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = [
            "id",
            "key",
            "value",
            "description",
            "category",
            "updated_at",
        ]
        read_only_fields = fields
