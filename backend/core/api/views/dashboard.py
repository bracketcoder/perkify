from decimal import Decimal

from django.db.models import Q, Sum

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.api.serializers.dashboard import (
    DashboardNotificationSerializer,
    DashboardStatsSerializer,
)
from core.models import GiftCard, Notification, Sale, Trade


class DashboardStatsView(APIView):
    """
    GET /api/dashboard/

    Returns the authenticated user's dashboard stats:
    - wallet_balance: current wallet balance
    - active_listings: count of gift cards with status=active owned by user
    - pending_trades: count of trades in non-terminal status involving the user
    - completed_trades: count of completed trades involving the user
    - total_earned: sum of amounts from completed sales where user is the seller
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        active_listings = GiftCard.objects.filter(
            owner=user, status=GiftCard.Status.ACTIVE
        ).count()

        user_trades = Trade.objects.filter(Q(initiator=user) | Q(responder=user))

        pending_trades = user_trades.filter(
            status__in=[
                Trade.Status.PROPOSED,
                Trade.Status.ACCEPTED,
                Trade.Status.IN_ESCROW,
                Trade.Status.CODES_RELEASED,
                Trade.Status.CONFIRMING,
            ]
        ).count()

        completed_trades = user_trades.filter(
            status=Trade.Status.COMPLETED
        ).count()

        total_earned = (
            Sale.objects.filter(
                seller=user, status=Sale.Status.COMPLETED
            ).aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )

        data = {
            "wallet_balance": user.wallet_balance,
            "active_listings": active_listings,
            "pending_trades": pending_trades,
            "completed_trades": completed_trades,
            "total_earned": total_earned,
        }

        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class DashboardActivityView(APIView):
    """
    GET /api/dashboard/activity/

    Returns the last 10 notifications for the authenticated user,
    ordered by most recent first.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(
            user=request.user
        ).select_related("related_trade", "related_sale")[:10]

        serializer = DashboardNotificationSerializer(notifications, many=True)
        return Response(serializer.data)
