from django.db.models import Q
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.api.pagination import StandardPagination
from core.api.serializers.sales import (
    SaleCreateSerializer,
    SaleDetailSerializer,
    SaleListSerializer,
)
from core.models import GiftCard, Sale


# ─── Sale List / Create ───


class SaleListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SaleCreateSerializer
        return SaleListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sale = serializer.save()
        return Response(
            SaleDetailSerializer(sale).data, status=status.HTTP_201_CREATED
        )

    def get_queryset(self):
        user = self.request.user
        qs = Sale.objects.filter(
            Q(buyer=user) | Q(seller=user)
        ).select_related(
            "buyer",
            "seller",
            "gift_card__brand",
            "gift_card__owner",
        )

        sale_status = self.request.query_params.get("status")
        if sale_status:
            qs = qs.filter(status=sale_status)
        return qs


# ─── Sale Detail ───


class SaleDetailView(generics.RetrieveAPIView):
    serializer_class = SaleDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "sale_id"

    def get_queryset(self):
        user = self.request.user
        return Sale.objects.filter(
            Q(buyer=user) | Q(seller=user)
        ).select_related(
            "buyer",
            "seller",
            "gift_card__brand",
            "gift_card__owner",
        )


# ─── Sale Confirm (Seller confirms, code released to buyer) ───


class SaleConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, sale_id):
        try:
            sale = Sale.objects.select_related(
                "buyer", "seller", "gift_card"
            ).get(sale_id=sale_id)
        except Sale.DoesNotExist:
            return Response(
                {"detail": "Sale not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if request.user != sale.seller:
            raise PermissionDenied("Only the seller can confirm this sale.")

        if sale.status != Sale.Status.PENDING:
            raise ValidationError("This sale is not in a pending state.")

        # Release the code and complete the sale
        sale.code_revealed = True
        sale.status = Sale.Status.COMPLETED
        sale.save(update_fields=["code_revealed", "status", "updated_at"])

        # Update card status to sold
        gift_card = sale.gift_card
        gift_card.status = GiftCard.Status.SOLD
        gift_card.save(update_fields=["status", "updated_at"])

        sale.refresh_from_db()
        return Response(
            SaleDetailSerializer(sale).data, status=status.HTTP_200_OK
        )
