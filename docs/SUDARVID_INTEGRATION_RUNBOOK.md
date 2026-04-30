# SudarVid Integration Runbook

Contract-level SudarVid behavior for **Sudar Learn** (proxied) and the **standalone creator** (same FastAPI app).

## 1) Configuration

**Learn (`sudar-learn`)** — env vars:

- `SUDARVID_URL` (default local: `http://localhost:8000`)
- `SUDARVID_ENGINE_MODE` (`classic` default, optional `premium`)
- `SUDARVID_HTTP_FALLBACK_ENABLED` (`false` default; set `true` to retry premium-start failures in classic mode)

**Standalone creator** — served from the same SudarVid origin (e.g. `http://localhost:8000/`). No Learn env vars:

- **Generation engine**: Advanced → **Generation engine** (`classic` | `premium`). Persists in `localStorage` key `sudarvid_standalone_engine_mode`.
- **Fallback**: checkbox **Retry with Classic if Premium start fails** maps to Learn’s `SUDARVID_HTTP_FALLBACK_ENABLED` behavior for `POST /generate` only. Persists in `sudarvid_standalone_engine_fallback` (`1` / absent).
- **MP4**: checkbox **Encode MP4 file** (default on). Sudar Learn watch flow typically uses `output_mp4: false` for faster deck-only delivery; standalone defaults to encoding MP4 for creators.

## 2) Contract behavior

- **Learn** starts jobs via `POST /api/ai/generate-video` (proxies to SudarVid `POST /generate`).
- **Standalone** calls `POST /generate` from the browser on the same origin (see [`sudar_vid/frontend/assets/main.js`](sudar_vid/frontend/assets/main.js)).
- Status comes from `GET /api/ai/generate-video/status/:jobId` (proxy to `/status/:jobId`).
- Manifest comes from `GET /api/ai/generate-video/manifest/:jobId` (proxy to `/api/jobs/:jobId/slides`).
- Learn persists:
  - `video_generate_start` with `requested_engine_mode`, effective `engine_mode`, `meta`, and fallback usage.
  - `video_generate_complete` on terminal state with `engine_mode`, `meta`, output files, and normalized interaction summary.

Both surfaces send `engine_mode` on `POST /generate` where applicable; the server returns `meta.engine_mode` on the generate response and on `GET /status/{job_id}`. The standalone UI shows an **Engine** badge on the progress line after a successful start using that `meta`.

## 3) Premium schema compatibility

**Learn** normalizes manifest rows when using `GET /api/ai/generate-video/manifest/:jobId`. **Standalone** can call SudarVid directly: `GET /api/jobs/{job_id}/slides`.

- `interaction_type` in `slides_manifest.json` is normalized to:
  - `none`, `reflect`, `decision`, `checkpoint`
- Unknown/legacy values degrade to `none` (never crash rendering/analytics paths).

## 4) Smoke test (classic + premium)

**API** (covers server contract for both surfaces). From repo root, run:

```powershell
$ErrorActionPreference='Stop'
function Run-Smoke([string]$Mode){
  $body=@{
    topic="SudarVid $Mode smoke"
    audience="learner"
    language="en"
    theme="seminar_minimal"
    slide_count=3
    animation_level="medium"
    include_tts=$false
    include_music=$false
    output_html=$true
    output_mp4=$false
    engine_mode=$Mode
  } | ConvertTo-Json -Depth 10

  $r=Invoke-RestMethod -Method Post -Uri "http://localhost:8000/generate" -ContentType "application/json" -Body $body
  $job=$r.job_id
  do {
    Start-Sleep -Seconds 2
    $s=Invoke-RestMethod -Method Get -Uri "http://localhost:8000/status/$job"
  } while ($s.status -ne "done" -and $s.status -ne "error")

  [pscustomobject]@{
    mode = $Mode
    job_id = $job
    status = $s.status
    meta_engine_mode = $s.meta.engine_mode
    output_files = ($s.output_files -join ",")
  }
}

Run-Smoke 'classic'
Run-Smoke 'premium'
```

Pass criteria:

- Both jobs reach `done` (or expected `error` with valid `meta` contract).
- `status.meta.engine_mode` matches requested mode (or documented fallback).
- Output includes `slides.html` and `slides_manifest.json`.

**Standalone UI**: open `http://localhost:8000/`, expand **Advanced**, set **Generation engine** to Premium then Classic and generate once each; confirm the progress line shows the **Engine** badge matching `meta.engine_mode` after job start.

