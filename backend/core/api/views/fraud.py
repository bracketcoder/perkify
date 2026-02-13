from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from core.api.pagination import StandardPagination
from core.api.serializers.fraud import (
    FraudReportCreateSerializer,
    FraudReportListSerializer,
)
from core.models import FraudReport


class FraudReportListCreateView(generics.ListCreateAPIView):
    """
    POST /api/fraud-reports/  -- Submit a new fraud report.
    GET  /api/fraud-reports/  -- List the authenticated user's own submitted reports.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FraudReportCreateSerializer
        return FraudReportListSerializer

    def get_queryset(self):
        return (
            FraudReport.objects.filter(reporter=self.request.user)
            .select_related("reporter", "reported_user", "reported_card__brand")
        )


class FraudReportDetailView(generics.RetrieveAPIView):
    """
    GET /api/fraud-reports/:id/  -- Retrieve detail of the user's own report.
    """

    serializer_class = FraudReportListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            FraudReport.objects.filter(reporter=self.request.user)
            .select_related("reporter", "reported_user", "reported_card__brand")
        )
