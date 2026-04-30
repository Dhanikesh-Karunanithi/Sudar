# Evaluation appendix — what Sudar claims today vs later

This file supports honest framing in the paper (`paper.tex`) and in procurement conversations.

## Currently supported claims (systems / architecture)

- Open-source **reference implementation** (Apache-2.0) with Studio, Learn, shared Supabase, Intelligence, and optional SudarVid.
- **Telemetry** (`learning_events`) and tutor logging (`ai_interactions`) with longitudinal memory patterns in Learn.
- **ALP reference HTTP API** on Learn (`/api/alp/*`) for event ingestion, embed tokens, tutor proxy, next-action proxy — not the same as shipped Moodle/Canvas installable plugins.
- **Trust documentation** and selective app-layer hardening (cron, SCORM proxy, SSRF-safe URL fetch, signing secrets); RLS and full service-role classification remain verification tasks (see [../trust/RLS_STORAGE_AUDIT_CHECKLIST.md](../trust/RLS_STORAGE_AUDIT_CHECKLIST.md)).

## Explicitly not claimed without a pilot

- Statistically significant **learning gains** vs control LMS.
- **Fairness** or **bias** reduction across demographics (requires measurement).
- **Optimal** adaptive policy (current logic is heuristic + LLM-assisted).

## Planned measures (see PILOT_PROTOCOL.md)

- Adoption: active learners, sessions/week, modality mix.
- Engagement: completion, time-on-task, return rate, tutor use.
- Satisfaction: NPS or CSAT, optional qualitative interviews.
- Early outcome proxies: quiz improvement session-over-session, time-to-first-completion (design with institutional partner).

## Benchmark harness (automatable)

Run the stub script from repo root (extend with real HTTP calls when ready):

```bash
node scripts/benchmark-sudar.mjs
```

The script documents which env vars and endpoints to time for tutor, generation, and TTS.
