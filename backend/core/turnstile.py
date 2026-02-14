import logging

import httpx
from django.conf import settings

logger = logging.getLogger("core")


def verify_turnstile(token, remote_ip=None):
    """Verify a Cloudflare Turnstile token via the siteverify API.

    Returns True if the token is valid, False otherwise.
    """
    if not token:
        return False

    payload = {
        "secret": settings.TURNSTILE_SECRET_KEY,
        "response": token,
    }
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        resp = httpx.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data=payload,
            timeout=5,
        )
        result = resp.json()
        success = result.get("success", False)
        if not success:
            logger.warning("Turnstile verification failed: %s", result)
        return success
    except httpx.HTTPError:
        logger.exception("Turnstile API request failed")
        return False
