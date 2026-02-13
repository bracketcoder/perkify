"""
Comprehensive backend smoke test for all Perkify API endpoints.

Run with:
    python3 test_all_endpoints.py

This script bootstraps Django, creates test data (users, brands, gift cards,
trades, sales, notifications, reviews, fraud reports), exercises every API
endpoint, and prints a pass/fail summary.  Test data is cleaned up at the end.

NOTE: The API router must be fully assembled before this script will succeed.
Expected URL prefix is /api/ and routes are defined in the individual
core.api.urls modules wired together via core.api.router.
"""

import json
import os
import sys
from datetime import date, timedelta
from decimal import Decimal

# ── Django bootstrap ──
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from django.test.client import Client  # noqa: E402
from django.utils import timezone  # noqa: E402

from core.models import (  # noqa: E402
    Brand,
    Dispute,
    EscrowSession,
    FraudReport,
    GiftCard,
    Notification,
    Review,
    Sale,
    Trade,
    User,
)

# ── Globals ──
client = Client()
passed = 0
failed = 0
errors = []


# ────────────────────────────────────────────────────────────
#  Helpers
# ────────────────────────────────────────────────────────────


def test(name, method, url, expected_status, token=None, data=None):
    """Fire a single request and compare the status code."""
    global passed, failed, errors
    headers = {}
    if token:
        headers["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    try:
        full_url = f"/api/{url}"
        if method == "GET":
            resp = client.get(full_url, **headers)
        elif method == "POST":
            resp = client.post(
                full_url,
                data=json.dumps(data) if data else "{}",
                content_type="application/json",
                **headers,
            )
        elif method == "PATCH":
            resp = client.patch(
                full_url,
                data=json.dumps(data) if data else "{}",
                content_type="application/json",
                **headers,
            )
        elif method == "PUT":
            resp = client.put(
                full_url,
                data=json.dumps(data) if data else "{}",
                content_type="application/json",
                **headers,
            )
        elif method == "DELETE":
            resp = client.delete(full_url, **headers)
        else:
            raise ValueError(f"Unknown HTTP method: {method}")

        if resp.status_code == expected_status:
            passed += 1
            print(f"  PASS  {method:6} /api/{url} -> {resp.status_code}")
        else:
            failed += 1
            body = ""
            try:
                body = resp.json()
            except Exception:
                body = resp.content[:200]
            errors.append(
                f"{method} /api/{url}: expected {expected_status}, "
                f"got {resp.status_code} | {body}"
            )
            print(
                f"  FAIL  {method:6} /api/{url} -> {resp.status_code} "
                f"(expected {expected_status})"
            )
        return resp
    except Exception as e:
        failed += 1
        errors.append(f"{method} /api/{url}: EXCEPTION {e}")
        print(f"  ERROR {method:6} /api/{url} -> {e}")
        return None


def get_token(email, password):
    """Obtain a JWT access token for the given credentials."""
    resp = client.post(
        "/api/auth/login/",
        data=json.dumps({"email": email, "password": password}),
        content_type="application/json",
    )
    if resp.status_code == 200:
        return resp.json()["tokens"]["access"]
    return None


# ────────────────────────────────────────────────────────────
#  Setup test data
# ────────────────────────────────────────────────────────────

print("\n=== Setting up test data ===")

# Clean previous test runs
User.objects.filter(username__startswith="test_").delete()
Brand.objects.filter(name__startswith="TestBrand").delete()

# Users
user1 = User.objects.create_user(
    username="test_user1",
    email="test_user1@perkify.test",
    password="TestPass123!",
    role="user",
    status="active",
    first_name="Alice",
    last_name="Tester",
    wallet_balance=Decimal("100.00"),
    is_verified=True,
)

user2 = User.objects.create_user(
    username="test_user2",
    email="test_user2@perkify.test",
    password="TestPass123!",
    role="user",
    status="active",
    first_name="Bob",
    last_name="Tester",
    wallet_balance=Decimal("100.00"),
    is_verified=True,
)

admin_user = User.objects.create_user(
    username="test_admin",
    email="test_admin@perkify.test",
    password="TestPass123!",
    role="admin",
    status="active",
    first_name="Admin",
    last_name="Tester",
    is_staff=True,
)

# Brands
brand1 = Brand.objects.create(
    name="TestBrand Amazon",
    category="Shopping",
    is_popular=True,
    is_active=True,
)
brand2 = Brand.objects.create(
    name="TestBrand Starbucks",
    category="Food & Drink",
    is_popular=True,
    is_active=True,
)

# Gift Cards -- one for swap, one for sell
gc_swap_user1 = GiftCard(
    owner=user1,
    brand=brand1,
    value=Decimal("50.00"),
    expiry_date=date.today() + timedelta(days=60),
    listing_type="swap",
    status="active",
    confirmed_unused=True,
)
gc_swap_user1.set_card_number("4111222233334444")
gc_swap_user1.set_pin("1234")
gc_swap_user1.save()

gc_swap_user2 = GiftCard(
    owner=user2,
    brand=brand2,
    value=Decimal("45.00"),
    expiry_date=date.today() + timedelta(days=90),
    listing_type="swap",
    status="active",
    confirmed_unused=True,
)
gc_swap_user2.set_card_number("5555666677778888")
gc_swap_user2.set_pin("5678")
gc_swap_user2.save()

gc_sell_user1 = GiftCard(
    owner=user1,
    brand=brand1,
    value=Decimal("100.00"),
    selling_price=Decimal("80.00"),
    expiry_date=date.today() + timedelta(days=120),
    listing_type="sell",
    status="active",
    confirmed_unused=True,
)
gc_sell_user1.set_card_number("9999000011112222")
gc_sell_user1.set_pin("9876")
gc_sell_user1.save()

gc_sell_user2 = GiftCard(
    owner=user2,
    brand=brand2,
    value=Decimal("25.00"),
    selling_price=Decimal("18.00"),
    expiry_date=date.today() + timedelta(days=45),
    listing_type="sell",
    status="active",
    confirmed_unused=True,
)
gc_sell_user2.set_card_number("3333444455556666")
gc_sell_user2.set_pin("4321")
gc_sell_user2.save()

# Notifications
notif1 = Notification.objects.create(
    user=user1,
    type="system",
    title="Welcome!",
    message="Welcome to Perkify!",
)
notif2 = Notification.objects.create(
    user=user1,
    type="trade",
    title="New match found",
    message="We found a potential swap match for you.",
    is_read=True,
)

print("Test data created.\n")


# ────────────────────────────────────────────────────────────
#  AUTH ENDPOINTS
# ────────────────────────────────────────────────────────────

print("=== AUTH ENDPOINTS ===")

# Register
test("Register new user", "POST", "auth/register/", 201, data={
    "username": "test_newuser",
    "email": "test_new@perkify.test",
    "password": "NewPass123!",
    "password_confirm": "NewPass123!",
    "first_name": "New",
    "last_name": "User",
})

# Login
resp = test("Login user1", "POST", "auth/login/", 200, data={
    "email": "test_user1@perkify.test",
    "password": "TestPass123!",
})
user1_token = (
    resp.json()["tokens"]["access"] if resp and resp.status_code == 200 else None
)

resp = test("Login user2", "POST", "auth/login/", 200, data={
    "email": "test_user2@perkify.test",
    "password": "TestPass123!",
})
user2_token = (
    resp.json()["tokens"]["access"] if resp and resp.status_code == 200 else None
)

resp = test("Login admin", "POST", "auth/login/", 200, data={
    "email": "test_admin@perkify.test",
    "password": "TestPass123!",
})
admin_token = (
    resp.json()["tokens"]["access"] if resp and resp.status_code == 200 else None
)

# Login with wrong password
test("Login wrong password", "POST", "auth/login/", 400, data={
    "email": "test_user1@perkify.test",
    "password": "WrongPass!",
})

# Profile
test("Get profile", "GET", "auth/profile/", 200, token=user1_token)
test("Update profile", "PATCH", "auth/profile/", 200, token=user1_token, data={
    "first_name": "Updated",
    "phone": "555-0100",
})

# Profile without auth
test("Profile no auth", "GET", "auth/profile/", 401)

# Change password
test("Change password", "PUT", "auth/change-password/", 200, token=user1_token, data={
    "old_password": "TestPass123!",
    "new_password": "NewTestPass456!",
    "new_password_confirm": "NewTestPass456!",
})

# Re-login with new password
resp = client.post(
    "/api/auth/login/",
    data=json.dumps({
        "email": "test_user1@perkify.test",
        "password": "NewTestPass456!",
    }),
    content_type="application/json",
)
user1_token = (
    resp.json()["tokens"]["access"] if resp.status_code == 200 else user1_token
)

# Clear rate limit cache before password-reset tests
from django.core.cache import cache
cache.clear()

# Password reset request
test("Password reset request", "POST", "auth/password-reset/", 200, data={
    "email": "test_user1@perkify.test",
})

# Password reset with nonexistent email (should still 200 to prevent enumeration)
test("Password reset nonexistent", "POST", "auth/password-reset/", 200, data={
    "email": "nonexistent@perkify.test",
})

# Verify email (bad token)
test("Verify email bad token", "POST", "auth/verify-email/", 400, data={
    "token": "invalid-token",
})

# Logout
test("Logout", "POST", "auth/logout/", 200, token=user1_token)

# Re-login for subsequent tests
resp = client.post(
    "/api/auth/login/",
    data=json.dumps({
        "email": "test_user1@perkify.test",
        "password": "NewTestPass456!",
    }),
    content_type="application/json",
)
user1_token = (
    resp.json()["tokens"]["access"] if resp.status_code == 200 else user1_token
)


# ────────────────────────────────────────────────────────────
#  BRAND & MARKETPLACE ENDPOINTS
# ────────────────────────────────────────────────────────────

print("\n=== BRAND & MARKETPLACE ENDPOINTS ===")

test("List brands", "GET", "brands/", 200)
test("Marketplace list", "GET", "marketplace/", 200)
test("Marketplace filter by listing_type", "GET", "marketplace/?listing_type=sell", 200)
test("Marketplace search", "GET", "marketplace/?search=TestBrand", 200)
test("Marketplace value filter", "GET", "marketplace/?min_value=10&max_value=100", 200)


# ────────────────────────────────────────────────────────────
#  GIFT CARD CRUD ENDPOINTS
# ────────────────────────────────────────────────────────────

print("\n=== GIFT CARD ENDPOINTS ===")

test("My gift cards (user1)", "GET", "gift-cards/", 200, token=user1_token)
test("My gift cards (user2)", "GET", "gift-cards/", 200, token=user2_token)

# Create gift card
resp = test("Create gift card", "POST", "gift-cards/", 201, token=user1_token, data={
    "brand": brand1.id,
    "value": "75.00",
    "expiry_date": str(date.today() + timedelta(days=180)),
    "card_number": "1111222233334444",
    "pin": "0000",
    "listing_type": "swap",
    "confirmed_unused": True,
})
new_gc = GiftCard.objects.filter(
    owner=user1, value=Decimal("75.00"), listing_type="swap"
).order_by("-created_at").first()
new_gc_id = new_gc.id if new_gc else None

# Detail
if new_gc_id:
    test("Gift card detail", "GET", f"gift-cards/{new_gc_id}/", 200, token=user1_token)
    test("Update gift card", "PATCH", f"gift-cards/{new_gc_id}/", 200, token=user1_token, data={
        "value": "80.00",
    })

# Get card code (owner)
test("Get card code (owner)", "GET", f"gift-cards/{gc_swap_user1.id}/code/", 200, token=user1_token)

# Get card code (non-owner, no completed trade/sale -- should be 403)
test("Get card code (non-owner)", "GET", f"gift-cards/{gc_swap_user1.id}/code/", 403, token=user2_token)

# Gift cards without auth
test("Gift cards no auth", "GET", "gift-cards/", 401)

# Delete a gift card (active, owner)
if new_gc_id:
    test("Delete gift card", "DELETE", f"gift-cards/{new_gc_id}/", 204, token=user1_token)


# ────────────────────────────────────────────────────────────
#  TRADE FLOW ENDPOINTS
# ────────────────────────────────────────────────────────────

print("\n=== TRADE ENDPOINTS ===")

# List trades (empty initially)
test("List trades (user1)", "GET", "trades/", 200, token=user1_token)

# Propose trade: user1 offers gc_swap_user1, targets gc_swap_user2
resp = test("Propose trade", "POST", "trades/", 201, token=user1_token, data={
    "initiator_card": gc_swap_user1.id,
    "responder_card": gc_swap_user2.id,
})
trade_id = None
if resp and resp.status_code == 201:
    trade_data = resp.json()
    trade_id = trade_data.get("trade_id")

# Trade detail
if trade_id:
    test("Trade detail", "GET", f"trades/{trade_id}/", 200, token=user1_token)

    # List trades with filter
    test("List trades filter", "GET", "trades/?status=proposed", 200, token=user1_token)

    # Respond: user2 accepts
    test("Accept trade", "PATCH", f"trades/{trade_id}/respond/", 200, token=user2_token, data={
        "action": "accept",
    })

    # Release codes (now in_escrow)
    test("Release codes", "POST", f"trades/{trade_id}/release/", 200, token=user1_token)

    # Confirm trade (user1 confirms first)
    test("Confirm trade (user1)", "POST", f"trades/{trade_id}/confirm/", 200, token=user1_token)

    # Confirm trade (user2 confirms -- finalizes the trade)
    test("Confirm trade (user2)", "POST", f"trades/{trade_id}/confirm/", 200, token=user2_token)

    # Verify trade is completed
    resp = test("Trade completed", "GET", f"trades/{trade_id}/", 200, token=user1_token)
    if resp and resp.status_code == 200:
        status_val = resp.json().get("status")
        if status_val == "completed":
            print("         -> Trade correctly finalized as 'completed'.")


# ── Test trade dispute flow with new cards ──

print("\n=== TRADE DISPUTE FLOW ===")

# Create new swap cards for dispute test
gc_dispute_user1 = GiftCard(
    owner=user1,
    brand=brand1,
    value=Decimal("30.00"),
    expiry_date=date.today() + timedelta(days=60),
    listing_type="swap",
    status="active",
    confirmed_unused=True,
)
gc_dispute_user1.set_card_number("1111000011110000")
gc_dispute_user1.set_pin("1111")
gc_dispute_user1.save()

gc_dispute_user2 = GiftCard(
    owner=user2,
    brand=brand2,
    value=Decimal("35.00"),
    expiry_date=date.today() + timedelta(days=60),
    listing_type="swap",
    status="active",
    confirmed_unused=True,
)
gc_dispute_user2.set_card_number("2222000022220000")
gc_dispute_user2.set_pin("2222")
gc_dispute_user2.save()

# Reset daily trade limits so user1 can trade again
user1.daily_trade_count = 0
user1.daily_trade_value = Decimal("0")
user1.save(update_fields=["daily_trade_count", "daily_trade_value"])

resp = test("Propose trade for dispute", "POST", "trades/", 201, token=user1_token, data={
    "initiator_card": gc_dispute_user1.id,
    "responder_card": gc_dispute_user2.id,
})
dispute_trade_id = None
if resp and resp.status_code == 201:
    dispute_trade_id = resp.json().get("trade_id")

if dispute_trade_id:
    test("Accept trade for dispute", "PATCH", f"trades/{dispute_trade_id}/respond/", 200, token=user2_token, data={
        "action": "accept",
    })
    test("Release codes for dispute", "POST", f"trades/{dispute_trade_id}/release/", 200, token=user1_token)
    test("File dispute", "POST", f"trades/{dispute_trade_id}/dispute/", 200, token=user2_token, data={
        "reason": "Card details are invalid or not working",
    })


# ────────────────────────────────────────────────────────────
#  SALE FLOW ENDPOINTS
# ────────────────────────────────────────────────────────────

print("\n=== SALE ENDPOINTS ===")

# List sales (initially empty)
test("List sales (user2)", "GET", "sales/", 200, token=user2_token)

# user2 buys gc_sell_user1 (owned by user1, listed for sell)
resp = test("Create sale", "POST", "sales/", 201, token=user2_token, data={
    "gift_card_id": gc_sell_user1.id,
})
sale_id = None
if resp and resp.status_code == 201:
    sale_data = resp.json()
    sale_id = sale_data.get("sale_id")

if sale_id:
    # Sale detail
    test("Sale detail", "GET", f"sales/{sale_id}/", 200, token=user2_token)

    # List sales with filter
    test("List sales filter", "GET", "sales/?status=pending", 200, token=user2_token)

    # Seller confirms sale
    test("Confirm sale (seller)", "PATCH", f"sales/{sale_id}/confirm/", 200, token=user1_token)

    # Verify sale completed
    resp = test("Sale completed", "GET", f"sales/{sale_id}/", 200, token=user2_token)
    if resp and resp.status_code == 200:
        status_val = resp.json().get("status")
        if status_val == "completed":
            print("         -> Sale correctly finalized as 'completed'.")


# ────────────────────────────────────────────────────────────
#  NOTIFICATION ENDPOINTS
# ────────────────────────────────────────────────────────────

print("\n=== NOTIFICATION ENDPOINTS ===")

test("List notifications", "GET", "notifications/", 200, token=user1_token)
test("Filter unread", "GET", "notifications/?is_read=false", 200, token=user1_token)
test("Unread count", "GET", "notifications/unread-count/", 200, token=user1_token)
test("Notification detail", "GET", f"notifications/{notif1.id}/", 200, token=user1_token)
test("Mark notification read", "PATCH", f"notifications/{notif1.id}/", 200, token=user1_token, data={
    "is_read": True,
})
test("Mark all read", "POST", "notifications/mark-all-read/", 200, token=user1_token)
test("Notifications no auth", "GET", "notifications/", 401)


# ────────────────────────────────────────────────────────────
#  REVIEW ENDPOINTS
# ────────────────────────────────────────────────────────────

print("\n=== REVIEW ENDPOINTS ===")

# Create a review (user1 reviews the completed trade partner user2)
# The Review model uses trade FK; create directly for the completed trade
if trade_id:
    trade_obj = Trade.objects.filter(trade_id=trade_id).first()
    if trade_obj:
        review = Review.objects.create(
            trade=trade_obj,
            reviewer=user1,
            target_user=user2,
            rating=5,
            comment="Great swap partner!",
        )

        test("List reviews", "GET", "reviews/", 200, token=user1_token)

        test("Review detail", "GET", f"reviews/{review.id}/", 200, token=user1_token)

        # Rating summary
        test("Rating summary", "GET", "seller/rating-summary/", 200, token=user2_token)

# Reviews without auth
test("Reviews no auth", "GET", "reviews/", 401)


# ────────────────────────────────────────────────────────────
#  FRAUD REPORT ENDPOINTS
# ────────────────────────────────────────────────────────────

print("\n=== FRAUD REPORT ENDPOINTS ===")

resp = test("Create fraud report", "POST", "fraud-reports/", 201, token=user1_token, data={
    "report_type": "suspicious_activity",
    "description": "This user seems suspicious during our trade.",
    "reported_user": user2.id,
})
fraud_report = FraudReport.objects.filter(reporter=user1).order_by("-created_at").first()
fraud_report_id = fraud_report.id if fraud_report else None

test("List fraud reports", "GET", "fraud-reports/", 200, token=user1_token)

if fraud_report_id:
    test("Fraud report detail", "GET", f"fraud-reports/{fraud_report_id}/", 200, token=user1_token)


# ────────────────────────────────────────────────────────────
#  MATCHES ENDPOINT
# ────────────────────────────────────────────────────────────

print("\n=== MATCHES ENDPOINT ===")

test("Match suggestions", "GET", "matches/", 200, token=user1_token)
test("Match suggestions with limit", "GET", "matches/?limit=5", 200, token=user1_token)
test("Matches no auth", "GET", "matches/", 401)


# ────────────────────────────────────────────────────────────
#  DASHBOARD ENDPOINTS
# ────────────────────────────────────────────────────────────

print("\n=== DASHBOARD ENDPOINTS ===")

test("Dashboard (user1)", "GET", "dashboard/", 200, token=user1_token)
test("Dashboard activity (user1)", "GET", "dashboard/activity/", 200, token=user1_token)
test("Dashboard no auth", "GET", "dashboard/", 401)


# ────────────────────────────────────────────────────────────
#  ADMIN ENDPOINTS
# ────────────────────────────────────────────────────────────

print("\n=== ADMIN ENDPOINTS ===")

if admin_token:
    # Users
    test("Admin list users", "GET", "admin/users/", 200, token=admin_token)
    test("Admin update user", "PATCH", f"admin/users/{user1.id}/", 200, token=admin_token, data={
        "status": "active",
    })

    # Transactions
    test("Admin list transactions", "GET", "admin/transactions/", 200, token=admin_token)

    # Disputes
    test("Admin list disputes", "GET", "admin/disputes/", 200, token=admin_token)

    # Find a dispute to update
    admin_dispute = Dispute.objects.first()
    if admin_dispute:
        test("Admin update dispute", "PATCH", f"admin/disputes/{admin_dispute.id}/", 200, token=admin_token, data={
            "status": "resolved",
            "resolution": "Resolved by admin during smoke test.",
            "admin_response": "Trade reversed, user compensated.",
        })

    # Fraud flags
    test("Admin list fraud flags", "GET", "admin/fraud-flags/", 200, token=admin_token)

    # Audit log
    test("Admin audit log", "GET", "admin/audit-log/", 200, token=admin_token)

    # Revenue
    test("Admin revenue", "GET", "admin/revenue/", 200, token=admin_token)

    # Dashboard
    test("Admin dashboard", "GET", "admin/dashboard/", 200, token=admin_token)

    # Platform settings
    test("Admin list settings", "GET", "admin/settings/", 200, token=admin_token)

    # Trade reversal (need a trade in appropriate state)
    # Create a new trade pair for admin reversal test
    gc_admin_test1 = GiftCard(
        owner=user1,
        brand=brand1,
        value=Decimal("20.00"),
        expiry_date=date.today() + timedelta(days=60),
        listing_type="swap",
        status="active",
        confirmed_unused=True,
    )
    gc_admin_test1.set_card_number("7777888899990000")
    gc_admin_test1.set_pin("7777")
    gc_admin_test1.save()

    gc_admin_test2 = GiftCard(
        owner=user2,
        brand=brand2,
        value=Decimal("22.00"),
        expiry_date=date.today() + timedelta(days=60),
        listing_type="swap",
        status="active",
        confirmed_unused=True,
    )
    gc_admin_test2.set_card_number("0000111122223333")
    gc_admin_test2.set_pin("0000")
    gc_admin_test2.save()

    # Reset trade limits for both users
    user1.daily_trade_count = 0
    user1.daily_trade_value = Decimal("0")
    user1.save(update_fields=["daily_trade_count", "daily_trade_value"])
    user2.daily_trade_count = 0
    user2.daily_trade_value = Decimal("0")
    user2.save(update_fields=["daily_trade_count", "daily_trade_value"])

    resp = test("Propose trade for admin reverse", "POST", "trades/", 201, token=user1_token, data={
        "initiator_card": gc_admin_test1.id,
        "responder_card": gc_admin_test2.id,
    })
    admin_trade_id = None
    if resp and resp.status_code == 201:
        admin_trade_id = resp.json().get("trade_id")

    if admin_trade_id:
        test("Accept trade for admin reverse", "PATCH", f"trades/{admin_trade_id}/respond/", 200, token=user2_token, data={
            "action": "accept",
        })
        test("Release for admin reverse", "POST", f"trades/{admin_trade_id}/release/", 200, token=user1_token)
        test("Admin reverse trade", "POST", f"admin/trades/{admin_trade_id}/reverse/", 200, token=admin_token)

    # Admin endpoints should reject non-admin users
    test("Admin users (non-admin)", "GET", "admin/users/", 403, token=user1_token)
    test("Admin dashboard (non-admin)", "GET", "admin/dashboard/", 403, token=user1_token)
else:
    print("  SKIP  Admin token not obtained; skipping admin tests.")


# ────────────────────────────────────────────────────────────
#  EDGE CASES & AUTHORIZATION CHECKS
# ────────────────────────────────────────────────────────────

print("\n=== EDGE CASES & AUTHORIZATION ===")

# Unauthenticated access to protected endpoints
test("Trades no auth", "GET", "trades/", 401)
test("Sales no auth", "GET", "sales/", 401)
test("Gift cards no auth", "GET", "gift-cards/", 401)
test("Fraud reports no auth", "GET", "fraud-reports/", 401)

# Non-owner trying to update user1's gift card
test(
    "Update other user's card",
    "PATCH",
    f"gift-cards/{gc_sell_user2.id}/",
    403,
    token=user1_token,
    data={"value": "999.00"},
)


# ────────────────────────────────────────────────────────────
#  Summary
# ────────────────────────────────────────────────────────────

print("\n" + "=" * 60)
print(f"  RESULTS: {passed} passed, {failed} failed, {passed + failed} total")
print("=" * 60)

if errors:
    print("\nFailed tests:")
    for err in errors:
        print(f"  - {err}")
else:
    print("\nAll tests passed!")


# ────────────────────────────────────────────────────────────
#  Cleanup
# ────────────────────────────────────────────────────────────

print("\n=== Cleaning up test data ===")
User.objects.filter(username__startswith="test_").delete()
Brand.objects.filter(name__startswith="TestBrand").delete()
print("Done.")
