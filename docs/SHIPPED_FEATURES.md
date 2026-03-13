# Sudar — Shipped Features (Documentation)

This document summarizes **shipped** features that are committed and ready for use. For current state and gaps, see [STRATEGIC_PATH.md](STRATEGIC_PATH.md) §2.

---

## Flashcards modality (Learn)

- **Where**: Sudar Learn course viewer — **Cards** tab per module.
- **What**: Learners can switch from Read to **Cards** to study the current module as flashcards. Cards are generated on demand from module content via AI.
- **Key files**:
  - `byteos-learn/src/app/(dashboard)/courses/[id]/learn/FlashcardsCard.tsx` — UI component.
  - `byteos-learn/src/app/api/ai/generate-flashcards/route.ts` — API that generates cards from content + optional module title.
- **Flow**: Switch to Cards → API called with module body → cards displayed; retry available. Progress and completion rules (e.g. min time) apply as in other modalities.

---

## Document-to-course (Studio)

- **Where**: Sudar Studio — course creation from document or URL.
- **What**: Admins can upload a PDF/DOCX or paste a URL; the system extracts text and generates a course outline + modules. Optional RAG-from-docs for richer generation.
- **Key files**:
  - `byteos-studio/src/app/api/.../generate-from-document/` (or equivalent route) — accepts file upload or URL, returns outline/modules.
- **Flow**: New course or “Generate from document” → upload/paste → AI generates structure → creator can edit and publish to Learn.

---

## SCORM 1.2 import (Studio)

- **Where**: Sudar Studio — import existing SCORM packages.
- **What**: Upload a SCORM 1.2 ZIP; the system parses `imsmanifest.xml`, maps to Sudar courses/modules, and stores assets in Supabase (e.g. `course-media`). Learners can then take the course in Learn with SCORM delivery (iframe proxy).
- **Key files**:
  - `byteos-studio/src/app/api/courses/import-scorm/route.ts` — import endpoint.
  - Learn: SCORM delivery proxy for package assets (correct MIME types, iframe launch).
- **Flow**: Studio → Import SCORM → upload ZIP → course created with SCORM modules → publish → Learn shows SCORM activity per module.

---

## Listen (Audio TTS) modality (Learn)

- **Where**: Sudar Learn course viewer — **Listen** tab per module (alongside Read, Watch, Map, Cards).
- **What**: Learners can switch to **Listen** to hear the current module read aloud. Audio is generated on demand via TTS (proxies to Sudar Intelligence when configured; otherwise returns `use_browser_tts` and the UI shows “Audio not available” with retry).
- **Key files**:
  - `byteos-learn/src/app/(dashboard)/courses/[id]/learn/AudioCard.tsx` — Listen tab UI.
  - `byteos-learn/src/app/api/ai/generate-audio/route.ts` — POST with `{ text }`; returns audio blob or JSON with `use_browser_tts` when TTS is unavailable.
- **Flow**: Switch to Listen → API called with module text → audio cached per module; play/regenerate. Completion rules (e.g. min time) apply. Learner preference `tts_voice` in profile is used when calling Intelligence.

---

## Compliance email reminders (Studio)

- **Where**: Sudar Studio — cron endpoint; call via scheduler (e.g. daily).
- **What**: Sends reminder emails to learners with path assignments that are **at-risk** (due within 7 days) or **overdue**. Uses Resend for delivery.
- **Key files**:
  - `byteos-studio/src/app/api/cron/compliance-reminders/route.ts` — POST with `Authorization: Bearer <CRON_SECRET>` (or `?secret=<CRON_SECRET>`).
- **Env**: `CRON_SECRET`, `RESEND_API_KEY`, optional `RESEND_FROM` (see [ENV_REFERENCE.md](ENV_REFERENCE.md)).
- **Flow**: Cron job calls endpoint → backend finds path enrollments with `due_date` → for each learner with at-risk/overdue items, sends one email listing those items and a link to the learning dashboard.

---

*Last updated: March 2026. For roadmap and next priorities, see [STRATEGIC_PATH.md](STRATEGIC_PATH.md) and [ACTION_PLANS.md](ACTION_PLANS.md).*
