from decimal import Decimal

from django.db.models import Count, F, Q, Sum, Value
from django.db.models.functions import Coalesce, TruncDay, TruncMonth, TruncWeek
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.api.pagination import StandardPagination
from core.api.permissions import IsAdminUser
from core.api.serializers.admin_api import (
    AdminAuditLogSerializer,
    AdminDashboardSerializer,
    AdminDisputeListSerializer,
    AdminDisputeUpdateSerializer,
    AdminFraudFlagListSerializer,
    AdminFraudFlagReviewSerializer,
    AdminPlatformSettingsListSerializer,
    AdminPlatformSettingsSerializer,
    AdminRevenueSerializer,
    AdminSaleSerializer,
    AdminTradeSerializer,
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
)
from core.models import (
    AuditLog,
    Dispute,
    EscrowSession,
    FraudFlag,
    GiftCard,
    PlatformSettings,
    Sale,
    Trade,
    User,
)


# ─── 1. Admin User List ───
# GET /api/admin/users/


class AdminUserListView(generics.ListAPIView):
    """List all users with filters: role, status, trust_tier, is_verified, search."""

    serializer_class = AdminUserListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["role", "status", "trust_tier", "is_verified"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["date_joined", "username", "trust_score", "wallet_balance"]
    ordering = ["-date_joined"]

    def get_queryset(self):
        return User.objects.all()


# ─── 2. Admin User Update ───
# PATCH /api/admin/users/:id/


class AdminUserUpdateView(generics.UpdateAPIView):
    """Update user: freeze, unfreeze, ban, or change trust_tier."""

    serializer_class = AdminUserUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    http_method_names = ["patch"]

    def get_queryset(self):
        return User.objects.all()


# ─── 3. Admin Transactions (Trades + Sales Combined) ───
# GET /api/admin/transactions/


class AdminTransactionListView(APIView):
    """All trades and sales combined, with filters (status, date_from, date_to)."""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get("status")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        # Build trade queryset
        trades_qs = Trade.objects.select_related(
            "initiator",
            "responder",
            "initiator_card__brand",
            "initiator_card__owner",
            "responder_card__brand",
            "responder_card__owner",
            "escrow",
        ).all()

        # Build sale queryset
        sales_qs = Sale.objects.select_related(
            "buyer",
            "seller",
            "gift_card__brand",
            "gift_card__owner",
        ).all()

        if status_filter:
            trades_qs = trades_qs.filter(status=status_filter)
            sales_qs = sales_qs.filter(status=status_filter)

        if date_from:
            trades_qs = trades_qs.filter(created_at__date__gte=date_from)
            sales_qs = sales_qs.filter(created_at__date__gte=date_from)

        if date_to:
            trades_qs = trades_qs.filter(created_at__date__lte=date_to)
            sales_qs = sales_qs.filter(created_at__date__lte=date_to)

        # Paginate both querysets
        page_size = int(request.query_params.get("page_size", 20))
        page_size = min(page_size, 100)
        page = int(request.query_params.get("page", 1))
        offset = (page - 1) * page_size

        trade_data = AdminTradeSerializer(trades_qs, many=True).data
        sale_data = AdminSaleSerializer(sales_qs, many=True).data

        # Combine and sort by created_at descending
        combined = trade_data + sale_data
        combined.sort(key=lambda x: x["created_at"], reverse=True)

        total_count = len(combined)
        paginated = combined[offset: offset + page_size]

        return Response(
            {
                "count": total_count,
                "page": page,
                "page_size": page_size,
                "results": paginated,
            }
        )


# ─── 4. Reverse Trade ───
# POST /api/admin/trades/:trade_id/reverse/


class AdminTradeReverseView(APIView):
    """Reverse a trade: cancel trade, reverse escrow, restore cards to active."""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, trade_id):
        try:
            trade = Trade.objects.select_related(
                "initiator_card", "responder_card"
            ).get(trade_id=trade_id)
        except Trade.DoesNotExist:
            return Response(
                {"detail": "Trade not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if trade.status == Trade.Status.CANCELLED:
            return Response(
                {"detail": "Trade is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Set trade status to cancelled
        trade.status = Trade.Status.CANCELLED
        trade.save(update_fields=["status", "updated_at"])

        # Set escrow status to reversed if it exists
        try:
            escrow = trade.escrow
            escrow.status = EscrowSession.Status.REVERSED
            escrow.save(update_fields=["status"])
        except EscrowSession.DoesNotExist:
            pass

        # Restore both cards to active status
        trade.initiator_card.status = GiftCard.Status.ACTIVE
        trade.initiator_card.save(update_fields=["status", "updated_at"])

        trade.responder_card.status = GiftCard.Status.ACTIVE
        trade.responder_card.save(update_fields=["status", "updated_at"])

        return Response(
            {
                "detail": "Trade reversed successfully.",
                "trade_id": trade.trade_id,
                "trade_status": trade.status,
                "initiator_card_status": trade.initiator_card.status,
                "responder_card_status": trade.responder_card.status,
            },
            status=status.HTTP_200_OK,
        )


# ─── 5. Admin Disputes List ───
# GET /api/admin/disputes/


class AdminDisputeListView(generics.ListAPIView):
    """All disputes with status filter."""

    serializer_class = AdminDisputeListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["status"]
    ordering_fields = ["created_at", "updated_at", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Dispute.objects.select_related(
            "trade", "sale", "raised_by", "resolved_by"
        ).all()


# ─── 6. Admin Dispute Update ───
# PATCH /api/admin/disputes/:id/


class AdminDisputeUpdateView(generics.UpdateAPIView):
    """Resolve dispute: set status, resolution, admin_response, resolved_by."""

    serializer_class = AdminDisputeUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    http_method_names = ["patch"]

    def get_queryset(self):
        return Dispute.objects.select_related(
            "trade", "sale", "raised_by", "resolved_by"
        ).all()


# ─── 7. Admin Fraud Flags List ───
# GET /api/admin/fraud-flags/


class AdminFraudFlagListView(generics.ListAPIView):
    """All fraud flags with filters (flag_type, status)."""

    serializer_class = AdminFraudFlagListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["flag_type", "status"]
    ordering_fields = ["created_at", "updated_at", "flag_type", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return FraudFlag.objects.select_related("user", "reviewed_by").all()


# ─── 8. Admin Fraud Flag Review ───
# PATCH /api/admin/fraud-flags/:id/review/


class AdminFraudFlagReviewView(generics.UpdateAPIView):
    """Review a fraud flag: set status, admin_notes, reviewed_by."""

    serializer_class = AdminFraudFlagReviewSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    http_method_names = ["patch"]

    def get_queryset(self):
        return FraudFlag.objects.select_related("user", "reviewed_by").all()


# ─── 9. Admin Audit Log ───
# GET /api/admin/audit-log/


class AdminAuditLogListView(generics.ListAPIView):
    """Full audit trail, read-only. Filters: action, user, date range."""

    serializer_class = AdminAuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["action", "user"]
    ordering_fields = ["created_at", "action"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = AuditLog.objects.select_related("user").all()

        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        return qs


# ─── 10. Admin Revenue ───
# GET /api/admin/revenue/


class AdminRevenueView(APIView):
    """Revenue stats: total fees from trades/sales, daily/weekly/monthly breakdown."""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        zero = Decimal("0.00")

        # Total trade fees from completed trades
        trade_fees_agg = Trade.objects.filter(
            status=Trade.Status.COMPLETED
        ).aggregate(
            total=Coalesce(
                Sum(F("platform_fee_initiator") + F("platform_fee_responder")),
                Value(zero),
            )
        )
        total_trade_fees = trade_fees_agg["total"]

        # Total sale fees from completed sales
        sale_fees_agg = Sale.objects.filter(
            status=Sale.Status.COMPLETED
        ).aggregate(
            total=Coalesce(Sum("platform_fee"), Value(zero))
        )
        total_sale_fees = sale_fees_agg["total"]

        total_revenue = total_trade_fees + total_sale_fees

        # Daily breakdown
        daily = self._get_breakdown(TruncDay)
        # Weekly breakdown
        weekly = self._get_breakdown(TruncWeek)
        # Monthly breakdown
        monthly = self._get_breakdown(TruncMonth)

        data = {
            "total_trade_fees": total_trade_fees,
            "total_sale_fees": total_sale_fees,
            "total_revenue": total_revenue,
            "daily": daily,
            "weekly": weekly,
            "monthly": monthly,
        }

        serializer = AdminRevenueSerializer(data)
        return Response(serializer.data)

    def _get_breakdown(self, trunc_func):
        zero = Decimal("0.00")

        trade_breakdown = (
            Trade.objects.filter(status=Trade.Status.COMPLETED)
            .annotate(period=trunc_func("created_at"))
            .values("period")
            .annotate(
                trade_fees=Coalesce(
                    Sum(F("platform_fee_initiator") + F("platform_fee_responder")),
                    Value(zero),
                )
            )
            .order_by("-period")[:30]
        )

        sale_breakdown = (
            Sale.objects.filter(status=Sale.Status.COMPLETED)
            .annotate(period=trunc_func("created_at"))
            .values("period")
            .annotate(
                sale_fees=Coalesce(Sum("platform_fee"), Value(zero))
            )
            .order_by("-period")[:30]
        )

        # Merge trade and sale breakdowns by period
        periods = {}
        for entry in trade_breakdown:
            p = entry["period"].isoformat()
            periods[p] = {
                "period": p,
                "trade_fees": entry["trade_fees"],
                "sale_fees": zero,
                "total": entry["trade_fees"],
            }

        for entry in sale_breakdown:
            p = entry["period"].isoformat()
            if p in periods:
                periods[p]["sale_fees"] = entry["sale_fees"]
                periods[p]["total"] = periods[p]["trade_fees"] + entry["sale_fees"]
            else:
                periods[p] = {
                    "period": p,
                    "trade_fees": zero,
                    "sale_fees": entry["sale_fees"],
                    "total": entry["sale_fees"],
                }

        # Sort by period descending
        result = sorted(periods.values(), key=lambda x: x["period"], reverse=True)
        return result


# ─── 11. Admin Dashboard ───
# GET /api/admin/dashboard/


class AdminDashboardView(APIView):
    """Overview stats for the admin dashboard."""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        zero = Decimal("0.00")

        total_users = User.objects.count()
        active_users = User.objects.filter(status=User.Status.ACTIVE).count()
        total_trades = Trade.objects.count()
        active_trades = Trade.objects.filter(
            status__in=[
                Trade.Status.PROPOSED,
                Trade.Status.ACCEPTED,
                Trade.Status.IN_ESCROW,
                Trade.Status.CODES_RELEASED,
                Trade.Status.CONFIRMING,
            ]
        ).count()
        total_sales = Sale.objects.count()

        # Revenue: trade fees from completed trades
        trade_revenue = Trade.objects.filter(
            status=Trade.Status.COMPLETED
        ).aggregate(
            total=Coalesce(
                Sum(F("platform_fee_initiator") + F("platform_fee_responder")),
                Value(zero),
            )
        )["total"]

        # Revenue: sale fees from completed sales
        sale_revenue = Sale.objects.filter(
            status=Sale.Status.COMPLETED
        ).aggregate(
            total=Coalesce(Sum("platform_fee"), Value(zero))
        )["total"]

        total_revenue = trade_revenue + sale_revenue

        pending_disputes = Dispute.objects.filter(
            status__in=[Dispute.Status.OPEN, Dispute.Status.UNDER_REVIEW]
        ).count()

        fraud_flags_count = FraudFlag.objects.filter(
            status=FraudFlag.Status.PENDING
        ).count()

        data = {
            "total_users": total_users,
            "active_users": active_users,
            "total_trades": total_trades,
            "active_trades": active_trades,
            "total_sales": total_sales,
            "total_revenue": total_revenue,
            "pending_disputes": pending_disputes,
            "fraud_flags_count": fraud_flags_count,
        }

        serializer = AdminDashboardSerializer(data)
        return Response(serializer.data)


# ─── 12. Admin Platform Settings List ───
# GET /api/admin/settings/


class AdminPlatformSettingsListView(generics.ListAPIView):
    """List all platform settings."""

    serializer_class = AdminPlatformSettingsListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category"]

    def get_queryset(self):
        return PlatformSettings.objects.all()


# ─── 13. Admin Platform Settings Update ───
# PATCH /api/admin/settings/:id/


class AdminPlatformSettingsUpdateView(generics.UpdateAPIView):
    """Update a single platform setting's value."""

    serializer_class = AdminPlatformSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    http_method_names = ["patch"]

    def get_queryset(self):
        return PlatformSettings.objects.all()
