import django_filters
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from core.api.pagination import StandardPagination
from core.api.permissions import IsOwner
from core.api.serializers.gift_cards import (
    BrandSerializer,
    GiftCardCodeSerializer,
    GiftCardCreateSerializer,
    GiftCardDetailSerializer,
    GiftCardListSerializer,
    GiftCardUpdateSerializer,
    MarketplaceSerializer,
)
from django.utils import timezone

from core.models import Brand, GiftCard, Sale, Trade


# ─── Filters ───


class MarketplaceFilter(django_filters.FilterSet):
    brand = django_filters.NumberFilter(field_name="brand")
    listing_type = django_filters.CharFilter(field_name="listing_type")
    min_value = django_filters.NumberFilter(field_name="value", lookup_expr="gte")
    max_value = django_filters.NumberFilter(field_name="value", lookup_expr="lte")

    class Meta:
        model = GiftCard
        fields = ["brand", "listing_type", "min_value", "max_value"]


# ─── Brand List View ───


class BrandListView(generics.ListAPIView):
    """GET /api/brands/ -- Public list of active brands."""

    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    search_fields = ["name", "category"]


# ─── Gift Card List / Create View ───


class GiftCardListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/gift-cards/ -- List the authenticated user's own gift cards.
    POST /api/gift-cards/ -- Submit a new gift card listing.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return GiftCardCreateSerializer
        return GiftCardListSerializer

    def get_queryset(self):
        return (
            GiftCard.objects.filter(owner=self.request.user)
            .select_related("brand", "owner")
        )

    def perform_create(self, serializer):
        if not self.request.user.is_verified:
            raise PermissionDenied(
                "You must verify your email before listing gift cards."
            )
        serializer.save(owner=self.request.user)


# ─── Gift Card Detail / Update / Delete View ───


class GiftCardDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/gift-cards/:id/ -- Detail view (owner only).
    PATCH  /api/gift-cards/:id/ -- Update listing (owner only, not if in active trade).
    DELETE /api/gift-cards/:id/ -- Remove listing (owner only, only if status is 'active').
    """

    permission_classes = [IsAuthenticated, IsOwner]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return GiftCardUpdateSerializer
        return GiftCardDetailSerializer

    def get_queryset(self):
        return GiftCard.objects.select_related("brand", "owner")

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.status == GiftCard.Status.IN_TRADE:
            raise PermissionDenied(
                "Cannot update a gift card that is currently in an active trade."
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.status != GiftCard.Status.ACTIVE:
            raise PermissionDenied(
                "Only gift cards with 'active' status can be deleted."
            )

        return super().destroy(request, *args, **kwargs)


# ─── Marketplace View ───


class MarketplaceView(generics.ListAPIView):
    """GET /api/marketplace/ -- Browse available gift cards (public)."""

    serializer_class = MarketplaceSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardPagination
    filterset_class = MarketplaceFilter
    search_fields = ["brand__name"]
    ordering_fields = ["value", "selling_price", "created_at", "expiry_date"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = GiftCard.objects.filter(
            status=GiftCard.Status.ACTIVE,
            expiry_date__gte=timezone.now().date(),
        ).select_related("brand", "owner")

        # Exclude the current user's own cards if authenticated
        if self.request.user.is_authenticated:
            qs = qs.exclude(owner=self.request.user)

        return qs


# ─── Gift Card Code View ───


class GiftCardCodeView(generics.RetrieveAPIView):
    """
    GET /api/gift-cards/:id/code/ -- Get decrypted card number and PIN.
    Accessible by the card owner OR a buyer who completed a sale/trade for this card.
    """

    serializer_class = GiftCardCodeSerializer
    permission_classes = [IsAuthenticated]
    queryset = GiftCard.objects.all()

    def get_object(self):
        gift_card = super().get_object()
        user = self.request.user

        # Owner can always view their own card codes
        if gift_card.owner == user:
            return gift_card

        # Check if user is a buyer who completed a sale for this card
        has_completed_sale = Sale.objects.filter(
            gift_card=gift_card,
            buyer=user,
            status=Sale.Status.COMPLETED,
        ).exists()

        if has_completed_sale:
            return gift_card

        # Check if user completed a trade involving this card
        # The initiator receives the responder_card, and the responder receives the initiator_card
        has_completed_trade = (
            Trade.objects.filter(
                responder_card=gift_card,
                initiator=user,
                status=Trade.Status.COMPLETED,
            ).exists()
            or Trade.objects.filter(
                initiator_card=gift_card,
                responder=user,
                status=Trade.Status.COMPLETED,
            ).exists()
        )

        if has_completed_trade:
            return gift_card

        raise PermissionDenied(
            "You can only view card codes if you are the owner or have "
            "completed a sale or trade for this card."
        )

    def retrieve(self, request, *args, **kwargs):
        gift_card = self.get_object()
        data = {
            "card_number": gift_card.get_card_number(),
            "pin": gift_card.get_pin(),
        }
        serializer = self.get_serializer(data)
        return Response(serializer.data)
