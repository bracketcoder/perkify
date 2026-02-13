import uuid

from cryptography.fernet import Fernet
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


# ─── Fernet Encryption Utility ───
_fernet_key = getattr(settings, "FERNET_KEY", None)
if _fernet_key:
    _fernet = Fernet(_fernet_key.encode() if isinstance(_fernet_key, str) else _fernet_key)
else:
    _fernet = Fernet(Fernet.generate_key())


def encrypt_value(value: str) -> str:
    if not value:
        return ""
    return _fernet.encrypt(value.encode()).decode()


def decrypt_value(token: str) -> str:
    if not token:
        return ""
    return _fernet.decrypt(token.encode()).decode()


# ─── Custom User ───
class User(AbstractUser):
    class Role(models.TextChoices):
        USER = "user", "User"
        ADMIN = "admin", "Admin"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        RESTRICTED = "restricted", "Restricted"
        SUSPENDED = "suspended", "Suspended"
        BANNED = "banned", "Banned"

    class TrustTier(models.IntegerChoices):
        NEW = 0, "New User"
        ESTABLISHED = 1, "Established"
        TRUSTED = 2, "Trusted"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    is_verified = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True)
    phone_verified = models.BooleanField(default=False)
    location = models.CharField(max_length=120, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    trust_score = models.PositiveIntegerField(default=50)
    trust_tier = models.IntegerField(choices=TrustTier.choices, default=TrustTier.NEW)
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    daily_trade_count = models.PositiveIntegerField(default=0)
    daily_trade_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    daily_trade_reset = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

    def reset_daily_limits_if_needed(self):
        today = timezone.now().date()
        if self.daily_trade_reset != today:
            self.daily_trade_count = 0
            self.daily_trade_value = 0
            self.daily_trade_reset = today
            self.save(update_fields=["daily_trade_count", "daily_trade_value", "daily_trade_reset"])

    @property
    def max_daily_trades(self):
        defaults = {0: 3, 1: 10, 2: 25}
        keys = {0: "max_daily_trades_new", 1: "max_daily_trades_established", 2: "max_daily_trades_trusted"}
        key = keys.get(self.trust_tier)
        if key:
            val = PlatformSettings.get(key)
            if val is not None:
                return int(val)
        return defaults.get(self.trust_tier, 3)

    @property
    def max_daily_value(self):
        from decimal import Decimal
        defaults = {0: Decimal("200"), 1: Decimal("500"), 2: Decimal("2000")}
        keys = {0: "max_daily_value_new", 1: "max_daily_value_established", 2: "max_daily_value_trusted"}
        key = keys.get(self.trust_tier)
        if key:
            val = PlatformSettings.get(key)
            if val is not None:
                return Decimal(val)
        return defaults.get(self.trust_tier, Decimal("200"))

    @property
    def max_active_trades(self):
        defaults = {0: 1, 1: 5, 2: 10}
        keys = {0: "max_active_trades_new", 1: "max_active_trades_established", 2: "max_active_trades_trusted"}
        key = keys.get(self.trust_tier)
        if key:
            val = PlatformSettings.get(key)
            if val is not None:
                return int(val)
        return defaults.get(self.trust_tier, 1)

    @property
    def reputation(self):
        total = Trade.objects.filter(
            models.Q(initiator=self) | models.Q(responder=self)
        ).exclude(status__in=["proposed", "cancelled"]).count()
        successful = Trade.objects.filter(
            (models.Q(initiator=self) | models.Q(responder=self)),
            status="completed",
        ).count()
        disputes = Dispute.objects.filter(raised_by=self).count()
        return {"total_trades": total, "successful_trades": successful, "disputes": disputes}


# ─── Brand ───
class Brand(models.Model):
    name = models.CharField(max_length=200, unique=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    category = models.CharField(max_length=100, blank=True)
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


# ─── Gift Card ───
class GiftCard(models.Model):
    class ListingType(models.TextChoices):
        SWAP = "swap", "Swap"
        SELL = "sell", "Sell"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        IN_TRADE = "in_trade", "In Trade"
        SOLD = "sold", "Sold"
        SWAPPED = "swapped", "Swapped"
        EXPIRED = "expired", "Expired"
        PENDING_REVIEW = "pending_review", "Pending Review"
        REJECTED = "rejected", "Rejected"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="gift_cards"
    )
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name="gift_cards")
    value = models.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = models.DateField()
    card_number_encrypted = models.TextField(blank=True)
    pin_encrypted = models.TextField(blank=True)
    listing_type = models.CharField(
        max_length=10, choices=ListingType.choices, default=ListingType.SWAP
    )
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.ACTIVE)
    confirmed_unused = models.BooleanField(default=False)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    image = models.ImageField(upload_to="giftcards/", blank=True, null=True)
    moderation_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.brand.name} ${self.value} ({self.get_listing_type_display()})"

    def set_card_number(self, raw_value):
        self.card_number_encrypted = encrypt_value(raw_value)

    def get_card_number(self):
        return decrypt_value(self.card_number_encrypted)

    def set_pin(self, raw_value):
        self.pin_encrypted = encrypt_value(raw_value)

    def get_pin(self):
        return decrypt_value(self.pin_encrypted)

    @property
    def is_expired(self):
        return self.expiry_date < timezone.now().date()


