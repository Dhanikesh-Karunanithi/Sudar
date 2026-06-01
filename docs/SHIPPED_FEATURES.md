# Sudar — Shipped Features (Documentation)

This document summarizes **shipped** features that are committed and ready for use. For current state and gaps, see [STRATEGIC_PATH.md](STRATEGIC_PATH.md) §2.

---

## External open courses — Discover (Learn)

- **Where**: Sudar Learn — **Courses** catalog (`/courses`), course detail, learn viewer for external items; Next Best Action on dashboard.
- **What**: Learners discover free/open courses from YouTube, Khan Academy, MIT OCW, and custom URLs. Hybrid delivery: embedded player when `embed_url` is set, otherwise link-out to the provider. Enroll to save progress; **Mark as complete** records `module_complete` and awards XP/coins via the standard events pipeline.
- **Key files**:
  - `supabase/migrations/20260601000000_external_open_courses.sql` — `courses.is_external`, `external_provider`, `external_url`, `embed_url`; seed catalog.
  - `sudar-learn/src/lib/courses/externalProviders.ts` — provider labels and badges.
  - `sudar-learn/src/app/(dashboard)/courses/[id]/learn/ExternalCourseViewer.tsx` — embed + completion UI.
  - `sudar-learn/src/app/(dashboard)/courses/[id]/page.tsx`, `EnrollButton.tsx` — external detail + enroll flow.
  - `sudar-learn/src/lib/intelligence/nextBestActionEngine.ts` — NBA includes external metadata.
- **Database**: `courses` columns above; one placeholder `modules` row per seeded open course for progress math.
- **Flow**: Browse catalog → open course detail → enroll → learn (embed or link-out) → mark complete → progress and gamification update; NBA can recommend open courses from skill gaps.

---

## Flashcards modality (Learn)

- **Where**: Sudar Learn course viewer — **Cards** tab per module.
- **What**: Learners can switch from Read to **Cards** to study the current module as flashcards. Cards are generated on demand from module content via AI.
- **Key files**:
  - `sudar-learn/src/app/(dashboard)/courses/[id]/learn/FlashcardsCard.tsx` — UI component.
  - `sudar-learn/src/app/api/ai/generate-flashcards/route.ts` — API that generates cards from content + optional module title.
- **Flow**: Switch to Cards → API called with module body → cards displayed; retry available. Progress and completion rules (e.g. min time) apply as in other modalities.

---

## Document-to-course (Studio)

- **Where**: Sudar Studio — course creation from document or URL.
- **What**: Admins can upload a PDF/DOCX or paste a URL; the system extracts text and generates a course outline + modules. Optional RAG-from-docs for richer generation.
- **Key files**:
  - `sudar-studio/src/app/api/.../generate-from-document/` (or equivalent route) — accepts file upload or URL, returns outline/modules.
- **Flow**: New course or “Generate from document” → upload/paste → AI generates structure → creator can edit and publish to Learn.

---

## SCORM 1.2 import (Studio)

- **Where**: Sudar Studio — import existing SCORM packages.
- **What**: Upload a SCORM 1.2 ZIP; the system parses `imsmanifest.xml`, maps to Sudar courses/modules, and stores assets in Supabase (e.g. `course-media`). Learners can then take the course in Learn with SCORM delivery (iframe proxy).
- **Key files**:
  - `sudar-studio/src/app/api/courses/import-scorm/route.ts` — import endpoint.
  - Learn: SCORM delivery proxy for package assets (correct MIME types, iframe launch).
- **Flow**: Studio → Import SCORM → upload ZIP → course created with SCORM modules → publish → Learn shows SCORM activity per module.

---

## Listen (Audio TTS) modality (Learn)

- **Where**: Sudar Learn course viewer — **Listen** tab per module (alongside Read, Watch, Map, Cards).
- **What**: Learners can switch to **Listen** to hear the current module read aloud. Audio is generated on demand via TTS (proxies to Sudar Intelligence when configured; otherwise returns `use_browser_tts` and the UI shows “Audio not available” with retry).
- **Key files**:
  - `sudar-learn/src/app/(dashboard)/courses/[id]/learn/AudioCard.tsx` — Listen tab UI.
  - `sudar-learn/src/app/api/ai/generate-audio/route.ts` — POST with `{ text }`; returns audio blob or JSON with `use_browser_tts` when TTS is unavailable.
- **Flow**: Switch to Listen → API called with module text → audio cached per module; play/regenerate. Completion rules (e.g. min time) apply. Learner preference `tts_voice` in profile is used when calling Intelligence.

