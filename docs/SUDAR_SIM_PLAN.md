# SudarSim — Architecture & ADR

**Status:** Phase 0+ implementation  
**Product:** Real-time multi-channel roleplay (phone, chat, email) with screenshot CRM overlays, AI coach, and Sudar Twin integration.

---

## 1. Decision summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Voice service location | **`sudar-sim/`** (separate Python service) | Keeps batch TTS in Intelligence separate from streaming voice |
| Transport v1 | **LiveKit WebRTC** + Pipecat orchestration | Barge-in, corporate firewall via TURN |
| Transport dev fallback | **FastAPI WebSocket** turn loop | Local dev without LiveKit |
| LLM | **Together AI** via Intelligence `chat_completion` | Already Sudar primary; persona + coach |
| STT | **Deepgram Nova** (env) or faster-whisper on OCI | Streaming; Tamil via Whisper multilingual |
| TTS | **Cartesia / ElevenLabs** streaming; Tamil: Edge/Sarvam batch fallback in dev | Emotive customer voice |
| CRM v1 | Screenshot + overlay JSON | Ship fast; vision→HTML is v2 |
| Surfaces | Learn modality + `/sim` + ALP embed | Shared `sim_sessions` backend |

---

## 2. Latency budget (target <800ms perceived)

| Stage | Target | Notes |
|-------|--------|-------|
| VAD + STT partial | 150–250ms | Streaming partials |
| LLM first token | 200–400ms | Short persona prompts; structured JSON |
| TTS first audio | 100–200ms | Streaming TTS |
| Network (WebRTC) | 50–100ms | LiveKit SFU |
| **Total** | **500–950ms** | Optimize LLM + TTS provider combo |

---

## 3. Data model

See migration `supabase/migrations/20260616000000_sudarsim.sql` and `shared/sudarsim/schemas.ts`.

---

## 4. API contracts

### Intelligence (`/api/sim/*`)

- `POST /api/sim/scenario/generate` — SOP/doc → scenario draft
- `POST /api/sim/scenario/from-transcript` — call transcript → persona + rubric
- `POST /api/sim/persona/turn` — customer reply + mood state delta
- `POST /api/sim/coach/evaluate` — post-session rubric + narrative

### Learn (`/api/sim/*`)

- `POST /api/sim/session` — create session, return tokens + scenario snapshot
- `GET /api/sim/session/[id]` — session state + transcript
- `POST /api/sim/session/[id]/complete` — end session, run coach, optional module_complete
- `POST /api/sim/session/[id]/turn` — chat/email channel turn
- `POST /api/sim/session/[id]/crm-action` — log overlay interaction

### sudar-sim service

- `POST /rooms` — create LiveKit room + token
- `WS /ws/session/{session_id}` — dev fallback voice turn loop

---

## 5. Persona state machine

Single persona per scenario. State: `mood` (0–1), `difficulty` (0–1), `trust` (0–1).

Each turn LLM returns structured JSON:

```json
{
  "reply": "…",
  "mood_delta": -0.1,
  "difficulty_delta": 0.05,
  "trust_delta": 0.2,
  "channel": "phone"
}
```

Rules in `persona_state_rules` jsonb can clamp deltas and trigger escalations.

---

## 6. CRM overlay model (v1)

```json
{
  "imageUrl": "https://…",
  "width": 1920,
  "height": 1080,
  "overlays": [
    {
      "id": "dispo",
      "type": "dropdown",
      "x": 0.72, "y": 0.85, "w": 0.15, "h": 0.04,
      "label": "Disposition",
      "config": { "options": ["Resolved", "Escalated"] },
      "requiredForScore": true
    }
  ]
}
```

Coordinates normalized 0–1 relative to image dimensions.

---

## 7. CRM v2 (future)

Vision model (Together vision / Qwen-VL) → HTML/CSS replica. Not in v1 scope.

---

## 8. Compliance

Per-scenario `compliance` jsonb:

- `record_audio`: boolean
- `record_transcript`: boolean (default true)
- `retention_days`: number | null

Storage path: `sim-recordings/{org_id}/{session_id}/`

---

## 9. Locales v1

EN, FR, ES, PT, Tamil — scenario `locale` drives STT/TTS routing table in `sudar-sim/config/locales.py`.

---

## 10. Related docs

- [SUDAR_SIM_DEPLOY.md](SUDAR_SIM_DEPLOY.md) — Oracle + LiveKit deploy
- [SUDAR_SIM_API.md](SUDAR_SIM_API.md) — HTTP + ALP contracts
