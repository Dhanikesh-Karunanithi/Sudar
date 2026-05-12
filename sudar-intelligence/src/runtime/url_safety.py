"""Guardrails for user-supplied OpenAI-compatible base URLs (BYOM / local runtime).

ModelRouter health_check issues outbound HTTP; without validation, any caller who can
pass org_settings (e.g. authenticated tutor/content routes) could target loopback,
link-local (cloud metadata), or RFC1918 addresses from the Intelligence host.
"""

from __future__ import annotations

import ipaddress
import os
from urllib.parse import urlparse


class UnsafeLlmUrlError(ValueError):
    """Raised when base_url must not be used for outbound requests."""


def _allow_private_llm_urls() -> bool:
    return os.environ.get("INTELLIGENCE_ALLOW_PRIVATE_LLM_URLS", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )


def validate_llm_base_url(url: str) -> str:
    raw = (url or "").strip()
    if not raw:
        raise UnsafeLlmUrlError("base_url is empty")
    parsed = urlparse(raw)
    if parsed.scheme not in ("http", "https"):
        raise UnsafeLlmUrlError("base_url must use http or https")
    host = parsed.hostname
    if not host:
        raise UnsafeLlmUrlError("base_url must include a host")

    host_norm = host.lower().strip("[]")

    blocked_names = frozenset(
        {
            "localhost",
            "0.0.0.0",
            "metadata",
            "metadata.google.internal",
        }
    )
    if host_norm in blocked_names or host_norm.endswith(".localhost"):
        raise UnsafeLlmUrlError("blocked hostname")

    try:
        ip = ipaddress.ip_address(host_norm)
    except ValueError:
        # Not a literal IP — hostname is allowed (cannot pre-resolve DNS here).
        return raw

    if ip.is_loopback or ip.is_link_local:
        raise UnsafeLlmUrlError("blocked IP (loopback or link-local)")
    if not _allow_private_llm_urls() and (ip.is_private or ip.is_reserved or ip.is_multicast):
        raise UnsafeLlmUrlError("blocked IP (private or special-use range)")

    return raw