---

## Compliance email reminders (Studio)

- **Where**: Sudar Studio — cron endpoint; call via scheduler (e.g. daily).
- **What**: Sends reminder emails to learners with path assignments that are **at-risk** (due within 7 days) or **overdue**. Uses Resend for delivery.
- **Key files**:
  - `sudar-studio/src/app/api/cron/compliance-reminders/route.ts` — POST with `Authorization: Bearer <CRON_SECRET>` (or `?secret=<CRON_SECRET>`).
- **Env**: `CRON_SECRET`, `RESEND_API_KEY`, optional `RESEND_FROM` (see [ENV_REFERENCE.md](ENV_REFERENCE.md)).
- **Flow**: Cron job calls endpoint → backend finds path enrollments with `due_date` → for each learner with at-risk/overdue items, sends one email listing those items and a link to the learning dashboard.

---

## Production deployment (documented)

- **Where**: Repo docs; no single “deploy” button — step-by-step guides.
- **What**: Sudar Studio and Sudar Learn deploy to **Vercel** (separate projects, same repo, root dirs `sudar-studio` and `sudar-learn`). Sudar Intelligence (Python FastAPI) is deployed separately to **Railway**, **Render**, or **Fly.io**; its URL is set as `BYTEOS_INTELLIGENCE_URL` in both Vercel projects.
- **Key files**: [docs/VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) — Studio + Learn on Vercel; [docs/INTELLIGENCE_DEPLOYMENT.md](INTELLIGENCE_DEPLOYMENT.md) — Intelligence on Railway/Render/Fly.io, env vars, CORS, health check.
- **Flow**: Connect GitHub repo to Vercel (two projects), set root dir and env vars; deploy Intelligence to chosen host, set `CORS_ORIGINS` and `BYTEOS_INTELLIGENCE_URL`; redeploy Studio and Learn.

---

## Personalization v2 — module overlays, consent, org policy (Learn + Studio)

- **Where**: Sudar Learn (course experience + settings); Sudar Studio (org settings, course editor, governance).  
- **What**: For **adaptive** courses, orgs can configure AI personalization (audience: org / groups / individuals; features: course welcome, role explanation, brief “3 min” views). Generated text is stored only in **`enrollments.personalization_overlays`** (per module keys); canonical **`modules.content`** is never overwritten. Orgs can require learner consent (`organisations.settings.ai_compliance`); consent timestamp on **`learner_profiles.generative_ai_consent_at`**.  
- **Database**: Migration `supabase/migrations/20260410000000_personalization_v2.sql` — consent column, `personalization_overlays` on `enrollments`, **`learner_groups`** and **`learner_group_members`** for audience targeting.  
- **Key files (Learn)**:
  - `sudar-learn/src/lib/personalization/eligibility.ts` — gate features by org, course, enrollment, consent.  
  - `sudar-learn/src/app/api/ai/module-personalize/route.ts` — POST to generate/store overlays (`role_explain` | `brief_3min`); usage limit `module_personalize`.  
  - `sudar-learn/src/app/api/learner/ai-consent/route.ts` — learner accepts generative personalization when required.  
  - `sudar-learn/src/lib/learn/modulePlainText.ts` — module body to plain text for prompts.  
- **Key files (Studio)**: Org settings API `sudar-studio/src/app/api/org/settings/route.ts`; learner groups `sudar-studio/src/app/api/org/learner-groups/`; course detail/settings UI for personalization flags; **Governance** `sudar-studio/src/app/(dashboard)/governance/page.tsx` (links to `docs/trust/`).  
- **Flow**: Admin enables policy + course personalization → learner meets consent if required → eligible learners request overlay per module → overlay cached on enrollment → telemetry via `learning_events` (see ECOSYSTEM.md — AI personalization boundaries).

---

## Brand, logo, and mascot system (Learn + Studio)

- **Where**: App chrome (header, nav, auth pages), public assets, learner journey cards.  
- **What**: Shared **SudarLogo** component and SVG marks; neutral **mascot** assets (Sudar, focus, memory, confidence) for journey UI; lightweight **mascot engine** (personas, rollout, tracking) for staged experiences.  
- **Key files**:
  - `sudar-learn/src/components/branding/SudarLogo.tsx`, `sudar-studio/src/components/branding/SudarLogo.tsx`  
  - `sudar-learn/public/sudar-logo.svg`, `sudar-logo-mark.svg`; Studio equivalents under `sudar-studio/public/`  
  - `sudar-learn/public/mascots/*.svg`, `sudar-learn/src/components/mascot/*`, `sudar-learn/src/lib/mascot/*`  
