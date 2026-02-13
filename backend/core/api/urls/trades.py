from django.urls import path

from core.api.views.trades import (
    TradeConfirmView,
    TradeDetailView,
    TradeDisputeView,
    TradeListCreateView,
    TradeReleaseView,
    TradeRespondView,
)

urlpatterns = [
    path("trades/", TradeListCreateView.as_view(), name="trade-list"),
    path(
        "trades/<str:trade_id>/",
        TradeDetailView.as_view(),
        name="trade-detail",
    ),
    path(
        "trades/<str:trade_id>/respond/",
        TradeRespondView.as_view(),
        name="trade-respond",
    ),
    path(
        "trades/<str:trade_id>/release/",
        TradeReleaseView.as_view(),
        name="trade-release",
    ),
    path(
        "trades/<str:trade_id>/confirm/",
        TradeConfirmView.as_view(),
        name="trade-confirm",
    ),
    path(
        "trades/<str:trade_id>/dispute/",
        TradeDisputeView.as_view(),
        name="trade-dispute",
    ),
]