# ─── Trade (Two-Party Swap) ───
class Trade(models.Model):
    class Status(models.TextChoices):
        PROPOSED = "proposed", "Proposed"
        ACCEPTED = "accepted", "Accepted"
        IN_ESCROW = "in_escrow", "In Escrow"
        CODES_RELEASED = "codes_released", "Codes Released"
        CONFIRMING = "confirming", "Confirming"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        DISPUTED = "disputed", "Disputed"

    trade_id = models.CharField(max_length=20, unique=True, editable=False)
    initiator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trades_initiated"
    )
    responder = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trades_received"
    )
    initiator_card = models.ForeignKey(
        GiftCard, on_delete=models.CASCADE, related_name="trades_as_initiator_card"
    )
    responder_card = models.ForeignKey(
        GiftCard, on_delete=models.CASCADE, related_name="trades_as_responder_card"
    )
    platform_fee_initiator = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    platform_fee_responder = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PROPOSED)
    initiator_confirmed = models.BooleanField(default=False)
    responder_confirmed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.trade_id:
            self.trade_id = f"TRD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.trade_id} – {self.initiator.username} ↔ {self.responder.username}"

    def calculate_fees(self):
        from decimal import Decimal
        raw = PlatformSettings.get("fee_percentage", "5")
        fee_pct = Decimal(raw) / Decimal("100")
        self.platform_fee_initiator = self.initiator_card.value * fee_pct
        self.platform_fee_responder = self.responder_card.value * fee_pct


# ─── Sale (One-Way Purchase) ───
class Sale(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        DISPUTED = "disputed", "Disputed"

    sale_id = models.CharField(max_length=20, unique=True, editable=False)
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="purchases"
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sales_as_seller"
    )
    gift_card = models.ForeignKey(GiftCard, on_delete=models.CASCADE, related_name="sales")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    code_revealed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.sale_id:
            self.sale_id = f"SAL-{uuid.uuid4().hex[:8].upper()}"
        if not self.platform_fee:
            from decimal import Decimal
            raw = PlatformSettings.get("fee_percentage", "5")
            fee_pct = Decimal(raw) / Decimal("100")
            self.platform_fee = self.amount * fee_pct
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.sale_id} – {self.gift_card.brand.name} ${self.gift_card.value}"


