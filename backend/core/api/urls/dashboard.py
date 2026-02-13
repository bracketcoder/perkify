from django.urls import path

from core.api.views.dashboard import DashboardActivityView, DashboardStatsView

urlpatterns = [
    path("dashboard/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("dashboard/activity/", DashboardActivityView.as_view(), name="dashboard-activity"),
]
