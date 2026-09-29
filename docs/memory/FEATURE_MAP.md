# Sudar feature map

Where each feature lives end to end. Update the row when you add routes, tables, flags, or tests.

## Studio (creator)

| Feature | UI | API | Core lib | Tables | Env / flags | Tests |
|---|---|---|---|---|---|---|
| Course generation | `app/(dashboard)/courses/new`, course editor | `api/ai/generate-course`, `generate-all-modules`, `generate-from-document`, `generate-module`, `generate-module-with-research` | `lib/courseGeneration/*` (pipeline, prompts, qualityValidator, qualityGate, componentValidation) | `courses`, `modules`, `generation_telemetry` | `OPENROUTER_API_KEY`, `TOGETHER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | `lib/courseGeneration/*.test.ts`, `scripts/evals` |
| Quiz generation | module editor | `api/ai/generate-quiz` | `shared/content-generation/prompts.ts`, `schemas.ts`, `quizQuality.ts` | `modules.quiz` | same | `shared` tests via Studio vitest |
| Quality review | `courses/[id]/quality` | `api/courses/[id]/quality` | `qualityValidator.ts` | `generation_telemetry`, `modules.review_status`, `modules.quality_issues` | — | — |
| Publish | course editor | `api/courses/[id]/publish` | — | `courses.status` | — | — |
| Export (HTML / SCORM 1.2) | export dialog | `api/courses/[id]/export` | `lib/export/*` | read-only | — | — |
| SudarSim authoring | `sudarsim` pages, `SimScenarioEditor`, `StudioSimPreview` | `api/sudarsim/scenarios*`, `preview-turn`, `preview-tts`, `sim/generate-scenario` | `lib/sudarsim/*`, `shared/sudarsim/schemas.ts` | `sim_scenarios` | `SUDAR_INTELLIGENCE_URL` | `shared/sudarsim/schemas.test.ts` |
| Sim analytics | analytics | `api/analytics/sim-sessions` | — | `sim_sessions`, `sim_turns` | — | — |
| Teaching OS Domains | `(dashboard)/domains` | `api/domains*`, `api/analytics/claim-struggle` | `lib/teaching/seedDomainFromCourse.ts` | `learning_domains`, `learning_claims` | — | — |
| MCP OAuth handoff | `/login?mcp_oauth=1` | `api/mcp/complete-oauth` | `lib/mcp/completeMcpOAuth.ts` | — | `NEXT_PUBLIC_MCP_URL` | — |
| Early access admin | admin pages | `api/early-access/*` | `shared/access` | `invite_codes`, `early_access_*` | `EARLY_ACCESS_ENABLED`, `ADMIN_EMAILS` | — |

## Learn (learner)

| Feature | UI | API | Core lib | Tables | Env / flags | Tests |
|---|---|---|---|---|---|---|
| Dashboard | `(dashboard)/page.tsx` | `api/intelligence/next-action`, `api/teaching/next-fifteen` | `nextBestActionEngine.ts` | `learner_profiles`, `enrollments` | — | — |
| Course viewer (text/listen/watch/map/cards/sim) | `courses/[id]/learn/CourseViewer.tsx` | `api/ai/generate-*`, `api/events` | `lib/utils.ts` | `modules`, `learning_events` | `SUDAR_INTELLIGENCE_URL`, `SUDARVID_URL` | — |
| Tutor "Sudar" | `components/tutor/SudarChatPanel`, `FloatingSudarChat` | `api/tutor/query`, `proactive-nudge`, `resources` | `lib/tutor/*` | `ai_interactions` | `TUTOR_WEB_ENRICHMENT_ENABLED`, `RAG_RERANK_ENABLED` | `lib/tutor/*.test.ts` |
| Memory page | `(dashboard)/memory` | — | `lib/memory/insights.ts` | `ai_interactions`, `learner_claim_mastery` | — | — |
| Teaching OS | course viewer checks, dashboard "Next 15" | `api/teaching/*`, `api/alp/teaching/next-action` | `lib/teaching/*` | `learning_domains`, `learning_claims`, `learner_claim_mastery`, `learning_sessions` | — | `lib/teaching/pedagogyEngine.test.ts` |
| SudarNotes | `/journey` (`JourneyShell`, `JourneyWorkspace`, `LearningNotebook`, `SudarVoiceOrb`) | `api/tutor/query` (journey mode), `api/journey/notebook`, `api/sim/voice/*` | `lib/sudarNotes/*`, `lib/journey/*` | `sudar_notes_sessions`, `journey_notebooks` | `NEXT_PUBLIC_SUDAR_JOURNEY` | `lib/sudarNotes/turnContract.test.ts` |
| SudarSim session | `/sim/session/[id]`, `SimWorkspace`, `SimVoiceShell` | `api/sim/session*`, `[id]/agent`, `[id]/voice` | `lib/sim/*` | `sim_sessions`, `sim_turns` | `SUDAR_SIM_URL`, `SUDAR_SIM_SERVICE_SECRET`, `LIVEKIT_URL` | `lib/sim/simSession.voiceMvp.test.ts` |
| Gamification | `CoinWidget`, toasts | `api/coins/*` | `lib/gamification/*` | `coin_ledger` etc. | — | — |
| ALP (LMS plugins) | — | `api/alp/*` | `lib/alp/*`, `alp-auth.ts` | various | ALP keys | `alp-auth.test.ts`, `alpGoldenContracts.test.ts` |

## Services

| Service | Entry | Port | Needs |
|---|---|---|---|
| Intelligence | `sudar-intelligence/run.bat` / `uvicorn src.api.main:app` | 8001 | provider keys, `INTELLIGENCE_SERVICE_SECRET`, optional `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY`, `HUGGINGFACE_API_KEY` |
| SudarVid | `sudar_vid` | 8000 | FFmpeg, Together key |
| sudar-sim | `sudar-sim/main.py` | 8090 | `LIVEKIT_*`, `DEEPGRAM_API_KEY`, `CARTESIA_API_KEY`, `SUDAR_LEARN_URL`, `SUDAR_SIM_SERVICE_SECRET` |
| LiveKit | `docker compose -f sudar-sim/docker-compose.livekit.yml up` | 7880 | Docker |
| MCP worker | `workers/sudar-mcp-cloudflare` (Wrangler) | — | `SUDAR_STUDIO_URL`, `SUDAR_LEARN_URL`, `MCP_PUBLIC_URL` |

Launch everything locally: `node scripts/dev-all.mjs` (use `--check` to validate env first).
