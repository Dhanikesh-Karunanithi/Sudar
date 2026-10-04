# Persona test report: Sudar beta (2026-09-30 to 2026-10-04)

Browser agents used the `experiment/sudar-2.0-conversational` branch running locally (`npm run dev:all`) as persona accounts in the **Sudar Beta** org. Accounts come from `scripts/ops/provision-persona-testers.mjs`, and demo content from `scripts/seed-demo.mjs`. To save budget, Sam's accessibility checks were folded into Arjun's run, and the skeptic's checks ran as the Playwright suite (`e2e/`) instead of a browser agent.

## Scorecards

| Persona | Surface / flows | First run | After fixes | Notes |
|---|---|---|---|---|
| Priya (L&D manager, CREATOR) | Studio: generate, quality, publish, feedback | 3/10 | 9/10 | Generation was blocked by the Sudar AI tier error, and onboarding let a CREATOR rewrite org settings. After the fixes, a 3-module course generated in about 2 min (quality 8.3/10, no blocking issues) and published smoothly. |
| Arjun (mobile learner) + Sam (keyboard) | Learn: modalities, quiz, tutor, dashboard | 5/10 | tutor fixed | Read, quiz, progress and dashboard updates work on a 390px screen. The tutor failed every question until the model fix. Escape closes dialogs and icon buttons are labelled. |
| Meera (self-learner) | SudarNotes `/journey` | 8/10 | - | Good Socratic teaching, and notes persist after reload. The voice orb degrades cleanly when the mic is unavailable. |
| Rahul (sales rep) | Practice / SudarSim (typed fallback) | 4/10 | 8/10 | The first run gave up during slow dev compilation. The retry got a session, a coach report (scores, replay moments, actionable advice), and a tutor answer in about 8s. |
| Skeptic (Playwright) | Public + security gates + full loop | 9/11 | 16/16 (1 skipped) | Cross-site tutor 403, Bearer allowlist, invite rate limit, and sim secret all hold. Found the enrolment 500 and the missing learner profiles. |

## Bugs found and status

| Sev | Bug | Fix |
|---|---|---|
| P0 | AI generation and tutor blocked: "Sudar AI (included pilot tier) is not enabled on this deployment" when an org has `ai_platform.enabled` but the deployment lacks `ALLOW_ORG_PLATFORM_AI` | Fall through to the cloud chain (`shared/ai/orgAiPlatform.ts`) |
| P0 | Any org member finishing Studio onboarding could rename the org, change its slug and governance defaults, and invite ADMINs (the persona run changed `sudar-beta` to `sudar-beta-f1a59a`; restored) | Admin-only org steps, stable slug, visible save errors (`sudar-studio/src/app/onboarding/*`, `api/onboarding/complete`) |
| P0 | Tutor failed every question: Together moved `openai/gpt-oss-20b` and `gemma-3n` to dedicated endpoints ("non-serverless") | Serverless defaults plus a same-provider default-model retry (`shared/ai/platformChat.ts`, `sudar-learn/src/lib/ai/chat.ts`) |
| P0 | Only 1 of 30 users had a `learner_profiles` row. Inserts omitted `updated_at`, which has no DB default, and the tutor memory update silently no-op'd, so onboarding answers and skips were never saved (forced onboarding after 3 skips) | `updated_at` on all inserts, memory route inserts when missing, migration `20261004120000_learner_profiles_updated_at_default.sql`, 29 rows backfilled |
| P1 | `POST /api/enrollments` returned 500 after enrolling when `NOTIFICATION_UNSUBSCRIBE_SECRET` is unset | Email channel is best-effort (`sudar-learn/src/lib/notifications/dispatch.ts`) |
| P1 | Proactive tutor prompts 500'd (`createTranslator` imported from `next-intl/server`) | Import from `next-intl` |
| P2 | "Ask Sudar" toolbar button sometimes covered by the sticky header (seen twice in automation) | Logged in KNOWN_GAPS |
| P2 | Check-in popups interrupt too often (3+ in 15 min) | Logged |
| P2 | Deep links to a course land on learner onboarding first | Logged (by design; review copy) |
| P3 | Studio module-count buttons have a weak selected state; lesson-design jargon | Logged |
| P3 | SudarVid planner still defaults to `gpt-oss-20b` (submodule `sudar_vid`) | Logged; set `TOGETHER_TEXT_MODEL` on the SudarVid host |

## Cross-persona themes

| Theme | Evidence | Takeaway |
|---|---|---|
| Content quality is strong | Priya: structured lessons, flip cards, checks, 8-8.5/10 per module; Meera: tutor teaches like a 1:1 | The quality gate and pedagogy engine are the product's strength |
| Silent failures hide the real problems | The platform tier, missing learner profiles, model retirement and notification errors all failed quietly or with technical copy | Error reporting (Sentry DSN) and friendly errors matter more than new features |
| Interruptions | Check-ins and onboarding gates | Throttle check-ins per session |

## Feedback pipeline

In-product feedback writes to `early_access_feedback`: Priya's report (Studio, category `bug`) arrived with its message and route.
