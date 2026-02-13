from rest_framework.throttling import AnonRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """Strict rate limit for authentication endpoints (register, login, password-reset)."""

    scope = "auth"
