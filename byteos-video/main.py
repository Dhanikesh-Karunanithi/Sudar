"""
ByteOS Video — Narrated slide generation (TTS + static slide → MP4)
Uses Edge-TTS for speech and FFmpeg to produce a short video for the Watch modality.
"""
import asyncio
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

app = FastAPI(
    title="ByteOS Video",
    description="TTS + slide to MP4 for the Watch modality.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_VOICE = "en-GB-SoniaNeural"


class GenerateRequest(BaseModel):
    text: str
    title: str | None = None
    voice: str | None = None


def _check_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


async def _generate_audio(text: str, voice: str, out_path: Path) -> None:
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out_path))


def _create_slide_image(title: str, width: int = 1280, height: int = 720) -> Path:
    import os
    from PIL import Image, ImageDraw, ImageFont
    path = Path(tempfile.mkstemp(suffix=".png")[1])
    img = Image.new("RGB", (width, height), color=(30, 41, 59))  # slate-800
    draw = ImageDraw.Draw(img)
    font = None
    for font_path in [
        os.path.join(os.environ.get("WINDIR", ""), "Fonts", "arial.ttf"),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]:
        if font_path and Path(font_path).exists():
            try:
                font = ImageFont.truetype(font_path, 48)
                break
            except OSError:
                pass
    if font is None:
        font = ImageFont.load_default()
    text_short = (title or "Module")[:80]
    try:
        bbox = draw.textbbox((0, 0), text_short, font=font)
    except AttributeError:
        bbox = (0, 0, len(text_short) * 20, 50)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (width - tw) // 2
    y = (height - th) // 2
    draw.text((x, y), text_short, fill=(248, 250, 252), font=font)
    img.save(path)
    return path


def _get_audio_duration_sec(audio_path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ],
        capture_output=True,
        text=True,
        timeout=10,
    )
    if result.returncode != 0 or not result.stdout.strip():
        return 10.0
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 10.0


@app.get("/api/health")
def health():
    return {"status": "ok", "ffmpeg": _check_ffmpeg()}


@app.post("/api/generate")
async def generate_video(request: GenerateRequest):
    """
    Generate a narrated slide video: TTS from text + static slide image → MP4.
    Returns video/mp4 bytes. Requires FFmpeg in PATH.
    """
    if not _check_ffmpeg():
        raise HTTPException(status_code=503, detail="FFmpeg not found. Install FFmpeg and ensure it is in PATH.")

    text = (request.text or "").strip().replace("\r", "")[:10000]
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    voice = (request.voice or DEFAULT_VOICE).strip() or DEFAULT_VOICE
    title = (request.title or "Module").strip() or "Module"

    try:
        import edge_tts
    except ImportError:
        raise HTTPException(status_code=501, detail="edge-tts not installed. pip install edge-tts")

    tmpdir = Path(tempfile.mkdtemp())
    try:
        audio_path = tmpdir / "audio.mp3"
        await _generate_audio(text, voice, audio_path)
        duration = _get_audio_duration_sec(audio_path)
        slide_path = _create_slide_image(title)
        try:
            out_path = tmpdir / "out.mp4"
            subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-loop", "1", "-i", str(slide_path),
                    "-i", str(audio_path),
                    "-c:v", "libx264", "-tune", "stillimage",
                    "-c:a", "aac", "-shortest",
                    "-pix_fmt", "yuv420p",
                    "-t", str(duration + 0.5),
                    str(out_path),
                ],
                check=True,
                capture_output=True,
                timeout=300,
            )
            video_bytes = out_path.read_bytes()
        finally:
            slide_path.unlink(missing_ok=True)

        return Response(
            content=video_bytes,
            media_type="video/mp4",
            headers={"Content-Disposition": "inline; filename=module.mp4"},
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=502, detail=f"FFmpeg failed: {e.stderr.decode() if e.stderr else str(e)}")
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="TTS generation timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