# ─── Escrow Session ───
class EscrowSession(models.Model):
    class Status(models.TextChoices):
        LOCKED = "locked", "Cards Locked"
        RELEASED = "released", "Codes Released"
        CONFIRMING = "confirming", "Confirmation Window"
        FINALIZED = "finalized", "Finalized"
        REVERSED = "reversed", "Reversed"

    trade = models.OneToOneField(Trade, on_delete=models.CASCADE, related_name="escrow")
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.LOCKED)
    locked_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)
    confirmation_deadline = models.DateTimeField(null=True, blank=True)
    finalized_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-locked_at"]

    def __str__(self):
        return f"Escrow for {self.trade.trade_id} ({self.get_status_display()})"

    @property
    def is_confirmation_expired(self):
        if self.confirmation_deadline:
            return timezone.now() > self.confirmation_deadline
        return False


# ─── Dispute ───
class Dispute(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        UNDER_REVIEW = "under_review", "Under Review"
        RESOLVED = "resolved", "Resolved"
        DISMISSED = "dismissed", "Dismissed"

    trade = models.ForeignKey(
        Trade, on_delete=models.CASCADE, related_name="disputes", null=True, blank=True
    )
    sale = models.ForeignKey(
        Sale, on_delete=models.CASCADE, related_name="disputes", null=True, blank=True
    )
    raised_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="disputes_raised"
    )
    reason = models.TextField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)
    resolution = models.TextField(blank=True)
    admin_response = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="disputes_resolved",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        ref = self.trade.trade_id if self.trade else self.sale.sale_id if self.sale else "N/A"
        return f"Dispute #{self.pk} – {ref}"


# ─── Notification ───
class Notification(models.Model):
    class Type(models.TextChoices):
        TRADE = "trade", "Trade Update"
        SALE = "sale", "Sale Update"
        MATCH = "match", "Match Suggestion"
        DISPUTE = "dispute", "Dispute Update"
        SYSTEM = "system", "System Notice"
        CONFIRMATION = "confirmation", "Confirmation Reminder"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=15, choices=Type.choices, default=Type.SYSTEM)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_trade = models.ForeignKey(
        Trade, on_delete=models.SET_NULL, null=True, blank=True
    )
    related_sale = models.ForeignKey(
        Sale, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.title} → {self.user.username}"


# ─── Review ───
class Review(models.Model):
    trade = models.ForeignKey(
        Trade, on_delete=models.CASCADE, related_name="reviews", null=True, blank=True
    )
    sale = models.ForeignKey(
        Sale, on_delete=models.CASCADE, related_name="reviews", null=True, blank=True
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_given"
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_received"
    )
    rating = models.PositiveSmallIntegerField(help_text="1 to 5 stars")
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review by {self.reviewer.username} → {self.target_user.username} ({self.rating}★)"


# ─── Fraud Flag (Auto-generated) ───
class FraudFlag(models.Model):
    class FlagType(models.TextChoices):
        RAPID_TRADES = "rapid_trades", "Rapid Trades"
        REPEATED_DISPUTES = "repeated_disputes", "Repeated Disputes"
        MULTI_IP = "multi_ip", "Multiple IPs"
        ABNORMAL_VALUE = "abnormal_value", "Abnormal Value"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending Review"
        REVIEWED = "reviewed", "Reviewed"
        DISMISSED = "dismissed", "Dismissed"
        CONFIRMED = "confirmed", "Confirmed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="fraud_flags"
    )
    flag_type = models.CharField(max_length=25, choices=FlagType.choices)
    details = models.TextField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    auto_restricted = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="flags_reviewed",
    )
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Flag: {self.get_flag_type_display()} – {self.user.username}"


# ─── Fraud Report (User-submitted) ───
class FraudReport(models.Model):
    class ReportType(models.TextChoices):
        FAKE_CARD = "fake_card", "Fake Gift Card"
        SCAM_USER = "scam_user", "Scam User"
        USED_CARD = "used_card", "Already Used Card"
        SUSPICIOUS_ACTIVITY = "suspicious_activity", "Suspicious Activity"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending Review"
        INVESTIGATING = "investigating", "Investigating"
        CONFIRMED = "confirmed", "Confirmed Fraud"
        DISMISSED = "dismissed", "Dismissed"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="fraud_reports_filed"
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="fraud_reports_received",
        null=True,
        blank=True,
    )
    reported_card = models.ForeignKey(
        GiftCard, on_delete=models.SET_NULL, null=True, blank=True, related_name="fraud_reports"
    )
    report_type = models.CharField(max_length=25, choices=ReportType.choices)
    description = models.TextField()
    evidence = models.TextField(blank=True, help_text="URLs, screenshots, or additional details")
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fraud_reports_reviewed",
    )
    action_taken = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"FR-{self.pk} ({self.get_report_type_display()}) by {self.reporter}"


