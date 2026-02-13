"""
Management command: check_expiry

Scans all gift cards with status="active" whose expiry_date has passed and
marks them as "expired".  Optionally previews changes with --dry-run, and
warns about cards expiring within a configurable number of days.

Usage:
    python manage.py check_expiry
    python manage.py check_expiry --dry-run
    python manage.py check_expiry --warn-days 14
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import GiftCard


class Command(BaseCommand):
    help = "Auto-expire gift cards whose expiry_date has passed."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would happen without making changes.",
        )
        parser.add_argument(
            "--warn-days",
            type=int,
            default=7,
            help="Number of days before expiry to flag as warning (default: 7).",
        )

    def handle(self, *args, **options):
        today = timezone.now().date()
        dry_run = options["dry_run"]
        warn_days = options["warn_days"]

        # ── 1. Auto-expire active gift cards whose expiry_date < today ──
        expired_qs = GiftCard.objects.filter(
            status=GiftCard.Status.ACTIVE,
            expiry_date__lt=today,
        )
        expired_count = expired_qs.count()

        if expired_count:
            self.stdout.write(
                f"\nFound {expired_count} expired gift card(s) to disable:"
            )
            for card in expired_qs.select_related("brand", "owner"):
                self.stdout.write(
                    f"  - {card.brand.name} ${card.value} "
                    f"(expired {card.expiry_date}, owner: {card.owner.username})"
                )

            if not dry_run:
                expired_qs.update(status=GiftCard.Status.EXPIRED)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Expired {expired_count} gift card(s)."
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING("[DRY RUN] No changes made.")
                )
        else:
            self.stdout.write(
                self.style.SUCCESS("No expired gift cards to disable.")
            )

        # ── 2. Warn about gift cards expiring soon ──
        warn_date = today + timezone.timedelta(days=warn_days)
        expiring_soon = GiftCard.objects.filter(
            status=GiftCard.Status.ACTIVE,
            expiry_date__gte=today,
            expiry_date__lte=warn_date,
        )
        expiring_count = expiring_soon.count()

        if expiring_count:
            self.stdout.write(
                f"\n{expiring_count} gift card(s) expiring within {warn_days} days:"
            )
            for card in expiring_soon.select_related("brand", "owner"):
                days_left = (card.expiry_date - today).days
                self.stdout.write(
                    f"  - {card.brand.name} ${card.value} "
                    f"(expires in {days_left} day(s), owner: {card.owner.username})"
                )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"No gift cards expiring within {warn_days} days."
                )
            )

        # ── Summary ──
        self.stdout.write(f"\n{'=' * 45}")
        self.stdout.write(f"Gift Card Expiry Check Summary ({today})")
        self.stdout.write(f"  Expired:        {expired_count}")
        self.stdout.write(f"  Expiring soon:  {expiring_count}")
        self.stdout.write(f"{'=' * 45}")
