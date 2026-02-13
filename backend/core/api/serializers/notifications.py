from rest_framework import serializers

from core.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
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


class NotificationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["is_read"]
