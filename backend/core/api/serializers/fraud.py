from rest_framework import serializers

from core.models import FraudReport, GiftCard, User


class FraudReportCreateSerializer(serializers.ModelSerializer):
    reported_user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
    )
    reported_card = serializers.PrimaryKeyRelatedField(
        queryset=GiftCard.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = FraudReport
        fields = [
            "report_type",
            "description",
            "evidence",
            "reported_user",
            "reported_card",
        ]

    def validate_report_type(self, value):
        valid_types = [choice[0] for choice in FraudReport.ReportType.choices]
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Invalid report type. Must be one of: {', '.join(valid_types)}"
            )
        return value

    def validate_reported_user(self, value):
        if value is not None:
            request = self.context.get("request")
            if request and value == request.user:
                raise serializers.ValidationError("You cannot report yourself.")
        return value

    def validate(self, attrs):
        report_type = attrs.get("report_type")
        reported_user = attrs.get("reported_user")
        reported_card = attrs.get("reported_card")

        # Scam user reports should include a reported user
        if report_type == FraudReport.ReportType.SCAM_USER and not reported_user:
            raise serializers.ValidationError(
                {"reported_user": "A reported user is required for scam user reports."}
            )

        # Fake card / used card reports should include a reported card
        if report_type in (
            FraudReport.ReportType.FAKE_CARD,
            FraudReport.ReportType.USED_CARD,
        ) and not reported_card:
            raise serializers.ValidationError(
                {"reported_card": "A reported card is required for this report type."}
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        return FraudReport.objects.create(
            reporter=request.user,
            **validated_data,
        )


class FraudReportListSerializer(serializers.ModelSerializer):
    reporter = serializers.CharField(source="reporter.username", read_only=True)
    reported_user = serializers.SerializerMethodField()
    reported_card = serializers.SerializerMethodField()

    class Meta:
        model = FraudReport
        fields = [
            "id",
            "reporter",
            "reported_user",
            "reported_card",
            "report_type",
            "description",
            "evidence",
            "status",
            "admin_notes",
            "reviewed_by",
            "action_taken",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_reported_user(self, obj):
        if obj.reported_user:
            return {
                "id": obj.reported_user.pk,
                "username": obj.reported_user.username,
            }
        return None

    def get_reported_card(self, obj):
        if obj.reported_card:
            return {
                "id": obj.reported_card.pk,
                "brand": obj.reported_card.brand.name,
                "value": str(obj.reported_card.value),
            }
        return None
