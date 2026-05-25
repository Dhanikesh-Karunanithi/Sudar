# Sudar — Updates & Development Log

**Creator:** Dhanikesh "Dhani" Karunanithi · **Ecosystem:** Sudar

This file tracks **what we've built** (phase-wise) and **what's upcoming**. Update it at the end of each development day so every GitHub commit tells a clear story. Use the format below for new entries.

---

## How to use this file

- **When you commit**: Add a short dated entry under **Latest** with the day’s changes, then commit with a message that references the update (e.g. `Updates: path assignment + compliance view (UPDATES.md)`).
- **What we've built**: Summary of completed phases (update when a phase or major feature is done).
- **What's upcoming**: Prioritised next work (sync with [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md) and [docs/ACTION_PLANS.md](docs/ACTION_PLANS.md)).

---

## Latest (add new entries at the top)

### 2026-05-25 — Tutor input guardrail hardening (Learn)

- **Security**: First-turn tutor messages can no longer skip the learning-scope LLM check solely because they start with common question words (`What…`, `How…`, etc.) or contain continuation tokens (`continue`, `next`, …). Session-only follow-up bypass patterns live in `sudar-learn/src/lib/tutor/tutorFollowupBypassPatterns.ts` with Vitest coverage.

### 2026-05-13 — Localization + tutor memory LLM cadence

- **Localization (Learn + Studio + Intelligence)**:
  - **Learn**: `next-intl` (cookie `NEXT_LOCALE`), 30+ locale catalogs under `sudar-learn/src/messages/`, dynamic `lang`/`dir`, Noto font stacks + RTL; **Memory** → language (UI / content / auto-detect) via `learner_preferences` + sync to `learner_profiles.preferred_language`; multilingual Edge + Sarvam TTS maps; tutor + proactive routes inject `content_language`; `POST /api/ai/generate-image` proxies Intelligence.
  - **Studio**: `next-intl` + org **Localization** card (Studio UI cookie + org default UI locale for learners in `organisations.settings.localization.default_ui_locale`); `GET`/`PATCH` `/api/org/settings` exposes `localization`; optional **AI course covers** on AI course creation when Intelligence + `TOGETHER_API_KEY` return image bytes → `course-media` (`sudar-studio/src/lib/intelligence/courseCoverFromTogether.ts`).
  - **Intelligence**: Sarvam `target_language_code` from request; `ContentGenerateRequest.language`; `POST /api/image/generate` (Together FLUX).
  - **DB**: optional index migration `supabase/migrations/20260513120000_learner_preferred_language_index.sql` on `learner_profiles(preferred_language)`.
  - **Shared**: `shared/i18nLocales.ts` — canonical locale list + `LOCALE_OPTIONS`.
- **Tutor memory LLM cadence (learner + org)**:
  - **Learn**: My Memory → Learning preferences — learners set **how often** an LLM may infer profile updates from tutor chat (`off` / per message / daily / weekly) and **minimum days** between long-range digest summaries (1 / 7 / 30). Tutor route gates `updateLearnerMemory`; `ai_tutor_context.tutor_memory_llm_last_extraction_at` tracks last extraction.
  - **Learn cron**: `consolidate-learner-memory` respects digest cadence and org policy (skip digest when org disables LLM memory updates).
  - **Studio**: Org settings → AI personalization — **Tutor memory — LLM learning cadence**: org-wide disable, optional minimum hours between profile-inference LLM runs, optional minimum days between digests (floors on learner choices).
  - **Docs**: `docs/sudar-memory.md`, `docs/LAMP-Updated-Draft.md` (abstract + twin/tutor sections), `teachwithsudar` papers blurb; `docs/SHIPPED_FEATURES.md` catalog entry.

### 2026-04-26 — GitHub homepage: professional README and documentation pointers

