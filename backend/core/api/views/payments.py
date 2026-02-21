import stripe
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Payment, Sale, Trade

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeConfigView(APIView):
    """Return Stripe publishable key to the frontend."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {"publishable_key": settings.STRIPE_PUBLISHABLE_KEY}
        )


class TradeCheckoutView(APIView):
    """Create a Stripe Checkout session for a trade fee."""

    permission_classes = [IsAuthenticated]

    def post(self, request, trade_id):
        try:
            trade = Trade.objects.select_related(
                "initiator", "responder"
            ).get(trade_id=trade_id)
        except Trade.DoesNotExist:
            return Response(
                {"detail": "Trade not found."}, status=status.HTTP_404_NOT_FOUND
            )

        user = request.user
        if user not in (trade.initiator, trade.responder):
            return Response(
                {"detail": "You are not a participant in this trade."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if trade.status != Trade.Status.PROPOSED:
            return Response(
                {"detail": "Trade must be in proposed state to pay the fee."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_initiator = user == trade.initiator
        if is_initiator and trade.initiator_paid:
            return Response(
                {"detail": "You have already paid the fee for this trade."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not is_initiator and trade.responder_paid:
            return Response(
                {"detail": "You have already paid the fee for this trade."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fee_amount = trade.platform_fee_initiator if is_initiator else trade.platform_fee_responder
        card = trade.initiator_card if is_initiator else trade.responder_card

        # Create Payment record
        payment = Payment.objects.create(
            user=user,
            trade=trade,
            payment_type=Payment.PaymentType.TRADE_FEE,
            amount=fee_amount,
            status=Payment.Status.PENDING,
        )

        frontend_url = settings.FRONTEND_URL

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {
                                "name": f"Perkify Trade Fee – {trade.trade_id}",
                                "description": f"5% platform fee for swapping your ${card.value} gift card",
                            },
                            "unit_amount": int(fee_amount * 100),
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=f"{frontend_url}/dashboard/trades/{trade.trade_id}?payment=success",
                cancel_url=f"{frontend_url}/dashboard/trades/{trade.trade_id}?payment=cancelled",
                metadata={
                    "payment_id": payment.payment_id,
                    "trade_id": trade.trade_id,
                    "user_id": str(user.id),
                    "payment_type": "trade_fee",
                },
            )

            payment.stripe_checkout_session_id = checkout_session.id
            payment.save(update_fields=["stripe_checkout_session_id"])

            return Response(
                {
                    "checkout_url": checkout_session.url,
                    "session_id": checkout_session.id,
                    "payment_id": payment.payment_id,
                }
            )

        except stripe.error.StripeError as e:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status"])
            return Response(
                {"detail": f"Payment error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class SaleCheckoutView(APIView):
    """Create a Stripe Checkout session for a sale purchase."""

    permission_classes = [IsAuthenticated]

    def post(self, request, sale_id):
        try:
            sale = Sale.objects.select_related(
                "buyer", "seller", "gift_card__brand"
            ).get(sale_id=sale_id)
        except Sale.DoesNotExist:
            return Response(
                {"detail": "Sale not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if request.user != sale.buyer:
            return Response(
                {"detail": "Only the buyer can pay for this sale."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if sale.status != Sale.Status.PENDING:
            return Response(
                {"detail": "Sale must be in pending state to pay."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if already paid
        existing = Payment.objects.filter(
            sale=sale, user=request.user, status=Payment.Status.COMPLETED
        ).exists()
        if existing:
            return Response(
                {"detail": "Payment already completed for this sale."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = Payment.objects.create(
            user=request.user,
            sale=sale,
            payment_type=Payment.PaymentType.SALE_PAYMENT,
            amount=sale.amount,
            status=Payment.Status.PENDING,
        )

        frontend_url = settings.FRONTEND_URL

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {
                                "name": f"Perkify Purchase – {sale.gift_card.brand.name} Gift Card",
                                "description": f"Purchase of ${sale.gift_card.value} gift card (includes 5% platform fee)",
                            },
                            "unit_amount": int(sale.amount * 100),
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                success_url=f"{frontend_url}/dashboard/transactions?payment=success",
                cancel_url=f"{frontend_url}/dashboard/transactions?payment=cancelled",
                metadata={
                    "payment_id": payment.payment_id,
                    "sale_id": sale.sale_id,
                    "user_id": str(request.user.id),
                    "payment_type": "sale_payment",
                },
            )

            payment.stripe_checkout_session_id = checkout_session.id
            payment.save(update_fields=["stripe_checkout_session_id"])

            return Response(
                {
                    "checkout_url": checkout_session.url,
                    "session_id": checkout_session.id,
                    "payment_id": payment.payment_id,
                }
            )

        except stripe.error.StripeError as e:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status"])
            return Response(
                {"detail": f"Payment error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """Handle Stripe webhook events."""

    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            if settings.STRIPE_WEBHOOK_SECRET:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
                )
            else:
                import json
                event = stripe.Event.construct_from(
                    json.loads(payload), stripe.api_key
                )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(
                {"detail": "Invalid webhook signature."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            self._handle_checkout_completed(session)

        return Response({"status": "ok"})

    def _handle_checkout_completed(self, session):
        metadata = session.get("metadata", {})
        payment_id = metadata.get("payment_id")

        if not payment_id:
            return

        try:
            payment = Payment.objects.get(payment_id=payment_id)
        except Payment.DoesNotExist:
            return

        payment.status = Payment.Status.COMPLETED
        payment.stripe_payment_intent_id = session.get("payment_intent", "")
        payment.save(update_fields=["status", "stripe_payment_intent_id", "updated_at"])

        payment_type = metadata.get("payment_type")

        if payment_type == "trade_fee" and payment.trade:
            self._handle_trade_fee_paid(payment)
        elif payment_type == "sale_payment" and payment.sale:
            self._handle_sale_paid(payment)

    def _handle_trade_fee_paid(self, payment):
        trade = payment.trade
        is_initiator = payment.user_id == trade.initiator_id

        if is_initiator:
            trade.initiator_paid = True
        else:
            trade.responder_paid = True
        trade.save(update_fields=["initiator_paid", "responder_paid", "updated_at"])

    def _handle_sale_paid(self, payment):
        sale = payment.sale
        sale.status = Sale.Status.ACCEPTED
        sale.save(update_fields=["status", "updated_at"])


class PaymentStatusView(APIView):
    """Check payment status for a trade or sale."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        trade_id = request.query_params.get("trade_id")
        sale_id = request.query_params.get("sale_id")

        if trade_id:
            payments = Payment.objects.filter(
                trade__trade_id=trade_id, user=request.user
            ).order_by("-created_at")
        elif sale_id:
            payments = Payment.objects.filter(
                sale__sale_id=sale_id, user=request.user
            ).order_by("-created_at")
        else:
            return Response(
                {"detail": "Provide trade_id or sale_id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = [
            {
                "payment_id": p.payment_id,
                "amount": str(p.amount),
                "status": p.status,
                "payment_type": p.payment_type,
                "created_at": p.created_at.isoformat(),
            }
            for p in payments
        ]
        return Response(data)
