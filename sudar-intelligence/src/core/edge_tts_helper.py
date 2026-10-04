"""
Shared Edge-TTS helpers for Listen modality and SudarSim persona turns.
No API key required. Returns MP3 bytes.
"""
from __future__ import annotations

import asyncio
import re
import tempfile
from pathlib import Path

BRAND_NAME = "Sudar"
BRAND_CANONICAL_SPOKEN_FORM = "Su-dar"
DEFAULT_VOICE = "en-US-JennyNeural"
DEFAULT_RATE = 1.0
CHUNK_MAX_CHARS = 2000

# Locale prefix → natural Edge neural voice (sim + Listen fallbacks).
LOCALE_VOICE_MAP: dict[str, str] = {
    "en": "en-US-JennyNeural",
    "en-us": "en-US-JennyNeural",
    "en-gb": "en-GB-SoniaNeural",
    "fr": "fr-FR-DeniseNeural",
    "fr-fr": "fr-FR-DeniseNeural",
    "es": "es-ES-ElviraNeural",
    "es-es": "es-ES-ElviraNeural",
    "es-mx": "es-MX-DaliaNeural",
    "pt": "pt-BR-FranciscaNeural",
    "pt-br": "pt-BR-FranciscaNeural",
    "pt-pt": "pt-PT-RaquelNeural",
    "ta": "ta-IN-PallaviNeural",
    "ta-in": "ta-IN-PallaviNeural",
    "hi": "hi-IN-SwaraNeural",
    "hi-in": "hi-IN-SwaraNeural",
}


def rate_to_edge(rate: float) -> str:
    """Convert numeric rate to edge-tts rate string, e.g. 0.9 -> '-10%', 1.1 -> '+10%'."""
    if rate <= 0 or rate > 2.0:
        return "+0%"
    pct = round((rate - 1.0) * 100)
    if pct == 0:
        return "+0%"
    return f"{'+' if pct > 0 else ''}{pct}%"


def split_into_chunks(text: str, max_chars: int = CHUNK_MAX_CHARS) -> list[str]:
    """Split text into chunks by sentence boundaries, each under max_chars."""
    if len(text) <= max_chars:
        return [text] if text.strip() else []
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if current_len + len(s) + 1 <= max_chars:
            current.append(s)
            current_len += len(s) + 1
        else:
            if current:
                chunks.append(" ".join(current))
            current = [s]
            current_len = len(s)
    if current:
        chunks.append(" ".join(current))
    return chunks


def apply_brand_pronunciation(text: str) -> str:
    return re.sub(rf"\b{BRAND_NAME}\b", BRAND_CANONICAL_SPOKEN_FORM, text)


def expression_rate_multiplier(expression: str | None) -> float:
    value = (expression or "").strip().lower()
    return {
        "calm": 0.92,
        "empathetic": 0.95,
        "serious": 0.9,
        "energetic": 1.08,
    }.get(value, 1.0)


def voice_for_locale(locale: str | None, override: str | None = None) -> str:
    """Map BCP-47 / short locale to an Edge neural voice. Default: en-US-JennyNeural."""
    if override and override.strip():
        return override.strip()
    key = (locale or "en").strip().lower().replace("_", "-")
    if key in LOCALE_VOICE_MAP:
        return LOCALE_VOICE_MAP[key]
    prefix = key.split("-", 1)[0]
    return LOCALE_VOICE_MAP.get(prefix, DEFAULT_VOICE)


async def synthesize_edge_mp3(
    text: str,
    *,
    voice: str | None = None,
    rate: float = DEFAULT_RATE,
    timeout: float = 60.0,
) -> bytes:
    """
    Synthesize speech with Edge-TTS. Returns MP3 bytes.
    Raises ImportError if edge-tts missing; RuntimeError / asyncio.TimeoutError on failure.
    """
    cleaned = apply_brand_pronunciation((text or "").strip().replace("\r", ""))
    if not cleaned:
        raise ValueError("text is required")
    if len(cleaned) > 15000:
        cleaned = cleaned[:15000] + "…"

    try:
        import edge_tts
    except ImportError as exc:
        raise ImportError("edge-tts not installed. Run: pip install edge-tts") from exc

    voice_id = (voice or DEFAULT_VOICE).strip() or DEFAULT_VOICE
    rate_val = max(0.5, min(2.0, rate))
    rate_str = rate_to_edge(rate_val)
    chunks = split_into_chunks(cleaned)
    if not chunks:
        raise ValueError("text is required")

    async def _generate_all() -> bytes:
        parts: list[bytes] = []
        for chunk in chunks:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                path = f.name
            try:
                comm = edge_tts.Communicate(chunk, voice_id, rate=rate_str)
                await comm.save(path)
                parts.append(Path(path).read_bytes())
            finally:
                Path(path).unlink(missing_ok=True)
        if len(parts) == 1:
            return parts[0]
        return b"".join(parts)

    return await asyncio.wait_for(_generate_all(), timeout=timeout)