- **Web presence (repo)**: Reworked the root **README** into a product-focused GitHub landing page: clear value proposition, comparison vs typical LMSs, capability sections for **Sudar Studio**, **Sudar Learn**, and **Sudar Intelligence**, architecture diagram, trust/governance and ALP callouts, and links to **Supabase** single data layer, deployment docs, and deeper specs — without foregrounding internal folder renames.
- **Documentation map**: README now points contributors to [ECOSYSTEM.md](ECOSYSTEM.md), [RESEARCH_FOUNDATION.md](RESEARCH_FOUNDATION.md), [docs/PRODUCT_FEATURES.md](docs/PRODUCT_FEATURES.md), [docs/SHIPPED_FEATURES.md](docs/SHIPPED_FEATURES.md), [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md), and this file for ongoing update tracking.
- **Repo hygiene**: Source-of-truth for dated milestones remains **UPDATES.md**; use it for user-facing and meaningful technical milestones, not build-cache or local-only noise.

### 2026-04-17 — Sudar consolidation + engagement and proactive learning pass

- **Repo and naming consolidation**:
  - Continued broad migration from legacy `byteos-*` paths to `sudar-*` paths across apps, docs, scripts, and environment references.
  - Removed legacy premium-LMS and older video surface remnants in favor of the current Sudar app structure.
- **Learn product expansion (engagement + retention)**:
  - Added gamification and motivation surfaces: achievements, quests/rewards, coins, check-in APIs, KPI/leaderboard/insight endpoints, and supporting UI components.
  - Added notifications center and profile/avatar utilities for learner identity and re-engagement loops.
  - Added inactivity hibernation handling and proactive nudge infrastructure to support safer, context-aware learner prompts.
- **Tutor and AI interaction upgrades**:
  - Added proactive tutor prompt/reply APIs and reusable response contract scaffolding for consistent tutor behavior.
  - Added voice preview assets/routes and voice-provider status checks to improve audio modality reliability and learner choice.
  - Extended generation/tutor route integrations and supporting libs for more resilient orchestration.
- **Intelligence and docs alignment**:
  - Updated Intelligence route/auth wiring and related deployment/environment guidance.
  - Refreshed roadmap, trust, product, user-flow, and shipped-feature documentation to reflect current Sudar scope and naming.

### 2026-04-15 — Gamification Fast MVP shipped (core parity + engagement polish)

- **API parity (Learn)**:
  - Added `POST /api/quests/progress` (`sudar-learn/src/app/api/quests/progress/route.ts`) to emit milestone events and run immediate gamification evaluation.
  - Added missing quest lifecycle events on assignment (`quest_started`) in `sudar-learn/src/app/api/quests/route.ts`.
- **Reward correctness**:
  - Unified check-in reward handling through the central gamification engine (removed duplicate direct coin/xp writes from `sudar-learn/src/app/api/checkin/answer/route.ts`).
  - Engine now emits structured `learning_events` for `level_up`, `achievement_unlocked`, `quest_step_completed`, and `quest_completed`.
- **Profile completeness**:
  - Added deterministic completeness rollup helper (`sudar-learn/src/lib/gamification/profileCompleteness.ts`).
  - Wired completeness updates from check-ins and learner preference updates into `learner_profiles.profile_completeness_pct`.
- **Animation + interaction (Learn)**:
  - Added global gamification toast layer (`sudar-learn/src/components/features/gamification/GamificationToasts.tsx`) for level-up and badge unlock feedback.
  - Mounted to dashboard layout for always-on milestone feedback.
  - Check-in floating card now reflects actual earned coins and level-up state from backend response.
- **Challenges (Studio + engine)**:
  - Added org challenge progression endpoint: `sudar-studio/src/app/api/org/challenges/[id]/progress/route.ts`.
  - Enhanced challenge listing API with aggregate `teamProgress`.
  - Added org challenge progression and coin prize payout logic in `sudar-learn/src/lib/gamification/engine.ts`.

### 2026-04-15 — Repository path rename migration (`byteos-*` -> `sudar-*`)

- **Directory rename shipped**:
  - `byteos-studio` -> `sudar-studio`
  - `byteos-learn` -> `sudar-learn`
  - `byteos-intelligence` -> `sudar-intelligence`
- **Reference updates**: filesystem path references across docs/scripts/config were updated to `sudar-*`.
- **Compatibility window active (temporary)**: historical notes may still mention `byteos-*`; treat them as aliases during this stabilization cycle.
- **Cleanup target**: remove remaining legacy alias mentions after one full stabilization cycle (target date: 2026-05-15).

### 2026-04-11 — Sudar: brand, personalization v2, trust pack, governance, learner UX

