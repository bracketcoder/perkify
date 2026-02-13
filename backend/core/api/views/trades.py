from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.api.pagination import StandardPagination
from core.api.serializers.trades import (
    TradeCreateSerializer,
    TradeDetailSerializer,
    TradeListSerializer,
    TradeRespondSerializer,
)
from core.fraud_detection import check_and_upgrade_trust_tier
from core.models import Dispute, EscrowSession, GiftCard, PlatformSettings, Trade, User


# ─── Trade List / Create ───


class TradeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TradeCreateSerializer
        return TradeListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trade = serializer.save()
        return Response(
            TradeDetailSerializer(trade).data, status=status.HTTP_201_CREATED
        )

    def get_queryset(self):
        user = self.request.user
        qs = Trade.objects.filter(
            Q(initiator=user) | Q(responder=user)
        ).select_related(
            "initiator",
            "responder",
            "initiator_card__brand",
            "initiator_card__owner",
            "responder_card__brand",
            "responder_card__owner",
            "escrow",
        )

        trade_status = self.request.query_params.get("status")
        if trade_status:
            qs = qs.filter(status=trade_status)
        return qs


# ─── Trade Detail ───


class TradeDetailView(generics.RetrieveAPIView):
    serializer_class = TradeDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "trade_id"

    def get_queryset(self):
        user = self.request.user
        return Trade.objects.filter(
            Q(initiator=user) | Q(responder=user)
        ).select_related(
            "initiator",
            "responder",
            "initiator_card__brand",
            "initiator_card__owner",
            "responder_card__brand",
            "responder_card__owner",
            "escrow",
        )


# ─── Trade Respond (Accept / Decline) ───


