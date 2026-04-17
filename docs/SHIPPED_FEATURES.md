# Sudar — Shipped Features (Documentation)

This document summarizes **shipped** features that are committed and ready for use. For current state and gaps, see [STRATEGIC_PATH.md](STRATEGIC_PATH.md) §2.

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

## Global search (Learn)

- **Where**: Learner dashboard app — `/search`.  
- **What**: Search entry point for courses/paths content discovery (implementation under `sudar-learn/src/app/(dashboard)/search/`).

---

## Sensitive input guard (Studio + Learn)

- **Where**: Server-side paths that accept free text toward AI or logs.  
- **What**: Shared guard utilities to reduce high-risk patterns (e.g. secrets/sensitive payloads) before model calls; Studio: `sudar-studio/src/lib/security/sensitiveInputGuard.ts`; Learn: `sudar-learn/src/lib/security/sensitiveInputGuard.ts`.

---

*Last updated: April 2026 (proactive Sudar + tap-to-reply chips). For roadmap and next priorities, see [STRATEGIC_PATH.md](STRATEGIC_PATH.md) and [ACTION_PLANS.md](ACTION_PLANS.md).*