**Continuing this work (operators & agents)**  
- **Database**: Apply `supabase/migrations/20260410000000_personalization_v2.sql` to the shared Supabase project (consent column, `personalization_overlays` on enrollments, `learner_groups` / `learner_group_members`). Then align Prisma: `sudar-studio` — `npx prisma db pull` or `db push` as you normally do for this repo.  
- **Policy & product docs**: Brand and messaging live under `docs/brand/`; security / procurement context under `docs/trust/` (indexed in `docs/trust/README.md`). Studio **Governance** (`/governance`) links learners to the trust pack.  
- **Code map**: Learn personalization gates — `sudar-learn/src/lib/personalization/eligibility.ts`, module overlays API — `sudar-learn/src/app/api/ai/module-personalize/route.ts`, consent — `sudar-learn/src/app/api/learner/ai-consent/route.ts`. Studio org AI compliance + course personalization live in org/course settings and APIs (`sudar-studio/src/app/api/org/settings/route.ts`, course editor). Learner groups API — `sudar-studio/src/app/api/org/learner-groups/`. Mascot system — `sudar-learn/src/lib/mascot/*`, `sudar-learn/src/components/mascot/*`.  
- **Windows / Studio dev**: Prefer `npm run dev` from `sudar-studio` (uses `scripts/run-next.mjs`) so Next resolves correctly; optional `NEXT_FORCE_PROJECT_DIST=1` if you want `.next` inside the app folder. See `sudar-studio/.env.example`.  
- **Shipped feature summary**: [docs/SHIPPED_FEATURES.md](docs/SHIPPED_FEATURES.md) (April 2026 sections). Roadmap text: [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md) §2.

**What shipped**  
- **Brand & UI**: Sudar logo components and static marks in Learn and Studio (`SudarLogo.tsx`, `public/sudar-logo.svg`, `public/sudar-logo-mark.svg`); logo assets under `assets/sudar logo/`. Learn theme/globals and Tailwind tokens refined for consistent Sudar visual language.  
- **Mascot (Learn)**: Neutral mascot SVGs in `sudar-learn/public/mascots/`; `MascotAvatar`, `MascotJourneyCard`, `MascotModeBadge`; engine/personas/rollout/tracking under `sudar-learn/src/lib/mascot/`; types in `src/types/mascot.ts`.  
- **Personalization v2**: Opt-in **per-module AI overlays** (`role_explain`, `brief_3min`) stored on `enrollments.personalization_overlays` without changing canonical `modules.content`. Eligibility respects `courses.settings.personalization`, `courses.is_adaptive`, and `organisations.settings.ai_compliance`; learner consent via `learner_profiles.generative_ai_consent_at` and `/api/learner/ai-consent`. Daily usage cap via `module_personalize` in usage limits. Plain-text extraction helper: `sudar-learn/src/lib/learn/modulePlainText.ts`.  
- **Studio**: **Governance** dashboard page; **Compliance** page cross-links; course detail/settings expanded for personalization and org policies; **learner groups** REST API (`/api/org/learner-groups`); Prisma/schema and `database` types updated; agent chat and platform knowledge touch-ups; `fetch-with-deadline` utility; **sensitive input guard** shared pattern with Learn. Middleware and `next.config.mjs` updates; dev scripts `scripts/run-next.mjs`, `scripts/rm-next-cache.mjs`.  
- **Learn (learner experience)**: **Global search** route (`/search`); course viewer, onboarding, paths, settings (including AI consent UI), TopNav, Floating Sudar Chat, enroll-bridge and path-enrollments improvements; tutor and ALP query routes hardened; **sensitive input guard** for tutor-facing inputs.  
- **Docs**: Full **brand** pack (`docs/brand/` — strategy, guidelines, tokens, mascot specs, rollout checklist, deck assets). **Trust** pack (`docs/trust/` — posture, data flows, subprocessors, AI system register, threat model, operations). Root **README**, **ECOSYSTEM**, **AGENTS**, **GITHUB_SETUP**, marketing/pitch decks aligned with Sudar positioning.

