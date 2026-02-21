from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import AuthenticationForm
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from .turnstile import verify_turnstile
from .models import (
    AuditLog,
    Brand,
    Dispute,
    EscrowSession,
    FraudFlag,
    FraudReport,
    GiftCard,
    Notification,
    NotificationRule,
    Payment,
    PlatformSettings,
    Review,
    Sale,
    Trade,
    User,
)


# ─── Turnstile Admin Login ───
class TurnstileAdminAuthForm(AuthenticationForm):
    cf_turnstile_response = forms.CharField(
        widget=forms.HiddenInput, required=True
    )

    def clean(self):
        token = self.cleaned_data.get("cf_turnstile_response", "")
        ip = (
            self.request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
            or self.request.META.get("REMOTE_ADDR")
            if self.request
            else None
        )
        if not verify_turnstile(token, ip):
            raise forms.ValidationError("Bot verification failed. Please try again.")
        return super().clean()


admin.site.login_form = TurnstileAdminAuthForm
admin.site.login_template = "admin/login.html"


# ─── Inlines ───
class EscrowInline(TabularInline):
    model = EscrowSession
    extra = 0
    fields = ("status", "locked_at", "released_at", "confirmation_deadline", "finalized_at")
    readonly_fields = fields
    show_change_link = True
    max_num = 0


class GiftCardInline(TabularInline):
    model = GiftCard
    extra = 0
    fields = ("brand", "value", "listing_type", "status", "expiry_date")
    readonly_fields = fields
    show_change_link = True
    max_num = 0


# ═══════════════════════════════════════════════
#  User Management
# ═══════════════════════════════════════════════
@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    list_display = (
        "username",
        "show_full_name",
        "email",
        "show_role_badge",
        "show_status_badge",
        "show_verified",
        "show_trust_tier",
        "trust_score",
        "wallet_balance",
        "date_joined",
    )
    list_filter = ("role", "status", "is_verified", "trust_tier", "is_staff", "is_active")
    search_fields = ("username", "email", "first_name", "last_name", "phone")
    list_per_page = 25
    ordering = ("-date_joined",)

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "email", "phone", "phone_verified", "location", "avatar")}),
        ("Platform", {"fields": ("role", "status", "is_verified", "trust_score", "trust_tier", "wallet_balance")}),
        ("Daily Limits", {"fields": ("daily_trade_count", "daily_trade_value", "daily_trade_reset")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("username", "email", "password1", "password2", "role")}),
    )

    actions = ["make_verified", "suspend_users", "activate_users", "ban_users", "restrict_users"]

    @display(description="Name")
    def show_full_name(self, obj):
        return obj.get_full_name() or "—"

    @display(description="Role", label={"user": "info", "admin": "success"})
    def show_role_badge(self, obj):
        return obj.role

    @display(
        description="Status",
        label={"active": "success", "restricted": "warning", "suspended": "warning", "banned": "danger"},
    )
    def show_status_badge(self, obj):
        return obj.status

    @display(description="Verified", boolean=True)
    def show_verified(self, obj):
        return obj.is_verified

    @display(
        description="Trust Tier",
        label={0: "info", 1: "warning", 2: "success"},
    )
    def show_trust_tier(self, obj):
        return obj.trust_tier

    @admin.action(description="Mark selected users as verified")
    def make_verified(self, request, queryset):
        queryset.update(is_verified=True)

    @admin.action(description="Suspend selected users")
    def suspend_users(self, request, queryset):
        queryset.update(status="suspended")

    @admin.action(description="Activate selected users")
    def activate_users(self, request, queryset):
        queryset.update(status="active")

    @admin.action(description="Ban selected users")
    def ban_users(self, request, queryset):
        queryset.update(status="banned")

    @admin.action(description="Restrict selected users")
    def restrict_users(self, request, queryset):
        queryset.update(status="restricted")


