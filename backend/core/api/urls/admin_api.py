from django.urls import path

from core.api.views.admin_api import (
    AdminAuditLogListView,
    AdminDashboardView,
    AdminDisputeListView,
    AdminDisputeUpdateView,
    AdminFraudFlagListView,
    AdminFraudFlagReviewView,
    AdminPlatformSettingsListView,
    AdminPlatformSettingsUpdateView,
    AdminRevenueView,
    AdminTradeReverseView,
    AdminTransactionListView,
    AdminUserListView,
    AdminUserUpdateView,
)

urlpatterns = [
    # Users
    path("users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("users/<int:pk>/", AdminUserUpdateView.as_view(), name="admin-user-update"),
    # Transactions (combined trades + sales)
    path(
        "transactions/",
        AdminTransactionListView.as_view(),
        name="admin-transaction-list",
    ),
    # Trade reversal
    path(
        "trades/<str:trade_id>/reverse/",
        AdminTradeReverseView.as_view(),
        name="admin-trade-reverse",
    ),
    # Disputes
    path("disputes/", AdminDisputeListView.as_view(), name="admin-dispute-list"),
    path(
        "disputes/<int:pk>/",
        AdminDisputeUpdateView.as_view(),
        name="admin-dispute-update",
    ),
    # Fraud flags
    path(
        "fraud-flags/",
        AdminFraudFlagListView.as_view(),
        name="admin-fraud-flag-list",
    ),
    path(
        "fraud-flags/<int:pk>/review/",
        AdminFraudFlagReviewView.as_view(),
        name="admin-fraud-flag-review",
    ),
    # Audit log
    path("audit-log/", AdminAuditLogListView.as_view(), name="admin-audit-log"),
    # Revenue
    path("revenue/", AdminRevenueView.as_view(), name="admin-revenue"),
    # Dashboard
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    # Platform settings
    path(
        "settings/",
        AdminPlatformSettingsListView.as_view(),
        name="admin-settings-list",
    ),
    path(
        "settings/<int:pk>/",
        AdminPlatformSettingsUpdateView.as_view(),
        name="admin-settings-update",
    ),
]