### 2026-04-07 — SudarVid overhaul: loader UX, timeline editor, media generation pipeline
- **SudarVid frontend**: Refined UI/UX in `frontend/index.html`, `frontend/assets/main.css`, and `frontend/assets/main.js` with improved timeline editing flow and richer controls for creator-side video building.
- **Playback and loader experience**: Updated `static/js/sudarvid.js`, added dedicated loader assets (`loader.html`, `sudar_loading_v3.html`), and intro/outro template support (`sudarvid-intro-outro.html`).
- **Generation pipeline**: Expanded backend logic across `sudarvid/core.py`, `sudarvid/server.py`, `sudarvid/media.py`, `sudarvid/content_planner.py`, and `sudarvid/image_gen.py` for stronger planning/media orchestration and model handling (`sudarvid/image_models.py`).
- **Themes and templates**: Enhanced render templates (`templates/base.html.j2`) and theme/type wiring (`sudarvid/themes.py`, `sudarvid/types.py`) for higher quality output composition.
- **Config/docs**: Updated `sudar_vid` README, `.env.example`, and dependency set in `requirements.txt` to match the refreshed workflow.

### 2026-03-18 — Vercel builds: login/signup Suspense; Learn UX; marketing site; docs
- **Next.js 15 / Vercel**: Learn and Studio `/login` and `/signup` now use a **Server Component page** + **client `*Client.tsx`** wrapped in `<Suspense>` so `useSearchParams()` no longer fails static generation on Vercel.
- **Learn**: Signup split to match login; removed temporary debug ingest calls from tutor API and chat UI.
- **Learn UX**: Dashboard/progress loading states, greeting/top-nav tweaks, course viewer and modality cards refinements; flashcards API touch-up.
- **teachwithsudar**: Marketing Next.js site (Teach with Sudar) added under repo root.
- **Docs & audit**: LAMP draft, research paper/bib updates; Learn audit notes in `audit/Learn/`.

### 2026-03-17 — Security hardening: IDOR fixes, JWT validation, RLS, rate limits, CSP, logging
- **Authorization & IDOR**: Hardened ALP endpoints to enforce org scope; Intelligence now validates Supabase JWT (subject must match learner_id/user_id) and supports an optional server-to-server secret for ALP proxy calls.
- **Supabase RLS**: Added migrations to enable RLS + ownership policies on learner-scoped tables (learner_profiles, learning_events, ai_interactions, enrollments, certifications) and RAG `content_chunks`.
- **AI cost abuse protection**: Added `usage_limits` (per-user/day) and an atomic increment RPC; Learn now enforces daily limits for tutor and next-action requests. Intelligence adds per-IP rate limiting for tutor and next-action.
- **Input validation & prompt injection**: Tutor message length capped (2000 chars) and basic prompt-override line filtering; Intelligence adds Pydantic validators for tutor inputs.
- **Deployment hardening**: CSP headers added in both Next.js apps; Intelligence disables Swagger/ReDoc in production; `.env` added to Learn .gitignore.
- **Logging**: Added structured JSON logging for auth events, AI provider failures, and FastAPI 4xx/5xx responses (no JWT/PII).

### 2026-03-13 — Ship recent work + one more win (Listen modality, compliance reminders)
- **Ship recent work**: Documented Flashcards, document-to-course (generate-from-document), and SCORM 1.2 import in [docs/SHIPPED_FEATURES.md](docs/SHIPPED_FEATURES.md). Updated STRATEGIC_PATH §2 (current state) and §3 (Next 3: ship recent work and one more win marked done).
- **Listen (Audio TTS) modality**: Added **Listen** tab to Learn course viewer (CourseViewer). Learners can switch to Listen to hear the current module via TTS; AudioCard + generate-audio API; cache per module, retry when unavailable. Same completion rules (e.g. min time) apply.
- **Compliance email reminders**: Documented in SHIPPED_FEATURES.md and STUDIO_USER_GUIDE §5 (Compliance and email reminders). Cron endpoint `POST /api/cron/compliance-reminders` with CRON_SECRET; env: RESEND_API_KEY, RESEND_FROM. Quick reference table updated.
- **ACTION_PLANS**: Plan D checklist updated — B1–B5 and P1–P8 marked done; O1/O2 (pilot, Claude-for-OSS) to be done after build is complete.

