# SudarSim API

Real-time roleplay simulations with multi-channel workspace (phone, chat, email), screenshot CRM overlays, and AI coach feedback.

See also: [SUDAR_SIM_PLAN.md](SUDAR_SIM_PLAN.md), [SUDAR_SIM_DEPLOY.md](SUDAR_SIM_DEPLOY.md).

---

## Learn BFF

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sim/session` | Start session `{ scenario_id, module_id?, course_id? }` |
| GET | `/api/sim/session/[id]` | Session state, transcript, coach result |
| POST | `/api/sim/session/[id]?action=turn` | Chat/email turn `{ channel, text }` |
| POST | `/api/sim/session/[id]?action=crm` | Log CRM overlay action |
| POST | `/api/sim/session/[id]?action=complete` | End session + coach evaluate |

## Intelligence

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sim/persona/turn` | Customer reply + mood state |
| POST | `/api/sim/coach/evaluate` | Rubric + narrative coach report |
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
| POST | `/rooms` | LiveKit room + dev WebSocket URL |
| WS | `/ws/session/{id}` | Dev-mode voice turn loop |
| POST | `/voice/turn` | HTTP persona turn proxy |

## Env

- Learn: `SUDAR_SIM_URL`, `NEXT_PUBLIC_SUDAR_SIM_WS_URL`, `ALP_EMBED_SIGNING_SECRET`
- sudar-sim: `SUDAR_INTELLIGENCE_URL`, `LIVEKIT_*`, `DEEPGRAM_API_KEY`, `SIM_DEV_MODE`

## Locales

`en`, `fr`, `es`, `pt`, `ta` — set on `sim_scenarios.locale`.
