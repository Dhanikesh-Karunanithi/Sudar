# Sudar feature map

Where each feature lives end to end. Update the row when you add routes, tables, flags, or tests.

## Studio (creator)

| Feature | UI | API | Core lib | Tables | Env / flags | Tests |
|---|---|---|---|---|---|---|
| Course generation | `app/(dashboard)/courses/new`, course editor | `api/ai/generate-course`, `generate-all-modules`, `generate-from-document`, `generate-module`, `generate-module-with-research` | `lib/ai/courseGeneration/*` (pipeline, prompts, qualityValidator, qualityGate, componentValidation, grounding); `shared/content-generation/{quality,moderation}.ts` | `courses`, `modules`, `generation_telemetry` | `OPENROUTER_API_KEY`, `TOGETHER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `CONTENT_QUALITY_*`, `CONTENT_MODERATION_*` | `lib/ai/courseGeneration/{quality,contentEval}.test.ts`, `npm run eval:content` (golden set `scripts/evals/golden/`) |
| Quiz generation | module editor | `api/ai/generate-quiz` | `shared/content-generation/prompts.ts`, `schemas.ts`, `quality.ts` (`validateQuizQuality`) | `modules.quiz` | same | Studio vitest |
| Quality review | `courses/[id]/quality` | `api/courses/[id]/quality` | `qualityValidator.ts`, `qualityGate.ts` | `generation_telemetry`, `modules.review_status`, `modules.quality` | — | `quality.test.ts` |
| Publish | course editor | `api/courses/[id]/publish` (409 on unresolved critical issues) | — | `courses.status` | — | `e2e/tests/loop.spec.ts` |
| Tester feedback | `components/feedback/StudioFeedbackButton` (testers only), Sudar chat | `api/feedback/early-access`, `api/feedback/upload` | `shared/feedback/*` | `early_access_feedback` | — | — |
| Auth / Bearer (MCP) | — | middleware | `middleware.ts`, `lib/security/bearerRoutes.ts` | — | — | `lib/security/bearerRoutes.test.ts`, `e2e/tests/security.spec.ts` |
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
| Teaching OS | course viewer `ModuleClaimsStrip`, dashboard `NextFifteenCard` | `api/teaching/*` (incl. `module-claims`, `next-fifteen`), `api/alp/teaching/next-action` | `lib/teaching/*`, `lib/teaching/domainAccess.ts` | `learning_domains`, `learning_claims`, `learner_claim_mastery`, `learning_sessions` | — | `lib/teaching/pedagogyEngine.test.ts` |
| SudarNotes | `/journey` (`JourneyShell`, `JourneyWorkspace`, `LearningNotebook`, `JourneyDomainPicker`, `SudarVoiceOrb`) | `api/tutor/query` (journey mode), `api/journey/notebook`, `api/journey/voice`, `api/journey/domains` | `lib/sudarNotes/*`, `lib/journey/*` (`notebookStorage`, `notebookSync`), `hooks/useJourneyVoice.ts` | `sudar_notes_sessions` (`thread_key = 'journey'`) | `NEXT_PUBLIC_SUDAR_JOURNEY` | `lib/sudarNotes/turnContract.test.ts`, `lib/journey/notebookStorage.test.ts` |
| Practice | `(dashboard)/practice`, `StartPracticeButton`, TopNav **Practice** | `api/sim/session` | — | `sim_scenarios` | — | `e2e/tests/loop.spec.ts` (with `E2E_SIM_SCENARIO_ID`) |
| SudarSim session | `/sim/session/[id]`, `SimWorkspace`, `SimVoiceShell` (15s agent watchdog → push-to-talk) | `api/sim/session*`, `[id]/agent` (secret), `[id]/voice` | `lib/sim/*`, `lib/security/learnPublicPaths.ts` | `sim_sessions`, `sim_turns` | `SUDAR_SIM_URL`, `SUDAR_SIM_SERVICE_SECRET` (required), `LIVEKIT_URL` | `lib/sim/simSession.voiceMvp.test.ts`, `lib/security/learnPublicPaths.test.ts` |
| Enrollment | course catalog | `api/enrollments` (org-scoped) | `lib/security/contentEditorAccess.ts` (`userInOrg`) | `enrollments` | — | `e2e/tests/loop.spec.ts` |
| RAG ingest | — | `api/rag/ingest`, `api/rag/ingest-external` (org editors only) | `lib/rag/*`, `lib/security/contentEditorAccess.ts` | `content_chunks` | embed provider keys, `INTERNAL_SERVICE_SECRET` | `e2e/tests/security.spec.ts` |
| Error reporting | `components/layout/ErrorReportingHost` (both apps) | `src/instrumentation.ts` | `shared/observability/errorReporter.ts` | — | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | `lib/observability/errorReporter.test.ts` |
| Invite rate limit | — | `api/invite/{validate,prepare-oauth,redeem}` (both apps) | `shared/access/rateLimit.ts` | `api_rate_limits` (`hit_rate_limit` RPC) | — | Studio `lib/security/rateLimit.test.ts` |
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

Launch everything locally: `node scripts/dev-all.mjs` (use `--check` to validate env first). Smoke a deployed pair: `cd e2e && npm test` (see [TESTER_GUIDE.md](../TESTER_GUIDE.md)).
