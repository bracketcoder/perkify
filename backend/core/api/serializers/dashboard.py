from rest_framework import serializers

from core.models import Notification


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for the main user dashboard stats."""

    wallet_balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    active_listings = serializers.IntegerField()
    pending_trades = serializers.IntegerField()
    completed_trades = serializers.IntegerField()
    total_earned = serializers.DecimalField(max_digits=10, decimal_places=2)


class DashboardNotificationSerializer(serializers.ModelSerializer):
    """Serializer for recent activity notifications on the dashboard."""

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "message",
            "is_read",
            "related_trade",
            "related_sale",
            "created_at",
        ]
        read_only_fields = fields