- **Brand docs**: `docs/brand/` (strategy, guidelines, design tokens, mascot illustration spec and character bibles, rollout checklist, messaging kit).

---

## Trust and governance documentation

- **Where**: Repository `docs/trust/`; Sudar Studio **Governance** page.  
- **What**: Technical trust pack (posture, data flows, subprocessors, shared responsibility, AI system register, threat model, operations, audit log backlog) for reviews and procurement — not legal advice.  
- **Key files**: `docs/trust/README.md` (index); `sudar-studio/src/app/(dashboard)/governance/page.tsx`.

---

## Proactive Sudar with multiple-choice replies (Learn)

- **Where**: Sudar Learn — **dashboard** (floating bar: session welcome on home, contextual prompts when navigating e.g. `/courses`, `/progress`, `/paths`, `/memory`, `/search`); **course viewer** (idle nudge banner after ~90s without interaction). Hidden on inline lesson pages where the course tutor handles idle nudges only.
- **What**: Sudar reaches out with a short message and **single-select chips**. Each chip maps to an optional `follow_up_message` sent to `/api/tutor/query` (same as typing), so learners respond without a keyboard. Snooze (X), route cooldowns, and session flags reduce spam. Intelligence **`POST /api/tutor/nudge`** documents the same **`choices`** shape for external LMSs (see [ALP_API.md](ALP_API.md) §5.2).
- **Key files**:
  - `sudar-learn/src/components/tutor/ProactiveSudarHost.tsx` — session + navigation triggers.
  - `sudar-learn/src/components/tutor/ProactiveSudarChoiceChips.tsx` — shared chip UI.
  - `sudar-learn/src/app/api/tutor/proactive-prompt/route.ts` — template prompts (`session_start`, `route_change`).
  - `sudar-learn/src/app/api/tutor/proactive-nudge/route.ts` — idle nudge + LLM JSON `choices` with validation/fallback.
  - `sudar-learn/src/app/api/tutor/proactive-reply/route.ts` — logs chip taps (`tutor_action_taken`, `proactive_choice`).
  - `sudar-learn/src/lib/tutor/proactiveTemplates.ts`, `proactivePromptSchema.ts`.
  - `sudar-intelligence/src/api/routes/tutor.py` — `NudgeChoice`, optional `choices` on `NudgeResponse`.
- **Flow**: Prompt shown → learner taps chip → optional follow-up opens floating or inline tutor and sends message → events in `learning_events` / `ai_interactions`.

---

## Learner gamification and engagement (Learn)

- **Where**: Dashboard and related APIs (quests, check-ins, coins, achievements, notifications) — see `sudar-learn/src/lib/gamification/`, `sudar-learn/src/app/api/quests/`, `sudar-learn/src/app/api/checkin/`, and dashboard layout toasts.  
- **What**: Optional engagement loop: quests with progress, daily check-ins, virtual coins and levels, achievement unlocks, in-app notifications, with structured `learning_events` for milestones. Wired for operator rollout per product configuration.  
- **Doc trail**: Dated build notes in [UPDATES.md](../UPDATES.md) (e.g. 2026-04-15, 2026-04-17).

---

## Notification sounds — Chime-style in-app chimes (Learn + Studio)

- **Where**: Sudar Learn — **Settings → Notification controls** (`/settings/notifications`); in-tab chimes across course learn, tutor chat, notification toasts, and gamification toasts. Sudar Studio — **New course** generation UI (AI / document / SCORM paths).
- **What**: Optional subtle WAV chimes when tasks complete (AI generation, Sudar tutor reply, notification toast, level-up/achievement). Master toggle off by default; volume slider; four event-group toggles; respects learner quiet hours and `prefers-reduced-motion`. Studio stores sound prefs in `localStorage` for course-ready chime (independent of OS browser notifications).
- **Key files**:
  - `shared/notifications/sound.ts` — `playSudarChime`, `shouldPlaySound`, category → sound group mapping.
  - `shared/notifications/quietHours.ts` — shared quiet-hours helper (also used by notification engine).
  - `sudar-learn/src/components/features/notifications/NotificationSoundProvider.tsx` — loads prefs, exposes `playChime`.
  - `sudar-learn/src/app/api/learner/notification-settings/route.ts` — GET/PATCH sound fields.
  - `sudar-learn/public/audio/notifications/*.wav` — generated via `scripts/generate-notification-sounds.mjs`.
  - `sudar-studio/src/hooks/useBrowserCompletionNotification.ts` — Studio chime + browser notification on course ready.
