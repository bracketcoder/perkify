from django.urls import path

from core.api.views.gift_cards import (
    BrandListView,
    GiftCardCodeView,
    GiftCardDetailView,
    GiftCardListCreateView,
    MarketplaceView,
)

urlpatterns = [
    path("brands/", BrandListView.as_view(), name="brand-list"),
    path("marketplace/", MarketplaceView.as_view(), name="marketplace"),
    path("gift-cards/", GiftCardListCreateView.as_view(), name="gift-card-list"),
    path("gift-cards/<int:pk>/", GiftCardDetailView.as_view(), name="gift-card-detail"),
    path("gift-cards/<int:pk>/code/", GiftCardCodeView.as_view(), name="gift-card-code"),
]
