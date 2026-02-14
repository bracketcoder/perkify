"""
Django settings for Perkify backend.
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
from django.templatetags.static import static
from django.urls import reverse_lazy

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-&og8u7(u(cvi(y34)e%g5q=nza8z*qucmt9-)mwq=3u(6)5(+1",
)

DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

FERNET_KEY = os.getenv("FERNET_KEY", "2CWLyuTISGPNhI3lk2hs7Og7cpstUT-g4H2VG44kU-I=")

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

LOGIN_REDIRECT_URL = "/theadmin/"

_csrf_origins = os.getenv("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
] + ([o.strip() for o in _csrf_origins.split(",") if o.strip()] if _csrf_origins else [])

# ─── Installed Apps ───
INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "anymail",
    # Local
    "core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_USER_MODEL = "core.User"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── Django Unfold Configuration ───
UNFOLD = {
    "SITE_TITLE": "Perkify Admin",
    "SITE_HEADER": "Perkify",
    "SITE_SUBHEADER": "Gift Card Swap & Sell Platform",
    "SITE_URL": os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "SITE_SYMBOL": "storefront",
    "SITE_FAVICONS": [
        {"rel": "icon", "sizes": "32x32", "type": "image/x-icon", "href": lambda request: static("favicon.ico")},
    ],
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "THEME": "light",
    "STYLES": [],
    "SCRIPTS": [],
    "COLORS": {
        "primary": {
            "50": "240 253 244",
            "100": "220 252 231",
            "200": "187 247 208",
            "300": "134 239 172",
            "400": "74 222 128",
            "500": "34 197 94",
            "600": "22 163 74",
            "700": "21 128 61",
            "800": "22 101 52",
            "900": "20 83 45",
            "950": "5 46 22",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Dashboard",
                "separator": True,
                "collapsible": False,
                "items": [
                    {
                        "title": "Admin Overview",
                        "icon": "dashboard",
                        "link": reverse_lazy("admin:index"),
                    },
                ],
            },
            {
                "title": "User Management",
                "separator": True,
                "collapsible": False,
                "items": [
                    {
                        "title": "Users",
                        "icon": "people",
                        "link": reverse_lazy("admin:core_user_changelist"),
                    },
                ],
            },
            {
                "title": "Gift Cards",
                "separator": True,
                "collapsible": False,
                "items": [
                    {
                        "title": "Gift Cards",
                        "icon": "card_giftcard",
                        "link": reverse_lazy("admin:core_giftcard_changelist"),
                    },
                    {
                        "title": "Brands",
                        "icon": "storefront",
                        "link": reverse_lazy("admin:core_brand_changelist"),
                    },
                ],
            },
            {
                "title": "Trading",
                "separator": True,
                "collapsible": False,
                "items": [
                    {
                        "title": "Trades (Swaps)",
                        "icon": "swap_horiz",
                        "link": reverse_lazy("admin:core_trade_changelist"),
                    },
                    {
                        "title": "Sales",
                        "icon": "sell",
                        "link": reverse_lazy("admin:core_sale_changelist"),
                    },
                    {
                        "title": "Escrow Sessions",
                        "icon": "lock",
                        "link": reverse_lazy("admin:core_escrowsession_changelist"),
                    },
                    {
                        "title": "Disputes",
                        "icon": "gavel",
                        "link": reverse_lazy("admin:core_dispute_changelist"),
                    },
                    {
                        "title": "Reviews",
                        "icon": "star",
                        "link": reverse_lazy("admin:core_review_changelist"),
                    },
                ],
            },
            {
                "title": "Platform",
                "separator": True,
                "collapsible": False,
                "items": [
                    {
                        "title": "Platform Settings",
                        "icon": "settings",
                        "link": reverse_lazy("admin:core_platformsettings_changelist"),
                    },
                    {
                        "title": "Notification Rules",
                        "icon": "notifications",
                        "link": reverse_lazy("admin:core_notificationrule_changelist"),
                    },
                    {
                        "title": "Notifications",
                        "icon": "mail",
                        "link": reverse_lazy("admin:core_notification_changelist"),
                    },
                ],
            },
            {
                "title": "Security & Fraud",
                "separator": True,
                "collapsible": False,
                "items": [
                    {
                        "title": "Fraud Flags (Auto)",
                        "icon": "flag",
                        "link": reverse_lazy("admin:core_fraudflag_changelist"),
                    },
                    {
                        "title": "Fraud Reports",
                        "icon": "report",
                        "link": reverse_lazy("admin:core_fraudreport_changelist"),
                    },
                    {
                        "title": "Audit Log",
                        "icon": "security",
                        "link": reverse_lazy("admin:core_auditlog_changelist"),
                    },
                ],
            },
        ],
    },
}

# ─── Security Settings (Task-5 & Task-6) ───
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 3600  # 1-hour session timeout
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_SAVE_EVERY_REQUEST = True

# Password strength (enhanced)
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─── Logging (Task-6: Scalable Backend) ───
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": BASE_DIR / "logs" / "perkify.log",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
        },
        "core": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}

# ─── Caching (Task-6: Scalable Backend) ───
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "perkify-cache",
        "TIMEOUT": 300,
    }
}

# ─── Django REST Framework ───
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.api.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/minute",
        "user": "120/minute",
        "auth": "5/minute",
    },
}

# ─── Simple JWT ───
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ─── CORS ───
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True
_cors_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(",") if o.strip()]

# ─── Email (SendGrid Web API) ───
EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"
ANYMAIL = {
    "SENDGRID_API_KEY": os.getenv("SENDGRID_API_KEY", ""),
}
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "info@perkifys.com")
REPLY_TO_EMAIL = os.getenv("REPLY_TO_EMAIL", "support@perkifys.com")

# ─── OpenAI ───
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