# ═══════════════════════════════════════════════
#  Brand Management
# ═══════════════════════════════════════════════
@admin.register(Brand)
class BrandAdmin(ModelAdmin):
    list_display = ("name", "category", "show_popular", "show_active", "created_at")
    list_filter = ("is_active", "is_popular", "category")
    search_fields = ("name", "category")
    list_per_page = 25
    inlines = [GiftCardInline]

    @display(description="Popular", boolean=True)
    def show_popular(self, obj):
        return obj.is_popular

    @display(description="Active", boolean=True)
    def show_active(self, obj):
        return obj.is_active


# ═══════════════════════════════════════════════
#  Gift Card Management
# ═══════════════════════════════════════════════
@admin.register(GiftCard)
class GiftCardAdmin(ModelAdmin):
    list_display = (
        "__str__",
        "owner",
        "brand",
        "value",
        "show_listing_type",
        "show_status_badge",
        "selling_price",
        "show_confirmed_unused",
        "expiry_date",
        "show_expired",
    )
    list_filter = ("status", "listing_type", "brand", "confirmed_unused")
    search_fields = ("owner__username", "brand__name")
    list_per_page = 25
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "expiry_date"

    fieldsets = (
        ("Card Details", {"fields": ("owner", "brand", "value", "selling_price", "image")}),
        ("Listing", {"fields": ("listing_type", "status", "confirmed_unused")}),
        ("Expiry", {"fields": ("expiry_date",)}),
        ("Moderation", {"fields": ("moderation_note",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    actions = ["approve_cards", "reject_cards", "mark_expired"]

    @display(
        description="Type",
        label={"sell": "info", "swap": "success"},
    )
    def show_listing_type(self, obj):
        return obj.listing_type

    @display(
        description="Status",
        label={
            "active": "success",
            "in_trade": "warning",
            "sold": "info",
            "swapped": "info",
            "expired": "danger",
            "pending_review": "warning",
            "rejected": "danger",
        },
    )
    def show_status_badge(self, obj):
        return obj.status

    @display(description="Expired", boolean=True)
    def show_expired(self, obj):
        return obj.is_expired

    @display(description="Confirmed Unused", boolean=True)
    def show_confirmed_unused(self, obj):
        return obj.confirmed_unused

    @admin.action(description="Approve selected gift cards")
    def approve_cards(self, request, queryset):
        queryset.update(status="active", moderation_note="Approved by admin")

    @admin.action(description="Reject selected gift cards")
    def reject_cards(self, request, queryset):
        queryset.update(status="rejected")

    @admin.action(description="Mark selected as expired")
    def mark_expired(self, request, queryset):
        queryset.update(status="expired")


# ═══════════════════════════════════════════════
#  Trade (Swap) Management
# ═══════════════════════════════════════════════
@admin.register(Trade)
class TradeAdmin(ModelAdmin):
    list_display = (
        "trade_id",
        "initiator",
        "responder",
        "show_status_badge",
        "platform_fee_initiator",
        "platform_fee_responder",
        "show_initiator_confirmed",
        "show_responder_confirmed",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = ("trade_id", "initiator__username", "responder__username")
    list_per_page = 25
    readonly_fields = ("trade_id", "created_at", "updated_at")
    date_hierarchy = "created_at"
    inlines = [EscrowInline]

    fieldsets = (
        ("Trade", {"fields": ("trade_id", "initiator", "responder")}),
        ("Cards", {"fields": ("initiator_card", "responder_card")}),
        ("Fees", {"fields": ("platform_fee_initiator", "platform_fee_responder")}),
        ("Status", {"fields": ("status", "initiator_confirmed", "responder_confirmed", "notes")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    actions = ["force_complete", "force_cancel"]

    @display(
        description="Status",
        label={
            "proposed": "info",
            "accepted": "info",
            "in_escrow": "warning",
            "codes_released": "warning",
            "confirming": "warning",
            "completed": "success",
            "cancelled": "danger",
            "disputed": "danger",
        },
    )
    def show_status_badge(self, obj):
        return obj.status

    @display(description="Init. Confirmed", boolean=True)
    def show_initiator_confirmed(self, obj):
        return obj.initiator_confirmed

    @display(description="Resp. Confirmed", boolean=True)
    def show_responder_confirmed(self, obj):
        return obj.responder_confirmed

    @admin.action(description="Force complete selected trades")
    def force_complete(self, request, queryset):
        queryset.update(status="completed", initiator_confirmed=True, responder_confirmed=True)

    @admin.action(description="Force cancel selected trades")
    def force_cancel(self, request, queryset):
        queryset.update(status="cancelled")


# ═══════════════════════════════════════════════
#  Sale Management
# ═══════════════════════════════════════════════
@admin.register(Sale)
class SaleAdmin(ModelAdmin):
    list_display = (
        "sale_id",
        "gift_card",
        "buyer",
        "seller",
        "amount",
        "platform_fee",
        "show_status_badge",
        "show_code_revealed",
        "created_at",
    )
    list_filter = ("status", "code_revealed")
    search_fields = ("sale_id", "gift_card__brand__name", "buyer__username", "seller__username")
    list_per_page = 25
    readonly_fields = ("sale_id", "created_at", "updated_at")
    date_hierarchy = "created_at"

    fieldsets = (
        ("Sale", {"fields": ("sale_id", "gift_card", "buyer", "seller")}),
        ("Financial", {"fields": ("amount", "platform_fee")}),
        ("Status", {"fields": ("status", "code_revealed", "notes")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    actions = ["force_complete", "force_cancel"]

    @display(
        description="Status",
        label={
            "pending": "warning",
            "accepted": "info",
            "completed": "success",
            "cancelled": "danger",
            "disputed": "danger",
        },
    )
    def show_status_badge(self, obj):
        return obj.status

    @display(description="Code Revealed", boolean=True)
    def show_code_revealed(self, obj):
        return obj.code_revealed

    @admin.action(description="Force complete selected sales")
    def force_complete(self, request, queryset):
        queryset.update(status="completed", code_revealed=True)

    @admin.action(description="Force cancel selected sales")
    def force_cancel(self, request, queryset):
        queryset.update(status="cancelled")


# ═══════════════════════════════════════════════
#  Escrow Session
# ═══════════════════════════════════════════════
@admin.register(EscrowSession)
class EscrowSessionAdmin(ModelAdmin):
    list_display = ("__str__", "trade", "show_status_badge", "locked_at", "released_at", "confirmation_deadline", "finalized_at")
    list_filter = ("status",)
    search_fields = ("trade__trade_id",)
    list_per_page = 25
    readonly_fields = ("locked_at",)

    @display(
        description="Status",
        label={
            "locked": "warning",
            "released": "info",
            "confirming": "warning",
            "finalized": "success",
            "reversed": "danger",
        },
    )
    def show_status_badge(self, obj):
        return obj.status


# ═══════════════════════════════════════════════
#  Payment Tracking
# ═══════════════════════════════════════════════
@admin.register(Payment)
class PaymentAdmin(ModelAdmin):
    list_display = ("payment_id", "user", "payment_type", "amount", "show_status_badge", "created_at")
    list_filter = ("status", "payment_type")
    search_fields = ("payment_id", "user__username", "stripe_checkout_session_id", "stripe_payment_intent_id")
    list_per_page = 25
    readonly_fields = ("payment_id", "created_at", "updated_at")

    @display(
        description="Status",
        label={
            "pending": "warning",
            "completed": "success",
            "failed": "danger",
            "refunded": "info",
        },
    )
    def show_status_badge(self, obj):
        return obj.status


# ═══════════════════════════════════════════════
#  Dispute Resolution
# ═══════════════════════════════════════════════
@admin.register(Dispute)
class DisputeAdmin(ModelAdmin):
    list_display = (
        "__str__",
        "raised_by",
        "show_status_badge",
        "resolved_by",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = (
        "trade__trade_id",
        "sale__sale_id",
        "raised_by__username",
        "reason",
    )
    list_per_page = 25
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Dispute Details", {"fields": ("trade", "sale", "raised_by", "reason")}),
        ("Resolution", {"fields": ("status", "resolution", "admin_response", "resolved_by")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    actions = ["mark_under_review", "dismiss_disputes"]

    @display(
        description="Status",
        label={
            "open": "danger",
            "under_review": "warning",
            "resolved": "success",
            "dismissed": "info",
        },
    )
    def show_status_badge(self, obj):
        return obj.status

    @admin.action(description="Mark selected as Under Review")
    def mark_under_review(self, request, queryset):
        queryset.update(status="under_review")

    @admin.action(description="Dismiss selected disputes")
    def dismiss_disputes(self, request, queryset):
        queryset.update(status="dismissed")


# ═══════════════════════════════════════════════
#  Notifications
# ═══════════════════════════════════════════════
@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = ("title", "user", "show_type_badge", "show_read", "created_at")
    list_filter = ("type", "is_read")
    search_fields = ("title", "message", "user__username")
    list_per_page = 50
    readonly_fields = ("created_at",)

    @display(
        description="Type",
        label={
            "trade": "info",
            "sale": "warning",
            "match": "success",
            "dispute": "danger",
            "system": "info",
            "confirmation": "warning",
        },
    )
    def show_type_badge(self, obj):
        return obj.type

    @display(description="Read", boolean=True)
    def show_read(self, obj):
        return obj.is_read


# ═══════════════════════════════════════════════
#  Reviews
# ═══════════════════════════════════════════════
@admin.register(Review)
class ReviewAdmin(ModelAdmin):
    list_display = ("__str__", "reviewer", "target_user", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("reviewer__username", "target_user__username", "comment")
    list_per_page = 25
    readonly_fields = ("created_at", "updated_at")


# ═══════════════════════════════════════════════
#  Fraud Flags (Auto-generated)
# ═══════════════════════════════════════════════
@admin.register(FraudFlag)
class FraudFlagAdmin(ModelAdmin):
    list_display = (
        "__str__",
        "user",
        "show_flag_type",
        "show_status_badge",
        "show_auto_restricted",
        "reviewed_by",
        "created_at",
    )
    list_filter = ("flag_type", "status", "auto_restricted")
    search_fields = ("user__username", "details")
    list_per_page = 25
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Flag Details", {"fields": ("user", "flag_type", "details", "auto_restricted")}),
        ("Review", {"fields": ("status", "admin_notes", "reviewed_by")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    actions = ["mark_reviewed", "confirm_flags", "dismiss_flags"]

    @display(
        description="Flag Type",
        label={
            "rapid_trades": "danger",
            "repeated_disputes": "danger",
            "multi_ip": "warning",
            "abnormal_value": "warning",
        },
    )
    def show_flag_type(self, obj):
        return obj.flag_type

    @display(
        description="Status",
        label={"pending": "warning", "reviewed": "info", "dismissed": "success", "confirmed": "danger"},
    )
    def show_status_badge(self, obj):
        return obj.status

    @display(description="Auto-Restricted", boolean=True)
    def show_auto_restricted(self, obj):
        return obj.auto_restricted

    @admin.action(description="Mark as Reviewed")
    def mark_reviewed(self, request, queryset):
        queryset.update(status="reviewed", reviewed_by=request.user)

    @admin.action(description="Confirm Fraud")
    def confirm_flags(self, request, queryset):
        queryset.update(status="confirmed", reviewed_by=request.user)

    @admin.action(description="Dismiss selected flags")
    def dismiss_flags(self, request, queryset):
        queryset.update(status="dismissed", reviewed_by=request.user)


# ═══════════════════════════════════════════════
#  Fraud Reports (User-submitted)
# ═══════════════════════════════════════════════
@admin.register(FraudReport)
class FraudReportAdmin(ModelAdmin):
    list_display = (
        "__str__",
        "reporter",
        "reported_user",
        "show_report_type",
        "show_status_badge",
        "reviewed_by",
        "created_at",
    )
    list_filter = ("status", "report_type")
    search_fields = (
        "reporter__username",
        "reported_user__username",
        "description",
    )
    list_per_page = 25
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Report Details", {"fields": ("reporter", "report_type", "description", "evidence")}),
        ("Reported Entity", {"fields": ("reported_user", "reported_card")}),
        ("Review", {"fields": ("status", "admin_notes", "reviewed_by", "action_taken")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    actions = ["mark_investigating", "confirm_fraud", "dismiss_reports"]

    @display(
        description="Type",
        label={
            "fake_card": "danger",
            "scam_user": "danger",
            "used_card": "warning",
            "suspicious_activity": "info",
            "other": "info",
        },
    )
    def show_report_type(self, obj):
        return obj.report_type

    @display(
        description="Status",
        label={
            "pending": "warning",
            "investigating": "info",
            "confirmed": "danger",
            "dismissed": "success",
        },
    )
    def show_status_badge(self, obj):
        return obj.status

    @admin.action(description="Mark as Investigating")
    def mark_investigating(self, request, queryset):
        queryset.update(status="investigating", reviewed_by=request.user)

    @admin.action(description="Confirm as Fraud")
    def confirm_fraud(self, request, queryset):
        queryset.update(status="confirmed", reviewed_by=request.user)

    @admin.action(description="Dismiss selected reports")
    def dismiss_reports(self, request, queryset):
        queryset.update(status="dismissed", reviewed_by=request.user)


# ═══════════════════════════════════════════════
#  Audit Log (Read-Only)
# ═══════════════════════════════════════════════
@admin.register(AuditLog)
class AuditLogAdmin(ModelAdmin):
    list_display = (
        "show_action_badge",
        "user",
        "description",
        "ip_address",
        "created_at",
    )
    list_filter = ("action",)
    search_fields = ("user__username", "description", "ip_address")
    list_per_page = 50
    readonly_fields = (
        "user",
        "action",
        "description",
        "ip_address",
        "user_agent",
        "metadata",
        "created_at",
    )
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    @display(
        description="Action",
        label={
            "login": "success",
            "logout": "info",
            "login_failed": "danger",
            "card_listed": "info",
            "card_purchased": "success",
            "code_revealed": "warning",
            "trade_proposed": "info",
            "trade_accepted": "info",
            "trade_completed": "success",
            "escrow_locked": "warning",
            "escrow_released": "warning",
            "dispute_opened": "danger",
            "user_restricted": "warning",
            "user_suspended": "warning",
            "user_banned": "danger",
            "fraud_flagged": "danger",
            "admin_action": "warning",
        },
    )
    def show_action_badge(self, obj):
        return obj.action


# ═══════════════════════════════════════════════
#  Platform Settings
# ═══════════════════════════════════════════════
@admin.register(PlatformSettings)
class PlatformSettingsAdmin(ModelAdmin):
    list_display = ("key", "value", "show_category", "description", "updated_at")
    list_filter = ("category",)
    search_fields = ("key", "description")
    list_per_page = 25

    @display(
        description="Category",
        label={
            "fee": "warning",
            "trade_limits": "info",
            "confirmation": "info",
            "trust": "success",
            "general": "success",
        },
    )
    def show_category(self, obj):
        return obj.category


# ═══════════════════════════════════════════════
#  Notification Rules
# ═══════════════════════════════════════════════
@admin.register(NotificationRule)
class NotificationRuleAdmin(ModelAdmin):
    list_display = (
        "name",
        "event_type",
        "show_email",
        "show_push",
        "show_active",
        "updated_at",
    )
    list_filter = ("is_active", "email_enabled", "push_enabled")
    search_fields = ("name", "event_type")
    list_per_page = 25

    fieldsets = (
        ("Rule", {"fields": ("name", "event_type", "is_active")}),
        ("Channels", {"fields": ("email_enabled", "push_enabled")}),
        ("Template", {"fields": ("template_subject", "template_body")}),
    )

    @display(description="Email", boolean=True)
    def show_email(self, obj):
        return obj.email_enabled

    @display(description="Push", boolean=True)
    def show_push(self, obj):
        return obj.push_enabled

    @display(description="Active", boolean=True)
    def show_active(self, obj):
        return obj.is_active