- **Database**: `supabase/migrations/20260522120000_notification_sound_settings.sql` — columns on `user_notification_settings` (`sound_enabled`, `sound_volume`, `sound_task_complete`, `sound_sudar_reply`, `sound_notifications`, `sound_celebration`).
- **Flow**: Learner enables sounds on notification settings → preview chimes → generation/tutor/notification events call `playChime` when prefs allow → Studio creator enables “Play a chime when the course is ready” on new-course flow → chime on successful generation (optional OS notification unchanged).

---

## Global search (Learn)

- **Where**: Learner dashboard app — `/search`.  
- **What**: Search entry point for courses/paths content discovery (implementation under `sudar-learn/src/app/(dashboard)/search/`).

---

## Sensitive input guard (Studio + Learn)

- **Where**: Server-side paths that accept free text toward AI or logs.  
- **What**: Shared guard utilities to reduce high-risk patterns (e.g. secrets/sensitive payloads) before model calls; Studio: `sudar-studio/src/lib/security/sensitiveInputGuard.ts`; Learn: `sudar-learn/src/lib/security/sensitiveInputGuard.ts`.

---

## Localization and multilingual delivery (Learn + Studio + Intelligence)

- **Where**: Sudar Learn — root layout + Memory preferences + tutor/audio APIs; Sudar Studio — root layout + **Org settings** → Localization; Sudar Intelligence — audio/content/image routes.
- **What**: Cookie-driven UI locale (`NEXT_LOCALE`) with 30+ message catalogs; learner prefs `ui_language`, `content_language`, `auto_detect_language` (JSONB) and column `preferred_language`; org-level **default UI locale** for learners who have not customised (`organisations.settings.localization`); multilingual TTS (Edge voices + Sarvam language code); tutor/proactive prompts respect content language; optional **Together** image generation for catalog-style course art (Studio AI create + Learn proxy).
- **Key files**: `shared/i18nLocales.ts`; `sudar-learn/src/i18n/*`, `sudar-learn/src/messages/*.json`, `sudar-learn/src/components/settings/LanguageSelector.tsx`, `sudar-learn/src/app/api/learner/preferences/route.ts`, `sudar-learn/src/app/api/ai/generate-audio/route.ts`, `sudar-learn/src/app/api/ai/generate-image/route.ts`; `sudar-studio/src/i18n/*`, `sudar-studio/src/components/settings/StudioLocalizationCard.tsx`, `sudar-studio/src/app/api/org/settings/route.ts`, `sudar-studio/src/lib/intelligence/courseCoverFromTogether.ts`; `sudar-intelligence/src/api/routes/audio.py`, `content.py`, `image.py`.
- **Env**: `TOGETHER_API_KEY` on Intelligence for `/api/image/generate` (optional); existing `SUDAR_INTELLIGENCE_URL` / `INTELLIGENCE_SERVICE_SECRET` for proxies.
- **Flow**: Learner sets languages on Memory → cookie + prefs persist → UI strings and tutor/TTS follow; admin sets org learner default in Studio → Learn preferences API merges org default when learner UI unset; AI course creation may upload generated cover to `course-media` when Together returns `b64_json`.

---

## Tutor memory LLM cadence (Learn + Studio)

- **Where**: Sudar Learn — **My Memory** → Learning preferences (`memory_digest_*`, `tutor_memory_llm_cadence`, `memory_digest_cadence_days` in `learner_profiles.learner_preferences`); Sudar Studio — **Org settings** → *AI personalization & privacy* → *Tutor memory — LLM learning cadence* (`organisations.settings.ai_compliance`: `tutor_llm_memory_extraction_policy`, `tutor_llm_memory_min_interval_hours`, `memory_digest_min_interval_days_org`).
- **What**: Learners throttle or turn off LLM-driven profile inference from tutor chat; orgs can disable LLM memory updates entirely or set minimum-interval floors. Digest cron honours learner digest-day spacing and org floors.
- **Key files**: `sudar-learn/src/lib/learner/tutorMemoryCadence.ts`, `sudar-learn/src/lib/learner/learnerPreferences.ts`, `sudar-learn/src/app/api/tutor/query/route.ts`, `sudar-learn/src/app/api/cron/consolidate-learner-memory/route.ts`, `sudar-learn/src/app/(dashboard)/memory/LearningPreferencesPanel.tsx`, `sudar-studio/src/app/(dashboard)/settings/page.tsx`, `sudar-studio/src/types/orgCompliance.ts`.
- **Flow**: Learner sets cadence on Memory page → each tutor completion evaluates policy → optional `updateLearnerMemory` → nightly digest cron evaluates digest eligibility per user.

