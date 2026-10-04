# SudarSim Voice Service

Real-time voice orchestration for SudarSim roleplay: **LiveKit + Pipecat** (streaming STT/TTS) with WebSocket dev fallback.

## Quick start (local)

### 1. LiveKit (Docker)

```bash
cd sudar-sim
docker compose -f docker-compose.livekit.yml up -d
```

Default keys match `.env.example` (`devkey` / `secret`, `ws://localhost:7880`).

### 2. Voice service

```bash
pip install -r requirements.txt
cp .env.example .env
# Set DEEPGRAM_API_KEY, CARTESIA_API_KEY, INTELLIGENCE_SERVICE_SECRET
uvicorn main:app --port 8090 --reload
```

On `POST /rooms`, sudar-sim mints a LiveKit token and **dispatches a Pipecat agent** that:
- Plays the scenario opening line (Cartesia TTS)
- Streams Deepgram STT → Intelligence persona → Cartesia TTS
- Syncs turns to Learn via `?action=sync_turn`

### 3. Learn

Set in `sudar-learn/.env.local`:

```env
SUDAR_SIM_URL=http://localhost:8090
SUDAR_SIM_SERVICE_SECRET=dev-sim-secret-change-me
```

Learners on the **phone** channel join the LiveKit room via `SimVoiceShell` (falls back to PTT if LiveKit is unavailable).

See [docs/SUDAR_SIM_DEPLOY.md](../docs/SUDAR_SIM_DEPLOY.md) and [docs/SUDAR_SIM_API.md](../docs/SUDAR_SIM_API.md).

## Voice MVP scenario seed

```bash
cd sudar-studio
ORG_ID=<org-uuid> CREATED_BY=<profile-uuid> node ../scripts/seed-sudarsim-voice-scenarios.mjs
```

Then open Learn: `/sim/session/new?scenario_id=<id>`.

Full steps: [docs/SUDAR_SIM_VOICE_SEED.md](../docs/SUDAR_SIM_VOICE_SEED.md).
