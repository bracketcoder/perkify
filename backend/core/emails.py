"""
Centralized email sending for Perkify.
Uses Django's email framework backed by SendGrid Web API.
"""

import logging
import random
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

logger = logging.getLogger("core")

FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:3000")


def _send(subject, text_body, html_body, to_email):
    """Send an email via SendGrid Web API."""
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
        reply_to=[getattr(settings, "REPLY_TO_EMAIL", settings.DEFAULT_FROM_EMAIL)],
    )
    msg.attach_alternative(html_body, "text/html")
    try:
        msg.send()
        logger.info("Email sent to %s: %s", to_email, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)


def generate_otp(user):
    """Generate a 6-digit OTP and store it on the user with a 10-minute expiry."""
    otp = f"{random.randint(0, 999999):06d}"
    user.otp_code = otp
    user.otp_expires_at = timezone.now() + timedelta(minutes=10)
    user.save(update_fields=["otp_code", "otp_expires_at"])
    return otp


def send_verification_email(user):
    """Send a 6-digit OTP code via email for account verification."""
    otp = generate_otp(user)

    subject = "Verify your Perkify account"

    text_body = (
        f"Hi {user.first_name or user.username},\n\n"
        f"Welcome to Perkify! Your verification code is:\n\n"
        f"    {otp}\n\n"
        f"Enter this code on the verification page to complete your registration.\n"
        f"This code expires in 10 minutes.\n\n"
        f"If you didn't create a Perkify account, you can ignore this email.\n\n"
        f"— The Perkify Team"
    )

    html_body = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #16a34a; font-size: 28px; margin: 0;">Perkify</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px;">
            <h2 style="color: #111827; font-size: 22px; margin: 0 0 8px;">Welcome, {user.first_name or user.username}!</h2>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Thanks for signing up for Perkify. Use the code below to verify your email address.
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <div style="display: inline-block; background: #f0fdf4; border: 2px solid #16a34a;
                            border-radius: 12px; padding: 16px 32px; letter-spacing: 8px;
                            font-size: 32px; font-weight: 700; color: #16a34a; font-family: monospace;">
                    {otp}
                </div>
            </div>
            <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 16px 0 0;">
                This code expires in <strong>10 minutes</strong>.
            </p>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 24px 0 0;">
                If you didn't create a Perkify account, you can ignore this email.
            </p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px;">
            Perkify — Swap &amp; Sell Gift Cards Securely
        </p>
    </div>
    """

    _send(subject, text_body, html_body, user.email)


def send_password_reset_email(user):
    """Send password reset link."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = f"{FRONTEND_URL}/auth/reset-password?uid={uid}&token={token}"

    subject = "Reset your Perkify password"

    text_body = (
        f"Hi {user.first_name or user.username},\n\n"
        f"We received a request to reset your password. Click the link below:\n\n"
        f"{reset_url}\n\n"
        f"If you didn't request this, you can safely ignore this email.\n\n"
        f"— The Perkify Team"
    )

    html_body = f"""
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #16a34a; font-size: 28px; margin: 0;">Perkify</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px;">
            <h2 style="color: #111827; font-size: 22px; margin: 0 0 8px;">Password Reset</h2>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                We received a request to reset your password. Click the button below to choose a new password.
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="{reset_url}"
                   style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none;
                          padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                    Reset Password
                </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 24px 0 0;">
                If you didn't request a password reset, you can safely ignore this email. Your password won't change.
            </p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px;">
            Perkify — Swap &amp; Sell Gift Cards Securely
        </p>
    </div>
    """

    _send(subject, text_body, html_body, user.email)
