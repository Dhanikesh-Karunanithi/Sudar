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

From repo root:

```bash
npm run benchmark:sudar
# or: node scripts/benchmark-sudar.mjs
```

Writes `docs/research/benchmark-results.json` (health RTT, optional tutor E2E with
`INTELLIGENCE_SERVICE_SECRET`, in-process next-action ranking for catalog size N).
Start Intelligence locally or set `SUDAR_INTELLIGENCE_URL` before expecting health/tutor rows.
Paper Table~\ref{tab:perf} in `paper.tex` should match the latest artefact.
