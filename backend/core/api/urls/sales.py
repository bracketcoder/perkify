from django.urls import path

from core.api.views.sales import (
    SaleConfirmView,
    SaleDetailView,
    SaleListCreateView,
)

urlpatterns = [
    path("sales/", SaleListCreateView.as_view(), name="sale-list"),
    path(
        "sales/<str:sale_id>/",
        SaleDetailView.as_view(),
        name="sale-detail",
    ),
    path(
        "sales/<str:sale_id>/confirm/",
        SaleConfirmView.as_view(),
        name="sale-confirm",
    ),
]