class TradeRespondView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, trade_id):
        try:
            trade = Trade.objects.select_related(
                "initiator",
                "responder",
                "initiator_card",
                "responder_card",
            ).get(trade_id=trade_id)
        except Trade.DoesNotExist:
            return Response(
                {"detail": "Trade not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if request.user != trade.responder:
            raise PermissionDenied("Only the responder can accept or decline this trade.")

        if trade.status != Trade.Status.PROPOSED:
            raise ValidationError("This trade is not in a proposed state.")

        serializer = TradeRespondSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data["action"]

        if action == "decline":
            trade.status = Trade.Status.CANCELLED
            trade.save(update_fields=["status", "updated_at"])
            return Response(
                TradeDetailSerializer(trade).data, status=status.HTTP_200_OK
            )

        # action == "accept"
        # Enforce responder's daily limits
        responder = request.user
        responder.reset_daily_limits_if_needed()
        if responder.daily_trade_count >= responder.max_daily_trades:
            raise ValidationError("You have reached your daily trade limit.")
        card_value = trade.responder_card.value
        if responder.daily_trade_value + card_value > responder.max_daily_value:
            raise ValidationError("Accepting this trade would exceed your daily trade value limit.")

        # Enforce responder's active trade limit
        active_statuses = [
            Trade.Status.PROPOSED,
            Trade.Status.ACCEPTED,
            Trade.Status.IN_ESCROW,
            Trade.Status.CODES_RELEASED,
            Trade.Status.CONFIRMING,
        ]
        active_count = Trade.objects.filter(
            Q(initiator=responder) | Q(responder=responder),
            status__in=active_statuses,
        ).exclude(trade_id=trade_id).count()
        if active_count >= responder.max_active_trades:
            raise ValidationError(
                "You have reached your active trade limit. "
                "Complete or cancel existing trades before accepting new ones."
            )

        # Validate both cards are still active
        if trade.initiator_card.status != GiftCard.Status.ACTIVE:
            raise ValidationError("The initiator's gift card is no longer active.")
        if trade.responder_card.status != GiftCard.Status.ACTIVE:
            raise ValidationError("Your gift card is no longer active.")

        # Lock cards
        trade.initiator_card.status = GiftCard.Status.IN_TRADE
        trade.initiator_card.save(update_fields=["status", "updated_at"])
        trade.responder_card.status = GiftCard.Status.IN_TRADE
        trade.responder_card.save(update_fields=["status", "updated_at"])

        # Create escrow session
        EscrowSession.objects.create(
            trade=trade,
            status=EscrowSession.Status.LOCKED,
        )

        trade.status = Trade.Status.IN_ESCROW
        trade.save(update_fields=["status", "updated_at"])

        # Update responder's daily limits
        responder.daily_trade_count += 1
        responder.daily_trade_value += card_value
        responder.save(update_fields=["daily_trade_count", "daily_trade_value"])

        # Reload with escrow for serialization
        trade.refresh_from_db()
        return Response(
            TradeDetailSerializer(trade).data, status=status.HTTP_200_OK
        )


# ─── Release Codes ───


class TradeReleaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, trade_id):
        try:
            trade = Trade.objects.select_related(
                "initiator", "responder", "escrow"
            ).get(trade_id=trade_id)
        except Trade.DoesNotExist:
            return Response(
                {"detail": "Trade not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if request.user not in (trade.initiator, trade.responder):
            raise PermissionDenied("You are not a participant in this trade.")

        if trade.status != Trade.Status.IN_ESCROW:
            raise ValidationError("Codes can only be released when trade is in escrow.")

        escrow = trade.escrow
        escrow.status = EscrowSession.Status.RELEASED
        escrow.released_at = timezone.now()
        escrow.save(update_fields=["status", "released_at"])

        trade.status = Trade.Status.CODES_RELEASED
        trade.save(update_fields=["status", "updated_at"])

        trade.refresh_from_db()
        return Response(
            TradeDetailSerializer(trade).data, status=status.HTTP_200_OK
        )


# ─── Confirm Trade ───


class TradeConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, trade_id):
        try:
            trade = Trade.objects.select_related(
                "initiator",
                "responder",
                "initiator_card",
                "responder_card",
                "escrow",
            ).get(trade_id=trade_id)
        except Trade.DoesNotExist:
            return Response(
                {"detail": "Trade not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if request.user not in (trade.initiator, trade.responder):
            raise PermissionDenied("You are not a participant in this trade.")

        if trade.status not in (Trade.Status.CODES_RELEASED, Trade.Status.CONFIRMING):
            raise ValidationError(
                "Trade must be in codes_released or confirming state to confirm."
            )

        escrow = trade.escrow

        # Check if confirmation window has expired
        if escrow.confirmation_deadline and escrow.is_confirmation_expired:
            raise ValidationError("The confirmation window has expired.")

        # Determine which party is confirming
        is_initiator = request.user == trade.initiator
        if is_initiator:
            if trade.initiator_confirmed:
                raise ValidationError("You have already confirmed this trade.")
            trade.initiator_confirmed = True
        else:
            if trade.responder_confirmed:
                raise ValidationError("You have already confirmed this trade.")
            trade.responder_confirmed = True

        # First confirmation starts the configurable deadline
        first_confirmation = not (
            trade.initiator_confirmed and trade.responder_confirmed
        ) and (
            (is_initiator and not trade.responder_confirmed)
            or (not is_initiator and not trade.initiator_confirmed)
        )

        if first_confirmation and not escrow.confirmation_deadline:
            window_minutes = int(PlatformSettings.get("confirmation_window_minutes", "60"))
            escrow.status = EscrowSession.Status.CONFIRMING
            escrow.confirmation_deadline = timezone.now() + timedelta(minutes=window_minutes)
            escrow.save(update_fields=["status", "confirmation_deadline"])
            trade.status = Trade.Status.CONFIRMING

        # Check if both parties have confirmed
        if trade.initiator_confirmed and trade.responder_confirmed:
            trade.status = Trade.Status.COMPLETED
            escrow.status = EscrowSession.Status.FINALIZED
            escrow.finalized_at = timezone.now()
            escrow.save(update_fields=["status", "finalized_at"])

            # Swap card ownership
            initiator_card = trade.initiator_card
            responder_card = trade.responder_card

            initiator_card.owner = trade.responder
            initiator_card.status = GiftCard.Status.SWAPPED
            initiator_card.save(update_fields=["owner", "status", "updated_at"])

            responder_card.owner = trade.initiator
            responder_card.status = GiftCard.Status.SWAPPED
            responder_card.save(update_fields=["owner", "status", "updated_at"])

            # Check trust tier upgrades for both participants
            check_and_upgrade_trust_tier(trade.initiator)
            check_and_upgrade_trust_tier(trade.responder)

        trade.save(
            update_fields=[
                "status",
                "initiator_confirmed",
                "responder_confirmed",
                "updated_at",
            ]
        )

        trade.refresh_from_db()
        return Response(
            TradeDetailSerializer(trade).data, status=status.HTTP_200_OK
        )


# ─── Dispute Trade ───


class TradeDisputeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, trade_id):
        try:
            trade = Trade.objects.select_related(
                "initiator", "responder", "escrow"
            ).get(trade_id=trade_id)
        except Trade.DoesNotExist:
            return Response(
                {"detail": "Trade not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if request.user not in (trade.initiator, trade.responder):
            raise PermissionDenied("You are not a participant in this trade.")

        if trade.status not in (
            Trade.Status.CODES_RELEASED,
            Trade.Status.CONFIRMING,
        ):
            raise ValidationError(
                "Disputes can only be filed during the confirmation window "
                "(codes_released or confirming status)."
            )

        reason = request.data.get("reason", "").strip()
        if not reason:
            raise ValidationError({"reason": "A reason is required to file a dispute."})

        # Create the Dispute record
        Dispute.objects.create(
            trade=trade,
            raised_by=request.user,
            reason=reason,
            status=Dispute.Status.OPEN,
        )

        trade.status = Trade.Status.DISPUTED
        trade.save(update_fields=["status", "updated_at"])

        # Temporarily restrict both parties pending admin review
        for party in (trade.initiator, trade.responder):
            if party.status == User.Status.ACTIVE:
                party.status = User.Status.RESTRICTED
                party.save(update_fields=["status"])

        # Reverse escrow if it exists
        if hasattr(trade, "escrow"):
            escrow = trade.escrow
            escrow.status = EscrowSession.Status.REVERSED
            escrow.save(update_fields=["status"])

        trade.refresh_from_db()
        return Response(
            TradeDetailSerializer(trade).data, status=status.HTTP_200_OK
        )
