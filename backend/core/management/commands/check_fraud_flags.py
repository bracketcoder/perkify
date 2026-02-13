from django.core.management.base import BaseCommand
from django.utils import timezone

from core.fraud_detection import run_fraud_checks
from core.models import User


class Command(BaseCommand):
    help = "Scan all active users for fraud indicators and create flags for suspicious activity"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user-id",
            type=int,
            default=None,
            help="Run fraud checks for a specific user ID only",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be flagged without creating records (not yet implemented)",
        )

    def handle(self, *args, **options):
        start_time = timezone.now()
        user_id = options["user_id"]

        self.stdout.write(f"\nFraud Flag Check — {start_time:%Y-%m-%d %H:%M:%S}")
        self.stdout.write("=" * 50)

        if user_id:
            try:
                user = User.objects.get(pk=user_id)
                self.stdout.write(f"Running checks for user: {user.username} (id={user.pk})")
                new_flags = run_fraud_checks(user=user)
            except User.DoesNotExist:
                self.stderr.write(self.style.ERROR(f"User with id={user_id} not found."))
                return
        else:
            active_users = User.objects.filter(
                status=User.Status.ACTIVE,
                is_active=True,
            )
            user_count = active_users.count()
            self.stdout.write(f"Scanning {user_count} active user(s)...")
            new_flags = run_fraud_checks(user=None)

        # Print summary of new flags
        if new_flags:
            self.stdout.write(
                self.style.WARNING(f"\nNew fraud flags created: {len(new_flags)}")
            )
            for flag in new_flags:
                restricted_label = " [AUTO-RESTRICTED]" if flag.auto_restricted else ""
                self.stdout.write(
                    f"  - {flag.get_flag_type_display()} | "
                    f"User: {flag.user.username} (id={flag.user.pk})"
                    f"{restricted_label}"
                )
                self.stdout.write(f"    {flag.details}")
        else:
            self.stdout.write(self.style.SUCCESS("\nNo new fraud flags created."))

        # Flag type breakdown
        if new_flags:
            self.stdout.write("\nBreakdown by type:")
            type_counts = {}
            for flag in new_flags:
                label = flag.get_flag_type_display()
                type_counts[label] = type_counts.get(label, 0) + 1
            for flag_type, count in sorted(type_counts.items()):
                self.stdout.write(f"  {flag_type}: {count}")

        auto_restricted = [f for f in new_flags if f.auto_restricted]
        if auto_restricted:
            self.stdout.write(
                self.style.WARNING(
                    f"\nUsers auto-restricted: {len(auto_restricted)}"
                )
            )

        elapsed = (timezone.now() - start_time).total_seconds()
        self.stdout.write(f"\n{'=' * 50}")
        self.stdout.write(f"Completed in {elapsed:.2f}s")
        self.stdout.write(f"{'=' * 50}")
