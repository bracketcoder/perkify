from django.conf import settings


def turnstile_context(request):
    return {"turnstile_site_key": settings.TURNSTILE_SITE_KEY}
