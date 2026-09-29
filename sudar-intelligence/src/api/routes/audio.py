"""
Sudar Intelligence — Audio (TTS) Routes
Uses Edge-TTS (default) or optional Sarvam AI for speech from module text (Listen modality).
Supports configurable voice, rate, and chunking for long text.
Requires Supabase JWT or X-Intelligence-Service-Secret.
"""
import base64
import io
import os
import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from src.api.auth import verify_supabase_jwt_or_service
from src.core.edge_tts_helper import (
    DEFAULT_RATE,
    apply_brand_pronunciation,
    expression_rate_multiplier,
    split_into_chunks,
    synthesize_edge_mp3,
)

router = APIRouter()

# Best Edge-TTS voices (no API key): Aria (narrative), Jenny (host), Guy (expert)
DEFAULT_VOICE = "en-US-AriaNeural"
# Sarvam API: voice prefix and max chars per request (Bulbul v3).
SARVAM_VOICE_PREFIX = "sarvam_"
SARVAM_MAX_CHARS = 2500


class AudioGenerateRequest(BaseModel):
    text: str
    voice: str | None = None
    rate: float | None = None  # 0.5–2.0; 1.0 = normal
    expression: str | None = None  # calm | energetic | empathetic | serious
    # BCP-47 for Sarvam target_language_code (e.g. hi-IN, en-IN). Ignored for Edge-TTS.
    target_language_code: str | None = None


def _generate_sarvam_sync(text: str, speaker: str, target_language_code: str) -> bytes:
    """Call Sarvam TTS API (sync). Returns MP3 bytes. Requires SARVAM_API_KEY."""
    import httpx
    key = os.environ.get("SARVAM_API_KEY", "").strip()
    if not key:
        raise HTTPException(status_code=501, detail="Sarvam TTS not configured (SARVAM_API_KEY)")
    # Chunk for Sarvam limit
    chunks = split_into_chunks(text, max_chars=SARVAM_MAX_CHARS)
    if not chunks:
        raise HTTPException(status_code=400, detail="text is required")
    audios: list[bytes] = []
    with httpx.Client(timeout=60.0) as client:
        for chunk in chunks:
            r = client.post(
                "https://api.sarvam.ai/text-to-speech",
                headers={
                    "api-subscription-key": key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": chunk,
                    "target_language_code": target_language_code or "en-IN",
                    "speaker": speaker.lower(),
                    "model": "bulbul:v3",
                },
            )
            if r.status_code != 200:
                raise HTTPException(status_code=502, detail=r.text or "Sarvam TTS request failed")
            data = r.json()
            b64_list = data.get("audios") or []
            if not b64_list:
                raise HTTPException(status_code=502, detail="Sarvam returned no audio")
            audios.append(base64.b64decode(b64_list[0]))
    from pydub import AudioSegment
    combined = AudioSegment.empty()
    for raw in audios:
        combined += AudioSegment.from_file(io.BytesIO(raw), format="wav")
    out = io.BytesIO()
    combined.export(out, format="mp3")
    return out.getvalue()


@router.post("/generate")
async def generate_audio(
    request: AudioGenerateRequest,
    _auth: Annotated[str | None, Depends(verify_supabase_jwt_or_service)] = None,
):
    """
    Generate speech audio from text using Edge-TTS (default) or Sarvam AI when voice is sarvam_* and SARVAM_API_KEY is set.
    Returns audio/mpeg bytes for use in the Learn Listen modality.
    """
    text = (request.text or "").strip().replace("\r", "")
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > 15000:
        text = text[:15000] + "…"
    text = apply_brand_pronunciation(text)

    voice = (request.voice or DEFAULT_VOICE).strip() or DEFAULT_VOICE

    # Optional: Sarvam AI (Indian languages, high quality). Voice id e.g. sarvam_shreya, sarvam_shubh.
    if voice.lower().startswith(SARVAM_VOICE_PREFIX) and os.environ.get("SARVAM_API_KEY"):
        speaker = voice[len(SARVAM_VOICE_PREFIX):].strip() or "shubh"
        lang = (request.target_language_code or "en-IN").strip() or "en-IN"
        loop = asyncio.get_event_loop()
        try:
            audio_bytes = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: _generate_sarvam_sync(text, speaker, lang)),
                timeout=180.0,
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="TTS generation timed out")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=module.mp3"},
        )

    base_rate = request.rate if request.rate is not None else DEFAULT_RATE
    rate_val = max(0.5, min(2.0, base_rate * expression_rate_multiplier(request.expression)))

    try:
        audio_bytes = await synthesize_edge_mp3(text, voice=voice, rate=rate_val, timeout=180.0)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="TTS generation timed out")
    except ImportError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=module.mp3"},
    )
