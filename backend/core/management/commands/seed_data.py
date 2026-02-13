"""
Management command to seed the database with realistic demo data.

Usage:
    python manage.py seed_data

Idempotent: checks if data already exists before creating.
"""

from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import (
    AuditLog,
    Brand,
    Dispute,
    EscrowSession,
    FraudFlag,
    FraudReport,
    GiftCard,
    Notification,
    PlatformSettings,
    Review,
    Sale,
    Trade,
    User,
)


class Command(BaseCommand):
    help = "Seed the database with realistic demo data for the Perkify platform."

    def handle(self, *args, **options):
        if Brand.objects.filter(name="Amazon").exists():
            self.stdout.write(self.style.WARNING("Seed data already exists. Skipping."))
            return

        self.stdout.write("Seeding database...")

        # ── Brands ──
        brands_data = [
            {"name": "Amazon", "category": "General Retail", "is_popular": True},
            {"name": "Starbucks", "category": "Food & Drink", "is_popular": True},
            {"name": "Target", "category": "General Retail", "is_popular": True},
            {"name": "Walmart", "category": "General Retail", "is_popular": False},
            {"name": "Apple", "category": "Technology", "is_popular": True},
        ]
        brands = {}
        for bd in brands_data:
            brands[bd["name"]] = Brand.objects.create(**bd)
        self.stdout.write(self.style.SUCCESS("  Created 5 brands"))

        # ── Users ──
        users_data = [
            {
                "username": "alice_trade",
                "email": "alice@example.com",
                "first_name": "Alice",
                "last_name": "Johnson",
                "trust_tier": User.TrustTier.TRUSTED,
                "trust_score": 92,
                "wallet_balance": Decimal("345.50"),
                "is_verified": True,
                "phone": "+1-555-0101",
                "phone_verified": True,
                "location": "New York, NY",
            },
            {
                "username": "bob_swap",
                "email": "bob@example.com",
                "first_name": "Bob",
                "last_name": "Martinez",
                "trust_tier": User.TrustTier.ESTABLISHED,
                "trust_score": 75,
                "wallet_balance": Decimal("120.00"),
                "is_verified": True,
                "phone": "+1-555-0102",
                "phone_verified": True,
                "location": "Los Angeles, CA",
            },
            {
                "username": "carol_seller",
                "email": "carol@example.com",
                "first_name": "Carol",
                "last_name": "Williams",
                "trust_tier": User.TrustTier.TRUSTED,
                "trust_score": 88,
                "wallet_balance": Decimal("510.25"),
                "is_verified": True,
                "phone": "+1-555-0103",
                "phone_verified": True,
                "location": "Chicago, IL",
            },
            {
                "username": "dave_new",
                "email": "dave@example.com",
                "first_name": "Dave",
                "last_name": "Brown",
                "trust_tier": User.TrustTier.NEW,
                "trust_score": 50,
                "wallet_balance": Decimal("25.00"),
                "is_verified": False,
                "phone": "+1-555-0104",
                "phone_verified": False,
                "location": "Houston, TX",
            },
            {
                "username": "eve_buyer",
                "email": "eve@example.com",
                "first_name": "Eve",
                "last_name": "Davis",
                "trust_tier": User.TrustTier.ESTABLISHED,
                "trust_score": 70,
                "wallet_balance": Decimal("200.75"),
                "is_verified": True,
                "phone": "+1-555-0105",
                "phone_verified": True,
                "location": "Phoenix, AZ",
            },
            {
                "username": "frank_flipper",
                "email": "frank@example.com",
                "first_name": "Frank",
                "last_name": "Garcia",
                "trust_tier": User.TrustTier.NEW,
                "trust_score": 40,
                "wallet_balance": Decimal("15.00"),
                "is_verified": False,
                "phone": "+1-555-0106",
                "phone_verified": False,
                "location": "Philadelphia, PA",
                "status": User.Status.RESTRICTED,
            },
            {
                "username": "grace_gifts",
                "email": "grace@example.com",
                "first_name": "Grace",
                "last_name": "Lee",
                "trust_tier": User.TrustTier.TRUSTED,
                "trust_score": 95,
                "wallet_balance": Decimal("890.00"),
                "is_verified": True,
                "phone": "+1-555-0107",
                "phone_verified": True,
                "location": "San Antonio, TX",
            },
            {
                "username": "henry_holder",
                "email": "henry@example.com",
                "first_name": "Henry",
                "last_name": "Wilson",
                "trust_tier": User.TrustTier.ESTABLISHED,
                "trust_score": 68,
                "wallet_balance": Decimal("75.50"),
                "is_verified": True,
                "phone": "+1-555-0108",
                "phone_verified": False,
                "location": "San Diego, CA",
            },
            {
                "username": "irene_invest",
                "email": "irene@example.com",
                "first_name": "Irene",
                "last_name": "Anderson",
                "trust_tier": User.TrustTier.NEW,
                "trust_score": 55,
                "wallet_balance": Decimal("50.00"),
                "is_verified": False,
                "phone": "+1-555-0109",
                "phone_verified": False,
                "location": "Dallas, TX",
            },
            {
                "username": "jack_deals",
                "email": "jack@example.com",
                "first_name": "Jack",
                "last_name": "Thomas",
                "trust_tier": User.TrustTier.ESTABLISHED,
                "trust_score": 72,
                "wallet_balance": Decimal("165.25"),
                "is_verified": True,
                "phone": "+1-555-0110",
                "phone_verified": True,
                "location": "San Jose, CA",
            },
        ]

        users = []
        for ud in users_data:
            status = ud.pop("status", User.Status.ACTIVE)
            user = User.objects.create_user(
                password="DemoPass123!",
                status=status,
                **ud,
            )
            users.append(user)
        self.stdout.write(self.style.SUCCESS("  Created 10 users"))

        alice, bob, carol, dave, eve = users[0], users[1], users[2], users[3], users[4]
        frank, grace, henry, irene, jack = users[5], users[6], users[7], users[8], users[9]

        # ── Gift Cards (15) ──
        now = timezone.now()
        future_expiry = (now + timedelta(days=180)).date()
        near_expiry = (now + timedelta(days=15)).date()

        cards_data = [
            # Alice's cards
            {"owner": alice, "brand": brands["Amazon"], "value": Decimal("50.00"), "listing_type": "swap", "status": "active", "expiry_date": future_expiry, "confirmed_unused": True},
            {"owner": alice, "brand": brands["Starbucks"], "value": Decimal("25.00"), "listing_type": "sell", "status": "active", "expiry_date": future_expiry, "selling_price": Decimal("22.00"), "confirmed_unused": True},
            # Bob's cards
            {"owner": bob, "brand": brands["Target"], "value": Decimal("100.00"), "listing_type": "swap", "status": "active", "expiry_date": future_expiry, "confirmed_unused": True},
            {"owner": bob, "brand": brands["Apple"], "value": Decimal("75.00"), "listing_type": "sell", "status": "sold", "expiry_date": future_expiry, "selling_price": Decimal("68.00"), "confirmed_unused": True},
            # Carol's cards
            {"owner": carol, "brand": brands["Walmart"], "value": Decimal("150.00"), "listing_type": "swap", "status": "in_trade", "expiry_date": future_expiry, "confirmed_unused": True},
            {"owner": carol, "brand": brands["Amazon"], "value": Decimal("200.00"), "listing_type": "sell", "status": "active", "expiry_date": future_expiry, "selling_price": Decimal("185.00"), "confirmed_unused": True},
            # Dave's cards
            {"owner": dave, "brand": brands["Starbucks"], "value": Decimal("15.00"), "listing_type": "swap", "status": "active", "expiry_date": near_expiry, "confirmed_unused": False},
            {"owner": dave, "brand": brands["Target"], "value": Decimal("30.00"), "listing_type": "sell", "status": "pending_review", "expiry_date": future_expiry, "selling_price": Decimal("26.00"), "confirmed_unused": False},
            # Eve's cards
            {"owner": eve, "brand": brands["Apple"], "value": Decimal("250.00"), "listing_type": "sell", "status": "active", "expiry_date": future_expiry, "selling_price": Decimal("230.00"), "confirmed_unused": True},
            {"owner": eve, "brand": brands["Amazon"], "value": Decimal("40.00"), "listing_type": "swap", "status": "swapped", "expiry_date": future_expiry, "confirmed_unused": True},
            # Grace's cards
            {"owner": grace, "brand": brands["Walmart"], "value": Decimal("75.00"), "listing_type": "swap", "status": "in_trade", "expiry_date": future_expiry, "confirmed_unused": True},
            {"owner": grace, "brand": brands["Starbucks"], "value": Decimal("50.00"), "listing_type": "sell", "status": "active", "expiry_date": future_expiry, "selling_price": Decimal("45.00"), "confirmed_unused": True},
            # Henry's cards
            {"owner": henry, "brand": brands["Target"], "value": Decimal("60.00"), "listing_type": "swap", "status": "active", "expiry_date": near_expiry, "confirmed_unused": True},
            # Jack's cards
            {"owner": jack, "brand": brands["Apple"], "value": Decimal("100.00"), "listing_type": "sell", "status": "active", "expiry_date": future_expiry, "selling_price": Decimal("92.00"), "confirmed_unused": True},
            {"owner": jack, "brand": brands["Amazon"], "value": Decimal("35.00"), "listing_type": "swap", "status": "expired", "expiry_date": (now - timedelta(days=10)).date(), "confirmed_unused": True},
        ]

        cards = []
        for cd in cards_data:
            card = GiftCard.objects.create(**cd)
            card.set_card_number(f"4111-{card.pk:04d}-0000-{card.pk:04d}")
            card.set_pin(f"{1000 + card.pk}")
            card.save(update_fields=["card_number_encrypted", "pin_encrypted"])
            cards.append(card)
        self.stdout.write(self.style.SUCCESS("  Created 15 gift cards"))

        # ── Trades (5) ──
        # Trade 1: proposed (Alice <-> Bob)
        trade1 = Trade.objects.create(
            initiator=alice,
            responder=bob,
            initiator_card=cards[0],   # Alice's Amazon $50
            responder_card=cards[2],   # Bob's Target $100
            status="proposed",
            platform_fee_initiator=Decimal("2.50"),
            platform_fee_responder=Decimal("5.00"),
            notes="Hi Bob, want to swap Amazon for Target?",
        )

        # Trade 2: in_escrow (Carol <-> Grace)
        trade2 = Trade.objects.create(
            initiator=carol,
            responder=grace,
            initiator_card=cards[4],   # Carol's Walmart $150
            responder_card=cards[10],  # Grace's Walmart $75
            status="in_escrow",
            platform_fee_initiator=Decimal("7.50"),
            platform_fee_responder=Decimal("3.75"),
        )

        # Trade 3: completed (Eve <-> Alice)
        trade3 = Trade.objects.create(
            initiator=eve,
            responder=alice,
            initiator_card=cards[9],   # Eve's Amazon $40 (swapped)
            responder_card=cards[1],   # Alice's Starbucks $25
            status="completed",
            platform_fee_initiator=Decimal("2.00"),
            platform_fee_responder=Decimal("1.25"),
            initiator_confirmed=True,
            responder_confirmed=True,
        )

        # Trade 4: disputed (Dave <-> Henry)
        trade4 = Trade.objects.create(
            initiator=dave,
            responder=henry,
            initiator_card=cards[6],   # Dave's Starbucks $15
            responder_card=cards[12],  # Henry's Target $60
            status="disputed",
            platform_fee_initiator=Decimal("0.75"),
            platform_fee_responder=Decimal("3.00"),
        )

        # Trade 5: completed (Jack <-> Bob)
        trade5 = Trade.objects.create(
            initiator=jack,
            responder=bob,
            initiator_card=cards[14],  # Jack's Amazon $35 (expired)
            responder_card=cards[3],   # Bob's Apple $75
            status="completed",
            platform_fee_initiator=Decimal("1.75"),
            platform_fee_responder=Decimal("3.75"),
            initiator_confirmed=True,
            responder_confirmed=True,
        )
        self.stdout.write(self.style.SUCCESS("  Created 5 trades"))

        # ── Sales (3) ──
        # Sale 1: completed (Eve sells Apple to Alice)
        sale1 = Sale.objects.create(
            buyer=alice,
            seller=eve,
            gift_card=cards[8],    # Eve's Apple $250
            amount=Decimal("230.00"),
            platform_fee=Decimal("11.50"),
            status="completed",
            code_revealed=True,
        )

        # Sale 2: pending (Carol sells Amazon to Dave)
        sale2 = Sale.objects.create(
            buyer=dave,
            seller=carol,
            gift_card=cards[5],    # Carol's Amazon $200
            amount=Decimal("185.00"),
            platform_fee=Decimal("9.25"),
            status="pending",
            code_revealed=False,
        )

        # Sale 3: disputed (Jack sells Apple to Frank)
        sale3 = Sale.objects.create(
            buyer=frank,
            seller=jack,
            gift_card=cards[13],   # Jack's Apple $100
            amount=Decimal("92.00"),
            platform_fee=Decimal("4.60"),
            status="disputed",
            code_revealed=True,
            notes="Buyer claims card was already partially used.",
        )
        self.stdout.write(self.style.SUCCESS("  Created 3 sales"))

        # ── Escrow Sessions (3) ──
        EscrowSession.objects.create(
            trade=trade2,
            status="locked",
        )

        EscrowSession.objects.create(
            trade=trade3,
            status="finalized",
            released_at=now - timedelta(hours=48),
            confirmation_deadline=now - timedelta(hours=24),
            finalized_at=now - timedelta(hours=12),
        )

        EscrowSession.objects.create(
            trade=trade4,
            status="locked",
            confirmation_deadline=now + timedelta(hours=12),
        )
        self.stdout.write(self.style.SUCCESS("  Created 3 escrow sessions"))

        # ── Disputes (5) ──
        Dispute.objects.create(
            trade=trade4,
            raised_by=henry,
            reason="The Starbucks card Dave sent was already used. Balance shows $0.",
            status="open",
        )

        Dispute.objects.create(
            sale=sale3,
            raised_by=frank,
            reason="The Apple gift card only had $47 remaining instead of $100.",
            status="under_review",
        )

        admin_user = User.objects.filter(is_superuser=True).first()
        Dispute.objects.create(
            trade=trade5,
            raised_by=bob,
            reason="Jack's Amazon card was expired at time of trade.",
            status="resolved",
            resolution="Refund issued to Bob. Jack warned about listing expired cards.",
            admin_response="Both parties have been notified. Fees reversed.",
            resolved_by=admin_user,
        )

        Dispute.objects.create(
            trade=trade1,
            raised_by=bob,
            reason="Value mismatch -- Amazon $50 is not a fair trade for Target $100.",
            status="open",
        )

        Dispute.objects.create(
            sale=sale2,
            raised_by=dave,
            reason="Seller has not responded for 3 days. Card may be invalid.",
            status="under_review",
        )
        self.stdout.write(self.style.SUCCESS("  Created 5 disputes"))

        # ── Notifications (10) ──
        notifications_data = [
            {"user": alice, "type": "trade", "title": "New Trade Proposal", "message": "You received a trade proposal from Bob for your Amazon $50 card.", "related_trade": trade1},
            {"user": bob, "type": "trade", "title": "Trade Accepted", "message": "Your trade with Carol has moved to escrow.", "related_trade": trade2},
            {"user": carol, "type": "sale", "title": "New Purchase Request", "message": "Dave wants to buy your Amazon $200 gift card.", "related_sale": sale2},
            {"user": eve, "type": "trade", "title": "Trade Completed", "message": "Your trade with Alice has been completed successfully!", "related_trade": trade3},
            {"user": henry, "type": "dispute", "title": "Dispute Opened", "message": "Your dispute regarding trade with Dave has been opened.", "related_trade": trade4},
            {"user": frank, "type": "dispute", "title": "Dispute Under Review", "message": "An admin is reviewing your dispute about the Apple gift card.", "related_sale": sale3},
            {"user": alice, "type": "system", "title": "Welcome to Perkify!", "message": "Thanks for joining! Start by listing your unused gift cards."},
            {"user": grace, "type": "match", "title": "Match Found!", "message": "A Walmart card matching your preferences has been listed."},
            {"user": dave, "type": "confirmation", "title": "Confirm Your Trade", "message": "Please confirm receipt of the gift card within 24 hours.", "related_trade": trade4},
            {"user": jack, "type": "sale", "title": "Sale Disputed", "message": "Frank has raised a dispute on your Apple gift card sale.", "related_sale": sale3},
        ]

        for nd in notifications_data:
            Notification.objects.create(**nd)
        # Mark some as read
        Notification.objects.filter(user=alice, title="Welcome to Perkify!").update(is_read=True)
        Notification.objects.filter(user=eve).update(is_read=True)
        self.stdout.write(self.style.SUCCESS("  Created 10 notifications"))

        # ── Reviews (5) ──
        Review.objects.create(
            trade=trade3,
            reviewer=eve,
            target_user=alice,
            rating=5,
            comment="Alice was very responsive and the card worked perfectly. Great swap!",
        )
        Review.objects.create(
            trade=trade3,
            reviewer=alice,
            target_user=eve,
            rating=4,
            comment="Smooth trade, card was as described. Minor delay in confirmation.",
        )
        Review.objects.create(
            trade=trade5,
            reviewer=jack,
            target_user=bob,
            rating=5,
            comment="Bob confirmed quickly. Very trustworthy trader.",
        )
        Review.objects.create(
            sale=sale1,
            reviewer=alice,
            target_user=eve,
            rating=5,
            comment="Eve sold me a great Apple card at a fair price. Highly recommend.",
        )
        Review.objects.create(
            trade=trade5,
            reviewer=bob,
            target_user=jack,
            rating=2,
            comment="Card turned out to be expired. Had to open a dispute.",
        )
        self.stdout.write(self.style.SUCCESS("  Created 5 reviews"))

        # ── Fraud Flags (3) ──
        FraudFlag.objects.create(
            user=frank,
            flag_type="rapid_trades",
            details="User attempted 8 trades in under 10 minutes. Exceeds rate limit for NEW tier.",
            status="pending",
            auto_restricted=True,
        )
        FraudFlag.objects.create(
            user=dave,
            flag_type="repeated_disputes",
            details="User has been involved in 3 disputes within the last 7 days.",
            status="reviewed",
            reviewed_by=admin_user,
            admin_notes="User warned. Monitoring for further activity.",
        )
        FraudFlag.objects.create(
            user=irene,
            flag_type="abnormal_value",
            details="New user listed a $500 card immediately after registration. Unusual for NEW tier.",
            status="pending",
            auto_restricted=False,
        )
        self.stdout.write(self.style.SUCCESS("  Created 3 fraud flags"))

        # ── Fraud Reports (2) ──
        FraudReport.objects.create(
            reporter=henry,
            reported_user=dave,
            reported_card=cards[6],
            report_type="used_card",
            description="Dave's Starbucks $15 card was already used. Balance was $0 when I checked.",
            evidence="Screenshot of zero balance check attached. Checked via Starbucks website.",
            status="investigating",
            reviewed_by=admin_user,
            admin_notes="Investigating the card. Will contact Starbucks for verification.",
        )
        FraudReport.objects.create(
            reporter=frank,
            reported_user=jack,
            reported_card=cards[13],
            report_type="fake_card",
            description="The Apple card Jack sold me only had $47 balance, not $100 as listed.",
            evidence="Balance check screenshot from Apple website showing $47.23 remaining.",
            status="pending",
        )
        self.stdout.write(self.style.SUCCESS("  Created 2 fraud reports"))

        # ── Audit Log (10) ──
        audit_entries = [
            {"user": alice, "action": "login", "description": "Alice logged in from web browser.", "ip_address": "192.168.1.10", "user_agent": "Mozilla/5.0 Chrome/120"},
            {"user": bob, "action": "login", "description": "Bob logged in from mobile app.", "ip_address": "192.168.1.20", "user_agent": "PerkifyApp/1.2 iOS/17"},
            {"user": alice, "action": "card_listed", "description": "Alice listed Amazon $50 gift card for swap.", "ip_address": "192.168.1.10", "metadata": {"card_id": cards[0].pk, "value": "50.00"}},
            {"user": eve, "action": "trade_proposed", "description": "Eve proposed a trade with Alice.", "ip_address": "10.0.0.5", "metadata": {"trade_id": trade3.trade_id}},
            {"user": carol, "action": "card_listed", "description": "Carol listed Amazon $200 gift card for sale.", "ip_address": "172.16.0.15", "metadata": {"card_id": cards[5].pk, "value": "200.00"}},
            {"user": alice, "action": "trade_completed", "description": "Trade between Eve and Alice completed.", "ip_address": "192.168.1.10", "metadata": {"trade_id": trade3.trade_id}},
            {"user": frank, "action": "login_failed", "description": "Failed login attempt for user frank_flipper.", "ip_address": "203.0.113.50", "user_agent": "Mozilla/5.0 Firefox/115"},
            {"user": henry, "action": "dispute_opened", "description": "Henry opened a dispute against Dave regarding trade.", "ip_address": "10.0.1.8", "metadata": {"trade_id": trade4.trade_id}},
            {"user": frank, "action": "user_restricted", "description": "Frank's account auto-restricted due to rapid trading activity.", "ip_address": "203.0.113.50"},
            {"user": admin_user, "action": "admin_action", "description": "Admin reviewed fraud flag for frank_flipper.", "ip_address": "10.0.0.1", "metadata": {"action": "fraud_flag_review", "user": "frank_flipper"}},
        ]

        for ae in audit_entries:
            AuditLog.objects.create(**ae)
        self.stdout.write(self.style.SUCCESS("  Created 10 audit log entries"))

        # ── Platform Settings ──
        settings_data = [
            {"key": "fee_percentage", "value": "5", "description": "Platform fee percentage on trades and sales", "category": "fee"},
            {"key": "max_daily_trades_new", "value": "3", "description": "Max daily trades for NEW tier users", "category": "trade_limits"},
            {"key": "max_daily_value_new", "value": "200", "description": "Max daily trade value ($) for NEW tier users", "category": "trade_limits"},
            {"key": "confirmation_window_minutes", "value": "60", "description": "Minutes allowed for trade confirmation after code release", "category": "confirmation"},
            {"key": "max_daily_trades_established", "value": "10", "description": "Max daily trades for ESTABLISHED tier users", "category": "trade_limits"},
            {"key": "max_daily_trades_trusted", "value": "25", "description": "Max daily trades for TRUSTED tier users", "category": "trade_limits"},
            {"key": "max_daily_value_established", "value": "500", "description": "Max daily trade value ($) for ESTABLISHED tier users", "category": "trade_limits"},
            {"key": "max_daily_value_trusted", "value": "2000", "description": "Max daily trade value ($) for TRUSTED tier users", "category": "trade_limits"},
            {"key": "max_active_trades_new", "value": "1", "description": "Max simultaneous active trades for NEW tier users", "category": "trade_limits"},
            {"key": "max_active_trades_established", "value": "5", "description": "Max simultaneous active trades for ESTABLISHED tier users", "category": "trade_limits"},
            {"key": "max_active_trades_trusted", "value": "10", "description": "Max simultaneous active trades for TRUSTED tier users", "category": "trade_limits"},
            {"key": "trust_score_threshold_established", "value": "65", "description": "Trust score needed to reach ESTABLISHED tier", "category": "trust"},
            {"key": "trust_score_threshold_trusted", "value": "85", "description": "Trust score needed to reach TRUSTED tier", "category": "trust"},
        ]

        for sd in settings_data:
            PlatformSettings.objects.create(**sd)
        self.stdout.write(self.style.SUCCESS("  Created platform settings"))

        self.stdout.write(self.style.SUCCESS("\nSeed data created successfully!"))
        self.stdout.write(f"  Brands: {Brand.objects.count()}")
        self.stdout.write(f"  Users: {User.objects.filter(is_superuser=False).count()}")
        self.stdout.write(f"  Gift Cards: {GiftCard.objects.count()}")
        self.stdout.write(f"  Trades: {Trade.objects.count()}")
        self.stdout.write(f"  Sales: {Sale.objects.count()}")
        self.stdout.write(f"  Escrow Sessions: {EscrowSession.objects.count()}")
        self.stdout.write(f"  Disputes: {Dispute.objects.count()}")
        self.stdout.write(f"  Notifications: {Notification.objects.count()}")
        self.stdout.write(f"  Reviews: {Review.objects.count()}")
        self.stdout.write(f"  Fraud Flags: {FraudFlag.objects.count()}")
        self.stdout.write(f"  Fraud Reports: {FraudReport.objects.count()}")
        self.stdout.write(f"  Audit Logs: {AuditLog.objects.count()}")
        self.stdout.write(f"  Platform Settings: {PlatformSettings.objects.count()}")