---

## Sudar MCP servers (Integrations + Learn + Studio + ChatGPT)

- **Where**: Sudar Studio → **Integrations** → *Connect via MCP* / *ChatGPT*; `https://mcp.thesudar.app/mcp` (production); repo `packages/sudar-mcp` (`@sudar/mcp-server` v0.2+).
- **What**: MCP adapter for **Cursor** (stdio), **ChatGPT/Claude** (Cloudflare remote OAuth + Streamable HTTP), and LMS integrators (ALP). Toolsets: **integrator** (ALP), **creator** (Studio course AI), **admin** (cohort pulse), **learner** (tutor, NBA, agents).
- **Key files**:
  - `docs/MCP_SERVERS.md`, `docs/MCP_CHATGPT_LAUNCH.md`, `docs/DEPLOY_THESUDAR_APP.md`, `docs/DNS_THESUDAR_APP.md`
  - `packages/sudar-mcp/src/tools/creator.ts` — Studio generation tools
  - `workers/sudar-mcp-cloudflare/` — production remote MCP (OAuth + `/mcp`)
  - `workers/sudar-mcp-remote/` — dev Express remote (API-key token)
  - `sudar-studio/src/lib/auth/requestSession.ts` — Bearer on Studio creator routes
  - `sudar-studio/src/app/api/mcp/audit/route.ts`, `sudar-learn/.../mcp/audit/route.ts`
  - `openapi/sudar-creator-v1.json` — Custom GPT Actions fallback
- **Env**: `NEXT_PUBLIC_MCP_URL`, `SUDAR_*`, Wrangler secrets — [ENV_REFERENCE.md](ENV_REFERENCE.md).
- **Flow**: Deploy thesudar.app → deploy Cloudflare MCP worker → register ChatGPT connector → user signs in with Sudar → ChatGPT calls `sudar_generate_outline` etc. on Studio.

---

## Cinematic product launch demo (standalone app)

- **Where**: [`sudar-ecosystem-demo/`](../sudar-ecosystem-demo/) — `/` on port **3003**; teachwithsudar **Demo** page and [docs/demo.md](demo.md).
- **What**: Full-screen video-like launch story (**~5 min**): title cards, typography overlays, animated cursor. Narrative covers **content generation** (document, idea/prompt, business need, cohort, learner context), **instructional design** (Bloom, objectives, archetypes), **live block authoring** (video, audio, accordion, flipcards, quiz), **cohort + individual personalization**, and **contextual tutor** (screen-aware proactive message + learner typed reply). Demo course: **Somehow I manage** (Office-themed prompt). Learn wireframes use purple/light chrome; Studio uses dark editor chrome.
- **Key files**:
  - `sudar-ecosystem-demo/src/data/launchDemo.ts` — `CinematicFrame` sequence (title-card + scene patches).
  - `sudar-ecosystem-demo/src/components/wireframes/DemoScenesExtended.tsx`, `CourseBlockCanvas.tsx`, `TutorConversationPanel.tsx`, `LearnNavChrome.tsx`, `BloomBlueprintStrip.tsx`.
  - `sudar-ecosystem-demo/public/characters/prison-mike.png` — course video placeholder.
  - `sudar-ecosystem-demo/src/components/cinematic/CinematicPlayer.tsx` — player shell.
- **Flow**: Problem → Sudar vision → Sarah (sources → blueprint → block build → publish) → personalization → Marcus (Watch → stuck → interact → tutor → memory) → certification → ALP/MCP → tagline.

## Interactive ecosystem how-to tour (same app)

- **Where**: `sudar-ecosystem-demo/interactive` — for teachwithsudar **Guides** and help how-tos.
- **What**: Step-by-step wireframe tour with scrub, chapter jump, and speed — chapters aligned with launch story (Content generation, Live editor blocks, Tutor, Memory, etc.).
- **Key files**: `ecosystemDemo.ts`, `EcosystemDemoPlayer.tsx`, `TransportBar.tsx`.
- **Env**: `NEXT_PUBLIC_ECOSYSTEM_DEMO_URL` on teachwithsudar when deployed (e.g. `https://demo.thesudar.app`).

---

*Last updated: May 2026 (ecosystem wireframe demo + MCP + localization). For roadmap and next priorities, see [STRATEGIC_PATH.md](STRATEGIC_PATH.md) and [ACTION_PLANS.md](ACTION_PLANS.md).*
