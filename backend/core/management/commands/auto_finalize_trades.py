"""
Management command: auto_finalize_trades

Scans all trades in ``confirming`` status whose escrow confirmation_deadline
has passed.  If no dispute has been filed, the trade is automatically
finalized: status set to ``completed``, escrow set to ``finalized``,
both parties marked as confirmed, and the gift cards marked as ``swapped``.

Usage:
    python manage.py auto_finalize_trades
    python manage.py auto_finalize_trades --dry-run
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.fraud_detection import check_and_upgrade_trust_tier
from core.models import Dispute, EscrowSession, GiftCard, Trade


class Command(BaseCommand):
    help = (
        "Auto-finalize trades whose confirmation window has expired "
        "without a dispute being filed."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would happen without making changes.",
        )

    def handle(self, *args, **options):
        now = timezone.now()
        dry_run = options["dry_run"]

        # Find all trades in "confirming" status with an expired
        # confirmation deadline on the escrow.
        eligible_trades = Trade.objects.filter(
            status=Trade.Status.CONFIRMING,
            escrow__confirmation_deadline__lt=now,
        ).select_related(
            "escrow",
            "initiator",
            "responder",
            "initiator_card",
            "responder_card",
        )

        finalized_count = 0
        skipped_count = 0

        for trade in eligible_trades:
            # Check if a dispute has been filed for this trade.
            has_dispute = Dispute.objects.filter(trade=trade).exclude(
                status=Dispute.Status.DISMISSED,
            ).exists()

            if has_dispute:
                self.stdout.write(
                    f"  SKIP  {trade.trade_id} -- dispute filed, skipping."
                )
                skipped_count += 1
                continue

            self.stdout.write(
                f"  AUTO  {trade.trade_id} "
                f"({trade.initiator.username} <-> {trade.responder.username})"
            )

            if dry_run:
                finalized_count += 1
                continue

            # ── Finalize the trade ──
            trade.status = Trade.Status.COMPLETED
            trade.initiator_confirmed = True
            trade.responder_confirmed = True
            trade.save(
                update_fields=[
                    "status",
                    "initiator_confirmed",
                    "responder_confirmed",
                    "updated_at",
                ]
            )

            # ── Finalize the escrow ──
            escrow = trade.escrow
            escrow.status = EscrowSession.Status.FINALIZED
            escrow.finalized_at = now
            escrow.save(update_fields=["status", "finalized_at"])

            # ── Swap card ownership / mark as swapped ──
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

            finalized_count += 1

        # ── Summary ──
        self.stdout.write(f"\n{'=' * 50}")
        self.stdout.write(f"Auto-Finalize Trades Summary ({now:%Y-%m-%d %H:%M})")
        self.stdout.write(f"  Finalized:  {finalized_count}")
        self.stdout.write(f"  Skipped:    {skipped_count}")
        if dry_run:
            self.stdout.write(self.style.WARNING("  [DRY RUN] No changes made."))
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"  Auto-finalized {finalized_count} trade(s)."
                )
            )
        self.stdout.write(f"{'=' * 50}")
