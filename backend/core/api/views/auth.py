from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.api.throttles import AuthRateThrottle
from core.emails import send_password_reset_email, send_verification_email
from core.models import User
from core.turnstile import verify_turnstile
from core.api.serializers.auth import (
    ChangePasswordSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    ProfileSerializer,
    RegisterSerializer,
    ResendOTPSerializer,
    VerifyEmailSerializer,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/

    Register a new user and send a 6-digit OTP to their email.
    Does NOT return JWT tokens — user must verify OTP first.
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verify Turnstile token
        turnstile_token = serializer.validated_data.get("turnstile_token", "")
        if not verify_turnstile(turnstile_token, request.META.get("REMOTE_ADDR")):
            return Response(
                {"detail": "Bot verification failed. Please try again."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = serializer.save()

        # Send OTP email
        send_verification_email(user)

        return Response(
            {
                "email": user.email,
                "detail": "A verification code has been sent to your email.",
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/auth/login/

    Authenticate with email + password.
    Returns user profile data and JWT tokens.
    Rejects banned and suspended accounts.
    """

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verify Turnstile token
        turnstile_token = serializer.validated_data.get("turnstile_token", "")
        if not verify_turnstile(turnstile_token, request.META.get("REMOTE_ADDR")):
            return Response(
                {"detail": "Bot verification failed. Please try again."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = serializer.validated_data["user"]
        tokens = RefreshToken.for_user(user)
        return Response(
            {
                "user": ProfileSerializer(user).data,
                "tokens": {
                    "access": str(tokens.access_token),
                    "refresh": str(tokens),
                },
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """POST /api/auth/logout/

    Blacklist the supplied refresh token (if provided) and return 200.
    The client should also discard tokens on its side.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Token may already be expired or blacklisted
        return Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_200_OK,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET  /api/auth/profile/ -- retrieve authenticated user's profile.
    PATCH /api/auth/profile/ -- update first_name, last_name, phone, location, avatar.

    All non-sensitive fields plus reputation stats are returned.
    """

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """PUT /api/auth/change-password/

    Validate old password, then set the new one.
    """

    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response(
            {"detail": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    """POST /api/auth/password-reset/

    Request a password reset email.  Always returns 200 regardless of
    whether the email exists to prevent enumeration attacks.
    """

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        try:
            user = User.objects.get(email__iexact=email)
            send_password_reset_email(user)
        except User.DoesNotExist:
            pass  # Always return success to prevent email enumeration
        return Response(
            {
                "detail": (
                    "If an account with that email exists, "
                    "a password reset link has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class ResendVerificationView(APIView):
    """POST /api/auth/resend-verification/

    Resend OTP to the given email (unauthenticated).
    """

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Return success anyway to prevent email enumeration
            return Response(
                {"detail": "If an account with that email exists, a new code has been sent."},
                status=status.HTTP_200_OK,
            )

        if user.is_verified:
            return Response(
                {"detail": "Email is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        send_verification_email(user)
        return Response(
            {"detail": "A new verification code has been sent to your email."},
            status=status.HTTP_200_OK,
        )


class VerifyEmailView(APIView):
    """POST /api/auth/verify-email/

    Verify a user's email using their email address and a 6-digit OTP.
    Returns JWT tokens on success so the user can proceed to the dashboard.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_verified:
            return Response(
                {"detail": "Email is already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check OTP matches
        if user.otp_code != otp:
            return Response(
                {"detail": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check OTP hasn't expired
        if not user.otp_expires_at or timezone.now() > user.otp_expires_at:
            return Response(
                {"detail": "Verification code has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark verified and clear OTP
        user.is_verified = True
        user.otp_code = ""
        user.otp_expires_at = None
        user.save(update_fields=["is_verified", "otp_code", "otp_expires_at"])

        # Issue JWT tokens now that user is verified
        tokens = RefreshToken.for_user(user)
        return Response(
            {
                "detail": "Email verified successfully.",
                "user": ProfileSerializer(user).data,
                "tokens": {
                    "access": str(tokens.access_token),
                    "refresh": str(tokens),
                },
            },
            status=status.HTTP_200_OK,
        )