### 2026-03-13 — Product update: New modalities, ALP embed, certificates & media
- **Learn — New modalities**: Audio (AudioCard, ReadAlongControls, ReadingBodyWithSentences), Video (CourseVideoCard), Podcast (CoursePodcastCard), MindMap (MindMapCard). Generate-audio and generate-mindmap APIs; ActivityChartClient, learner preferences API, settings page.
- **Learn — Certificates**: Server-side certificate PDF generation (API route + CertificatePDF component), cert verification and print/save flow improvements.
- **Learn — Sudar & ALP**: FloatingSudarChatClient, ModelPicker; ALP embed (AlpEmbedChat, embed page), embed-token, events, next-action, alp tutor query APIs; alp-auth lib.
- **Studio — Content & media**: Generate-module-with-research API; media search (search-audio, search-videos) and libs (audioSearch, videoSearch, webSearch); studio generate-audio, podcast, video APIs; ProjectMediaPeek; courseContentForGeneration, courseMedia. ModelPicker, block editor and content panel updates.
- **Studio — Operations**: Integrations page and API (keys, org settings); cron compliance-reminders route.
- **Intelligence**: Audio route (FastAPI), README.run.md, run.bat for local run.
- **Docs**: STUDIO_USER_GUIDE, ALP_API, AUDIO_STRATEGY, LAMP_BUILD_PLAN/TRACKER, PILOT_PLAN, DEMO_VIDEO; ACTION_PLANS, STRATEGIC_PATH, screenshots README.

### 2026-03-08 (ship recent work)
- **Documented as shipped**: Flashcards modality (Learn: FlashcardsCard + generate-flashcards API), document-to-course (Studio: generate-from-document API for PDF/DOCX/URL), SCORM 1.2 import (Studio: import-scorm API). All three are live; current state in STRATEGIC_PATH Section 2 and this file is aligned.
- **Visibility**: Screenshots README and DEMO_VIDEO instructions added under docs/screenshots/; README links updated.

### 2026-03-08
- **Sudar Chat (Learn)**: Floating Sudar Chat widget (global access from dashboard), startup questions, paste context, generative blocks (enroll / continue / review), outcome logging (`tutor_action_taken` to learning_events), validate-memory quick preferences (response length: one_line, detailed, concise; modality: reading, listening, video, no_video). Tutor workflow API (summarize, extract_terms) for batch workflows.
- **RAG (Learn)**: content_chunks migration (pgvector 1024), ingest API (index published courses or single course), embed/retrieve/cache libs, [RAG_SETUP_STEPS.md](sudar-learn/docs/RAG_SETUP_STEPS.md) for env, DB, and ingest.
- **Memory & insights**: Insights builder from learner profile/events/enrollments/ai_interactions, InsightsCarousel component, memory/validate-memory alignment.
- **Dashboard & paths**: DashboardSidebar, TopNav, ActivityChart, ProgressPieChart, PathNodeGraph, CourseThemeProvider and learning personas (themed learning experience).
- **Auth**: Change password flow (require_password_change after admin reset) — page, form, complete-password-change API.
- **SCORM**: SCORM asset proxy in Learn — serve SCORM package assets from Supabase Storage (course-media) with correct MIME types for iframe playback.
- **Docs/assets**: Sudar Chat logo assets (light/dark), root doc tweaks (AGENTS, CONTRIBUTING, ECOSYSTEM, GITHUB_SETUP, README, RESEARCH_FOUNDATION).

