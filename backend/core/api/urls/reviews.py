from django.urls import path

from core.api.views.reviews import (
    ReviewDetailView,
    ReviewListCreateView,
    SellerRatingSummaryView,
)

urlpatterns = [
    path("reviews/", ReviewListCreateView.as_view(), name="review-list"),
    path("reviews/<int:pk>/", ReviewDetailView.as_view(), name="review-detail"),
    path(
        "seller/rating-summary/",
        SellerRatingSummaryView.as_view(),
        name="seller-rating-summary",
    ),
]
