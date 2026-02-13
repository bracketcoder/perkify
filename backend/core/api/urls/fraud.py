from django.urls import path

from core.api.views.fraud import FraudReportDetailView, FraudReportListCreateView

urlpatterns = [
    path(
        "fraud-reports/",
        FraudReportListCreateView.as_view(),
        name="fraud-report-list",
    ),
    path(
        "fraud-reports/<int:pk>/",
        FraudReportDetailView.as_view(),
        name="fraud-report-detail",
    ),
]
