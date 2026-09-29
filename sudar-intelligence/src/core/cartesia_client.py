"""Cartesia streaming TTS for SudarSim (when CARTESIA_API_KEY is set)."""

from __future__ import annotations

import os

import httpx

CARTESIA_BYTES_URL = "https://api.cartesia.ai/tts/bytes"
DEFAULT_CARTESIA_VOICE = "a0e99841-438c-4a64-b679-ae501e7d6091"  # Barbershop Man (en)


def cartesia_api_key() -> str | None:
    return os.environ.get("CARTESIA_API_KEY", "").strip() or None


def cartesia_voice_for_locale(locale: str, override: str | None = None) -> str:
    if override and override.strip():
        return override.strip()
    env = os.environ.get("CARTESIA_VOICE_ID", "").strip()
    if env:
        return env
    return DEFAULT_CARTESIA_VOICE


async def synthesize_cartesia_mp3(
    text: str,
    *,
    locale: str = "en",
    voice: str | None = None,
    timeout: float = 45.0,
) -> bytes:
    key = cartesia_api_key()
    if not key:
        raise RuntimeError("CARTESIA_API_KEY not configured")

    model = os.environ.get("CARTESIA_TTS_MODEL", "sonic-3").strip() or "sonic-3"
    voice_id = cartesia_voice_for_locale(locale, voice)
    lang = locale.split("-")[0] if locale else "en"

    payload = {
        "model_id": model,
        "transcript": text,
        "voice": {"mode": "id", "id": voice_id},
        "language": lang,
        "output_format": {
            "container": "mp3",
            "encoding": "mp3",
            "sample_rate": 44100,
        },
    }
    headers = {
        "X-API-Key": key,
        "Cartesia-Version": os.environ.get("CARTESIA_API_VERSION", "2025-04-16"),
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        res = await client.post(CARTESIA_BYTES_URL, headers=headers, json=payload)
        if res.status_code >= 400:
            raise RuntimeError(f"Cartesia TTS failed ({res.status_code}): {res.text[:400]}")
        return res.content
