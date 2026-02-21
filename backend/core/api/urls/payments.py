from django.urls import path

from core.api.views.payments import (
    PaymentStatusView,
    SaleCheckoutView,
    StripeConfigView,
    StripeWebhookView,
    TradeCheckoutView,
)

urlpatterns = [
    path("payments/config/", StripeConfigView.as_view(), name="stripe-config"),
    path(
        "payments/trade/<str:trade_id>/checkout/",
        TradeCheckoutView.as_view(),
        name="trade-checkout",
    ),
    path(
        "payments/sale/<str:sale_id>/checkout/",
        SaleCheckoutView.as_view(),
        name="sale-checkout",
    ),
    path("payments/status/", PaymentStatusView.as_view(), name="payment-status"),
    path("payments/webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
