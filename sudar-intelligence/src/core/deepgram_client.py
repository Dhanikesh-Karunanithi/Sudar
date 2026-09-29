"""Deepgram Nova STT for SudarSim (when DEEPGRAM_API_KEY is set)."""

from __future__ import annotations

import os

import httpx

DEEPGRAM_LISTEN_URL = "https://api.deepgram.com/v1/listen"


def deepgram_api_key() -> str | None:
    return os.environ.get("DEEPGRAM_API_KEY", "").strip() or None


def _language_param(locale: str | None) -> str | None:
    if not locale:
        return None
    loc = locale.strip().lower()
    if loc.startswith("en"):
        return "en"
    if loc.startswith("fr"):
        return "fr"
    if loc.startswith("es"):
        return "es"
    if loc.startswith("pt"):
        return "pt"
    if loc in ("ta", "hi"):
        return loc
    return loc.split("-")[0] if "-" in loc else loc


async def transcribe_deepgram(
    audio_bytes: bytes,
    *,
    content_type: str = "audio/webm",
    locale: str | None = None,
    model: str | None = None,
) -> dict[str, str]:
    key = deepgram_api_key()
    if not key:
        raise RuntimeError("DEEPGRAM_API_KEY not configured")

    model_id = (model or os.environ.get("DEEPGRAM_MODEL", "nova-2")).strip() or "nova-2"
    params: dict[str, str] = {"model": model_id, "smart_format": "true", "punctuate": "true"}
    lang = _language_param(locale)
    if lang:
        params["language"] = lang

    headers = {
        "Authorization": f"Token {key}",
        "Content-Type": content_type.split(";")[0].strip() or "audio/webm",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(DEEPGRAM_LISTEN_URL, params=params, headers=headers, content=audio_bytes)
        if res.status_code >= 400:
            raise RuntimeError(f"Deepgram STT failed ({res.status_code}): {res.text[:400]}")
        data = res.json()

    try:
        text = (
            data.get("results", {})
            .get("channels", [{}])[0]
            .get("alternatives", [{}])[0]
            .get("transcript", "")
        )
    except (IndexError, KeyError, TypeError):
        text = ""
    return {"text": (text or "").strip()}
