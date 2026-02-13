from django.contrib.auth import authenticate, password_validation
from rest_framework import serializers

from core.models import User


class RegisterSerializer(serializers.ModelSerializer):
    """Register a new user with role=USER by default."""

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        password_validation.validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(role=User.Role.USER, **validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Authenticate by email + password. Reject banned / suspended accounts."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].lower()
        password = attrs["password"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")

        user = authenticate(username=user.username, password=password)
        if user is None:
            raise serializers.ValidationError("Invalid email or password.")

        if user.status == User.Status.BANNED:
            raise serializers.ValidationError("This account has been banned.")
        if user.status == User.Status.SUSPENDED:
            raise serializers.ValidationError("This account is currently suspended.")

        attrs["user"] = user
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    """Read / update the authenticated user's profile.

    Includes computed reputation stats as read-only fields.
    """

    reputation = serializers.SerializerMethodField()
    trust_tier_display = serializers.CharField(
        source="get_trust_tier_display", read_only=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "phone_verified",
            "location",
            "avatar",
            "role",
            "status",
            "is_verified",
            "trust_score",
            "trust_tier",
            "trust_tier_display",
            "wallet_balance",
            "date_joined",
            "reputation",
        ]
        read_only_fields = [
            "id",
            "username",
            "email",
            "role",
            "status",
            "is_verified",
            "phone_verified",
            "trust_score",
            "trust_tier",
            "trust_tier_display",
            "wallet_balance",
            "date_joined",
            "reputation",
        ]

    def get_reputation(self, obj):
        return obj.reputation


class ChangePasswordSerializer(serializers.Serializer):
    """Validate old password, ensure new passwords match & meet strength rules."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "New passwords do not match."}
            )
        password_validation.validate_password(attrs["new_password"])
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Accept an email address for password-reset requests."""

    email = serializers.EmailField()


class VerifyEmailSerializer(serializers.Serializer):
    """Accept a verification token (uid:token format)."""

    token = serializers.CharField()
