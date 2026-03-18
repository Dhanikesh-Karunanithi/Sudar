"""
ByteOS Intelligence — Audio (TTS) Routes
Uses Edge-TTS (default) or optional Sarvam AI for speech from module text (Listen modality).
Supports configurable voice, rate, and chunking for long text.
Requires Supabase JWT or X-Intelligence-Service-Secret.
"""
import base64
import io
import os
import re
import tempfile
import asyncio
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from src.api.auth import verify_supabase_jwt_or_service

router = APIRouter()

# Best Edge-TTS voices (no API key): Aria (narrative), Jenny (host), Guy (expert)
DEFAULT_VOICE = "en-US-AriaNeural"
# Rate: 1.0 = normal; 0.9 = slower; 1.1 = faster. Mapped to edge-tts "+X%" format.
DEFAULT_RATE = 1.0
# Max characters per chunk when chunking (avoids timeouts, improves prosody).
CHUNK_MAX_CHARS = 2000
# Sarvam API: voice prefix and max chars per request (Bulbul v3).
SARVAM_VOICE_PREFIX = "sarvam_"
SARVAM_MAX_CHARS = 2500


class AudioGenerateRequest(BaseModel):
    text: str
    voice: str | None = None
    rate: float | None = None  # 0.5–2.0; 1.0 = normal


def _generate_sarvam_sync(text: str, speaker: str) -> bytes:
    """Call Sarvam TTS API (sync). Returns MP3 bytes. Requires SARVAM_API_KEY."""
    import httpx
    key = os.environ.get("SARVAM_API_KEY", "").strip()
    if not key:
        raise HTTPException(status_code=501, detail="Sarvam TTS not configured (SARVAM_API_KEY)")
    # Chunk for Sarvam limit
    chunks = _split_into_chunks(text, max_chars=SARVAM_MAX_CHARS)
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
                    "target_language_code": "en-IN",
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


def _rate_to_edge(rate: float) -> str:
    """Convert numeric rate to edge-tts rate string, e.g. 0.9 -> '-10%', 1.1 -> '+10%'."""
    if rate <= 0 or rate > 2.0:
        return "0%"
    pct = round((rate - 1.0) * 100)
    if pct == 0:
        return "0%"
    return f"{'+' if pct > 0 else ''}{pct}%"


def _split_into_chunks(text: str, max_chars: int = CHUNK_MAX_CHARS) -> list[str]:
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

    voice = (request.voice or DEFAULT_VOICE).strip() or DEFAULT_VOICE

    # Optional: Sarvam AI (Indian languages, high quality). Voice id e.g. sarvam_shreya, sarvam_shubh.
    if voice.lower().startswith(SARVAM_VOICE_PREFIX) and os.environ.get("SARVAM_API_KEY"):
        speaker = voice[len(SARVAM_VOICE_PREFIX):].strip() or "shubh"
        loop = asyncio.get_event_loop()
        try:
            audio_bytes = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: _generate_sarvam_sync(text, speaker)),
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

    rate_val = request.rate if request.rate is not None else DEFAULT_RATE
    rate_str = _rate_to_edge(rate_val)

    try:
        import edge_tts
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="edge-tts not installed. Run: pip install edge-tts",
        )

    chunks = _split_into_chunks(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="text is required")

    async def _generate_one(chunk: str, out_path: str) -> None:
        comm = edge_tts.Communicate(chunk, voice, rate=rate_str)
        await comm.save(out_path)

    async def _generate_all() -> bytes:
        if len(chunks) == 1:
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                path = f.name
            try:
                await _generate_one(chunks[0], path)
                return Path(path).read_bytes()
            finally:
                Path(path).unlink(missing_ok=True)

        temp_paths: list[str] = []
        try:
            for i, chunk in enumerate(chunks):
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                    path = f.name
                temp_paths.append(path)
                await _generate_one(chunk, path)

            from pydub import AudioSegment
            combined = AudioSegment.empty()
            for p in temp_paths:
                combined += AudioSegment.from_file(p, format="mp3")
            buf = combined.export(format="mp3")
            return buf.read()
        finally:
            for p in temp_paths:
                Path(p).unlink(missing_ok=True)

    try:
        audio_bytes = await asyncio.wait_for(_generate_all(), timeout=180.0)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="TTS generation timed out")
    except Exception as e:
        import traceback
        print(f"[audio] Edge-TTS error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=str(e))

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=module.mp3"},
    )