### 2026-03-02
- **Web presence**: README updated with "What makes Sudar different" highlights (Sudar's memory, adaptive paths, compliance, open source). Updates section now references Phase 5 in progress (flashcards, document-to-course, SCORM 1.2 import).
- **Phase 5**: Flashcards modality (Learn), document-to-course (Studio generate-from-document), and SCORM 1.2 import (Studio import-scorm) documented as implemented.

### 2026-02-26
- **Learn (Memory)**: Info banner on Sudar's Memory page now uses explicit light/dark colors (amber-50/amber-950, amber-900/amber-100) so text is readable in both themes — no camouflaging when switching color mode.
- **Roadmap**: SCORM & format import added to "What's upcoming" (upload SCORM 1.2 packages, parse manifest, map to courses; other formats later). Second modality and Document/URL import remain first priorities.
- **Repo & docs**: Sudar pushed to GitHub with README, RESEARCH_FOUNDATION, UPDATES, CONTRIBUTING, LICENSE. Creator story and problem/solution framing added; research-backed positioning for adaptive learning + learner memory.
- **Phase summary**: UPDATES.md created; phase-wise “what we’ve built” and “what’s upcoming” documented for daily commits.

### 2026-02-24 (representative)
- **Compliance & creator velocity**: Path assignment from Studio (assign learners + due date), Assigned learners table, Compliance page (overdue / at-risk / on-track). Learn: Upcoming deadlines, Required by organisation, Certificate Print/Save as PDF.
- **Progress & paths**: Progress page (courses, paths, certificates), path progress % sync on course complete, path unlock rules (complete previous first).

---

## What we've built (phase-wise)

### Phase 1 — Foundation ✅
- Supabase schema (profiles, organisations, courses, modules, enrollments, learning_events, ai_interactions, learner_profiles, learning_paths, certifications).
- Shared auth (Supabase Auth) across Studio and Learn.
- Sudar Studio scaffold (Next.js 14): dashboard, courses CRUD, org/workspace.
- Sudar Learn scaffold (Next.js 14): dashboard, course catalog, enrollments.
- Environment contracts and RLS policies.

### Phase 2 — Integration ✅
- Course publish: Studio publishes to Supabase; Learn reads and displays published courses.
- Enrollments and learning_events (module start/complete, quiz attempts, duration).
- Progress calculation and enrollment status (not_started, in_progress, completed).
- End-to-end flow: author → publish → enroll → learn → track.

### Phase 3 — Learner experience ✅
- **Personalised dashboard**: Streak, total learning time, engagement %, courses completed, “Sudar recommends” (next best action). DashboardSidebar, TopNav, ActivityChart, ProgressPieChart, PathNodeGraph. CourseThemeProvider and learning personas (themed experience per course).
- **Course viewer**: Markdown rendering, module navigation, progress auto-save, quizzes with immediate feedback. SCORM delivery: proxy for SCORM package assets from Supabase Storage (course-media) with correct MIME types for iframe playback.
- **AI tutor "Sudar"**: RAG over course content (content_chunks + pgvector 1024, ingest API, embed/retrieve/cache). Floating Sudar Chat (global), startup questions, paste context. Longitudinal memory (ai_interactions + ai_tutor_context), contextual “Explain this” from text selection. Structured tutor responses (blocks/actions: enroll, continue, review). Validate-memory quick preferences (response length, modality). Tutor workflow API (summarize, extract_terms). Outcome logging (tutor_action_taken) for learning from suggestions. My Memory page (view/edit what Sudar knows). Memory insights builder and InsightsCarousel.
- **Onboarding assessment**: Short intake flow to bootstrap learner profile (goals, background, style).
- **Learning paths**: Enroll in paths, personalised sequence for adaptive paths, path progress and unlock rules (complete previous first).
- **Certifications**: Auto-issued on path completion, shareable public verification link, Print/Save as PDF.
- **Progress page**: Single view for courses, paths, and certificates.
- **Upcoming deadlines** and **Required by your organisation** on dashboard.
- **Auth**: Change password flow when require_password_change is set (e.g. after admin reset).

### Phase 4 — Intelligence ✅
- **Next best action**: Scores unenrolled courses from learner profile, AI-generated reason, stored in learner_profiles.
- **Struggle detection**: Quiz wrong answers feed into ai_tutor_context.struggles_with; used for path ordering and tutor context.
- **Adaptive path ordering**: Optional courses in a path reordered per learner (Sudar surfaces gaps, deprioritises known concepts).
- **Personalised welcome**: On enrollment in adaptive courses, AI-generated welcome that connects prior learning to the new course.
- **Studio analytics**: Org-level completions, quiz scores, top struggle topics; **Compliance** view (overdue / at-risk / on-track).
- **Path assignment**: Assign path to learners from Studio, optional due date, “Assigned learners” table.

### Phase 5 — Scale (in progress)
- **Done**: Path assignment + due dates, compliance view, certificate print, upcoming deadlines, required paths; compliance **email reminders** (Studio cron — see SHIPPED_FEATURES.md).
- **Implemented**: Flashcards modality (Learn: FlashcardsCard, generate-flashcards API); document-to-course (Studio: generate-from-document API for PDF/DOCX/URL); SCORM 1.2 import (Studio: import-scorm API). RAG in Learn (content_chunks, ingest, tutor search); Floating Sudar Chat (global); tutor workflows (summarize/extract_terms); outcome logging; validate-memory quick preferences; memory insights carousel; SCORM delivery proxy (Learn); change-password flow. **Personalization v2** (overlays, consent, learner groups), Sudar **brand/mascot** surfaces, **trust** docs + Studio Governance (2026-04-11 — see Latest above).
- **Upcoming**: SudarPlay / SudarFeed / SudarMind wiring, white-label, SSO/HRIS; production hardening of personalization policies.

---

## What's upcoming (prioritised)

| Priority | Item | Notes |
|----------|------|--------|
| 1 | **Second full modality** | Audio TTS for current module (standalone Audio tab in course viewer). Flashcards already live as embedded + generate API. |
| 2 | ~~Document/URL import~~ | ✅ Shipped — generate-from-document (PDF/DOCX/URL) in Studio. |
| 3 | ~~SCORM 1.2 import~~ | ✅ Shipped — import-scorm API in Studio. |
| 4 | ~~**Email reminders**~~ | ✅ Shipped — Studio `POST /api/cron/compliance-reminders` (see SHIPPED_FEATURES.md). |
| 5 | **Server-side certificate PDF** | Optional: generate PDF for download (in addition to browser Print). |
| 6 | **SudarPlay / SudarFeed / SudarMind** | Wire game, feed, and mindmap modalities into Learn. |
| 7 | **White-label & SSO** | Org branding, custom domain, SAML/OIDC (later phase). |
| 8 | **HRIS integration** | Webhooks for Workday, BambooHR, Rippling (later phase). |

*Detailed roadmap: [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md) | [docs/ACTION_PLANS.md](docs/ACTION_PLANS.md).*

---

## Template for daily entry (copy and paste)

```markdown
### YYYY-MM-DD
- **Area**: Short theme (e.g. Compliance, Learn dashboard, Studio paths).
- **Changes**: Bullet list of what was implemented or fixed.
- **Docs**: Any README/UPDATES/STRATEGIC_PATH changes.
```

---

*Sudar — Learns with you, for you. | Updated as development progresses.*

### 2026-04-15
- **Area**: Hybrid analytics engine (admin + learner insights).
- **Changes**:
  - Added event contract hardening on Learn `/api/events` with event-type validation and required payload semantics for `section_heartbeat`, `session_end`, `drop_off`, and `modality_switch`.
  - Added Supabase analytics migration with rollup tables/functions: `analytics_daily_user`, `analytics_daily_course`, `analytics_daily_module`, `analytics_org_rollup`, `analytics_risk_signals`, and `analytics_feedback`.
  - Added Studio analytics APIs: `/api/analytics/overview`, `/api/analytics/courses/[id]`, `/api/analytics/learner-risk`, `/api/analytics/export` (CSV).
  - Added Learn insights APIs: `/api/insights/me`, `/api/insights/time`, `/api/insights/feedback`.
  - Extended Learn NBA route (`/api/intelligence/next-action`) to return explainable analytics fields (`action_type`, `target`, `recommended_duration_mins`, `confidence`).
  - Added Intelligence endpoint `/api/learner/next-action-analytics` for analytics-driven recommendation output.
  - Added learner dashboard insight cards for focused time, engagement state, and suggested next session duration.
  - Added analytics feature-flag gate (`ENABLE_ANALYTICS_ENGINE=false` disables new analytics APIs).
- **Docs**:
  - Updated `docs/ALP_API.md`, `docs/STRATEGIC_PATH.md`, `docs/PRODUCT_FEATURES.md`, `docs/USER_FLOWS.md`, `docs/trust/DATA_FLOWS.md`, and `docs/trust/POSTURE.md`.
  - Added rollout notes in `docs/ENV_REFERENCE.md` and `docs/VERCEL_DEPLOYMENT.md` for `ENABLE_ANALYTICS_ENGINE` and daily analytics cron scheduling.
  - Added Studio cron endpoint `POST /api/cron/analytics-rollups` and manual admin trigger `POST /api/analytics/refresh` (via Analytics page “Refresh now”).
