# ByteOS — Updates & Development Log

**Creator:** Dhanikesh "Dhani" Karunanithi · **Ecosystem:** ByteAI & ByteVerse → ByteOS

This file tracks **what we've built** (phase-wise) and **what's upcoming**. Update it at the end of each development day so every GitHub commit tells a clear story. Use the format below for new entries.

---

## How to use this file

- **When you commit**: Add a short dated entry under **Latest** with the day’s changes, then commit with a message that references the update (e.g. `Updates: path assignment + compliance view (UPDATES.md)`).
- **What we've built**: Summary of completed phases (update when a phase or major feature is done).
- **What's upcoming**: Prioritised next work (sync with [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md) and [docs/ACTION_PLANS.md](docs/ACTION_PLANS.md)).

---

## Latest (add new entries at the top)

### 2026-03-08
- **Sudar Chat (Learn)**: Floating Sudar Chat widget (global access from dashboard), startup questions, paste context, generative blocks (enroll / continue / review), outcome logging (`tutor_action_taken` to learning_events), validate-memory quick preferences (response length: one_line, detailed, concise; modality: reading, listening, video, no_video). Tutor workflow API (summarize, extract_terms) for batch workflows.
- **RAG (Learn)**: content_chunks migration (pgvector 1024), ingest API (index published courses or single course), embed/retrieve/cache libs, [RAG_SETUP_STEPS.md](byteos-learn/docs/RAG_SETUP_STEPS.md) for env, DB, and ingest.
- **Memory & insights**: Insights builder from learner profile/events/enrollments/ai_interactions, InsightsCarousel component, memory/validate-memory alignment.
- **Dashboard & paths**: DashboardSidebar, TopNav, ActivityChart, ProgressPieChart, PathNodeGraph, CourseThemeProvider and learning personas (themed learning experience).
- **Auth**: Change password flow (require_password_change after admin reset) — page, form, complete-password-change API.
- **SCORM**: SCORM asset proxy in Learn — serve SCORM package assets from Supabase Storage (course-media) with correct MIME types for iframe playback.
- **Docs/assets**: Sudar Chat logo assets (light/dark), root doc tweaks (AGENTS, CONTRIBUTING, ECOSYSTEM, GITHUB_SETUP, README, RESEARCH_FOUNDATION).

### 2026-03-02
- **Web presence**: README updated with "What makes ByteOS different" highlights (Sudar's memory, adaptive paths, compliance, open source). Updates section now references Phase 5 in progress (flashcards, document-to-course, SCORM 1.2 import).
- **Phase 5**: Flashcards modality (Learn), document-to-course (Studio generate-from-document), and SCORM 1.2 import (Studio import-scorm) documented as implemented.

### 2026-02-26
- **Learn (Memory)**: Info banner on Sudar's Memory page now uses explicit light/dark colors (amber-50/amber-950, amber-900/amber-100) so text is readable in both themes — no camouflaging when switching color mode.
- **Roadmap**: SCORM & format import added to "What's upcoming" (upload SCORM 1.2 packages, parse manifest, map to courses; other formats later). Second modality and Document/URL import remain first priorities.
- **Repo & docs**: ByteOS pushed to GitHub with README, RESEARCH_FOUNDATION, UPDATES, CONTRIBUTING, LICENSE. Creator story and problem/solution framing added; research-backed positioning for adaptive learning + learner memory.
- **Phase summary**: UPDATES.md created; phase-wise “what we’ve built” and “what’s upcoming” documented for daily commits.

### 2026-02-24 (representative)
- **Compliance & creator velocity**: Path assignment from Studio (assign learners + due date), Assigned learners table, Compliance page (overdue / at-risk / on-track). Learn: Upcoming deadlines, Required by organisation, Certificate Print/Save as PDF.
- **Progress & paths**: Progress page (courses, paths, certificates), path progress % sync on course complete, path unlock rules (complete previous first).

---

## What we've built (phase-wise)

### Phase 1 — Foundation ✅
- Supabase schema (profiles, organisations, courses, modules, enrollments, learning_events, ai_interactions, learner_profiles, learning_paths, certifications).
- Shared auth (Supabase Auth) across Studio and Learn.
- ByteOS Studio scaffold (Next.js 14): dashboard, courses CRUD, org/workspace.
- ByteOS Learn scaffold (Next.js 14): dashboard, course catalog, enrollments.
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
- **Done**: Path assignment + due dates, compliance view, certificate print, upcoming deadlines, required paths.
- **Implemented**: Flashcards modality (Learn: FlashcardsCard, generate-flashcards API); document-to-course (Studio: generate-from-document API for PDF/DOCX/URL); SCORM 1.2 import (Studio: import-scorm API). RAG in Learn (content_chunks, ingest, tutor search); Floating Sudar Chat (global); tutor workflows (summarize/extract_terms); outcome logging; validate-memory quick preferences; memory insights carousel; SCORM delivery proxy (Learn); change-password flow.
- **Upcoming**: Email reminders for at-risk/overdue, then BytePlay/ByteFeed/ByteMind, white-label, SSO/HRIS.

---

## What's upcoming (prioritised)

| Priority | Item | Notes |
|----------|------|--------|
| 1 | **Second modality** | Ship one non-text modality end-to-end (e.g. Flashcards from module content or Audio TTS). |
| 2 | **Document/URL import** | Upload PDF/DOCX or paste URL; extract text; optional RAG for course generation in Studio. |
| 3 | **SCORM & format import** | Upload SCORM 1.2 packages (ZIP), parse manifest and assets, map to ByteOS courses/modules; other formats (xAPI, HTML bundle) as follow-on. |
| 4 | **Email reminders** | Notify learners (or admins) when assignments are at-risk or overdue. |
| 5 | **Server-side certificate PDF** | Optional: generate PDF for download (in addition to browser Print). |
| 6 | **BytePlay / ByteFeed / ByteMind** | Wire game, feed, and mindmap modalities into Learn. |
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

*ByteOS — Learns with you, for you. | Updated as development progresses.*
