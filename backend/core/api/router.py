from django.urls import include, path

urlpatterns = [
    path("auth/", include("core.api.urls.auth")),
    path("admin/", include("core.api.urls.admin_api")),
    path("", include("core.api.urls.gift_cards")),
    path("", include("core.api.urls.trades")),
    path("", include("core.api.urls.sales")),
    path("", include("core.api.urls.matches")),
    path("", include("core.api.urls.notifications")),
    path("", include("core.api.urls.reviews")),
    path("", include("core.api.urls.dashboard")),
    path("", include("core.api.urls.fraud")),
]
