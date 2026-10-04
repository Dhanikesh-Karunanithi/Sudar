# SudarSim API

Real-time roleplay simulations with multi-channel workspace (phone, chat, email), screenshot CRM overlays, and AI coach feedback.

See also: [SUDAR_SIM_PLAN.md](SUDAR_SIM_PLAN.md), [SUDAR_SIM_DEPLOY.md](SUDAR_SIM_DEPLOY.md).

---

## Learn BFF

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sim/session` | Start session `{ scenario_id, module_id?, course_id? }` — mints LiveKit room + dispatches agent |
| GET | `/api/sim/session/[id]` | Session state, transcript, coach result, fresh `voice` token when `livekit_room` set |
| POST | `/api/sim/session/[id]/voice` | Refresh LiveKit learner token for reload |
| GET | `/api/sim/session/[id]/agent` | **Agent only** (`X-Sudar-Sim-Secret`) — session + scenario context |
| POST | `/api/sim/session/[id]?action=turn` | Channel turn (text or PTT audio) — chat/email + PTT fallback |
| POST | `/api/sim/session/[id]?action=sync_turn` | **Agent only** — append learner/customer text + persona state |
| POST | `/api/sim/session/[id]?action=voice_event` | **Agent only** — telemetry (`agent_ready`, etc.) |
| POST | `/api/sim/session/[id]?action=crm` | Log CRM overlay action |
| POST | `/api/sim/session/[id]?action=complete` | End session + coach evaluate `{ reflection? }` |

## Intelligence

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sim/persona/turn` | Customer reply + mood state + optional TTS `audio_base64` |
| POST | `/api/sim/voice-turn` | Combined STT + persona + TTS (Studio preview) |
| POST | `/api/sim/stt` | Deepgram or Whisper STT |
| POST | `/api/sim/coach/evaluate` | Rubric + narrative; optional `learner_reflection` |
| POST | `/api/sim/scenario/generate` | SOP/doc → scenario JSON |
| POST | `/api/sim/scenario/from-transcript` | Call transcript → scenario |

## ALP embed

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/alp/sim/embed-token` | `{ user_id, mode: author\|play, scenario_id? }` |

Moodle launcher: `local_sudaralp/sim.php?mode=play&scenario_id=…`

## Voice service (`sudar-sim`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/rooms` | LiveKit room + learner token + **dispatch Pipecat agent** |
| POST | `/rooms/join` | Fresh learner token for existing `room_name` |
| GET | `/health` | `livekit_configured`, `deepgram_configured`, `cartesia_configured` |
| WS | `/ws/session/{id}` | Dev-mode text turn loop |
| POST | `/voice/turn` | HTTP persona turn proxy |

Local LiveKit: `docker compose -f sudar-sim/docker-compose.livekit.yml up -d`

## Env

- Learn: `SUDAR_SIM_URL`, `SUDAR_SIM_SERVICE_SECRET`, `SUDAR_INTELLIGENCE_URL`, `INTELLIGENCE_SERVICE_SECRET`
- sudar-sim: `SUDAR_INTELLIGENCE_URL`, `SUDAR_LEARN_URL`, `SUDAR_SIM_SERVICE_SECRET`, `LIVEKIT_*`, `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY`

## Locales

`en`, `fr`, `es`, `pt`, `ta` — set on `sim_scenarios.locale`.

## Voice seed scenarios

[SUDAR_SIM_VOICE_SEED.md](SUDAR_SIM_VOICE_SEED.md) — `/sim/session/new?scenario_id=…`
