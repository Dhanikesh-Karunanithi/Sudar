# ByteOS Video

Minimal service that generates **narrated slide videos** (TTS + static slide → MP4) for the Sudar **Watch** modality.

## What it does

- **POST /api/generate** — Body: `{ "text": "…", "title": "Module title", "voice": "en-GB-SoniaNeural" }`. Generates speech with Edge-TTS, creates a slide image with the title, combines with FFmpeg into an MP4, returns the video bytes.

## Requirements

- **Python 3.11+**
- **FFmpeg** installed and in `PATH` (for combining audio + image into video)
- **ffprobe** (usually shipped with FFmpeg) for reading audio duration

## Setup

```bash
cd byteos-video
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --port 8002
```

Health check: [http://localhost:8002/api/health](http://localhost:8002/api/health) — returns `{ "status": "ok", "ffmpeg": true }` when FFmpeg is available.

## Integration

- **Learn** can call this service (e.g. via `BYTEOS_VIDEO_URL`) to generate video for the Watch modality tab. The plan is to wire the Watch tab in the course viewer to request video from this service and display the result.

---

*Sudar — Learns with you, for you.*