# ─── Audit Log ───
class AuditLog(models.Model):
    class Action(models.TextChoices):
        LOGIN = "login", "User Login"
        LOGOUT = "logout", "User Logout"
        LOGIN_FAILED = "login_failed", "Failed Login Attempt"
        CARD_LISTED = "card_listed", "Gift Card Listed"
        CARD_PURCHASED = "card_purchased", "Gift Card Purchased"
        CODE_REVEALED = "code_revealed", "Code Revealed"
        TRADE_PROPOSED = "trade_proposed", "Trade Proposed"
        TRADE_ACCEPTED = "trade_accepted", "Trade Accepted"
        TRADE_COMPLETED = "trade_completed", "Trade Completed"
        ESCROW_LOCKED = "escrow_locked", "Escrow Locked"
        ESCROW_RELEASED = "escrow_released", "Escrow Released"
        DISPUTE_OPENED = "dispute_opened", "Dispute Opened"
        USER_RESTRICTED = "user_restricted", "User Restricted"
        USER_SUSPENDED = "user_suspended", "User Suspended"
        USER_BANNED = "user_banned", "User Banned"
        FRAUD_FLAGGED = "fraud_flagged", "Fraud Flagged"
        ADMIN_ACTION = "admin_action", "Admin Action"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=25, choices=Action.choices)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.get_action_display()} – {self.user or 'System'} ({self.created_at:%Y-%m-%d %H:%M})"


# ─── Platform Settings ───
class PlatformSettings(models.Model):
    class Category(models.TextChoices):
        FEE = "fee", "Fee Configuration"
        TRADE_LIMITS = "trade_limits", "Trade Limits"
        CONFIRMATION = "confirmation", "Confirmation Window"
        TRUST = "trust", "Trust & Reputation"
        GENERAL = "general", "General"

    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.CharField(max_length=255, blank=True)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.GENERAL
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Platform Setting"
        verbose_name_plural = "Platform Settings"
        ordering = ["category", "key"]

    def __str__(self):
        return f"{self.key} = {self.value}"

    @classmethod
    def get(cls, key, default=None):
        """Retrieve a setting value by key, with an optional default."""
        try:
            return cls.objects.values_list("value", flat=True).get(key=key)
        except cls.DoesNotExist:
            return default


# ─── Notification Rule ───
class NotificationRule(models.Model):
    class EventType(models.TextChoices):
        TRADE_PROPOSED = "trade_proposed", "Trade Proposed"
        TRADE_ACCEPTED = "trade_accepted", "Trade Accepted"
        TRADE_COMPLETED = "trade_completed", "Trade Completed"
        TRADE_CANCELLED = "trade_cancelled", "Trade Cancelled"
        CODES_RELEASED = "codes_released", "Codes Released"
        CONFIRMATION_REMINDER = "confirmation_reminder", "Confirmation Reminder"
        CARD_EXPIRING = "card_expiring", "Gift Card Expiring Soon"
        DISPUTE_OPENED = "dispute_opened", "Dispute Opened"
        DISPUTE_RESOLVED = "dispute_resolved", "Dispute Resolved"
        ACCOUNT_RESTRICTED = "account_restricted", "Account Restricted"
        MATCH_FOUND = "match_found", "Match Found"

    name = models.CharField(max_length=200)
    event_type = models.CharField(max_length=25, choices=EventType.choices, unique=True)
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=False)
    template_subject = models.CharField(max_length=255, blank=True)
    template_body = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["event_type"]

    def __str__(self):
        return self.name
