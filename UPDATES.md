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
| 1 | **Second full modality** | Audio TTS for current module (standalone Audio tab in course viewer). Flashcards already live as embedded + generate API. |
| 2 | ~~Document/URL import~~ | ✅ Shipped — generate-from-document (PDF/DOCX/URL) in Studio. |
| 3 | ~~SCORM 1.2 import~~ | ✅ Shipped — import-scorm API in Studio. |
| 4 | **Email reminders** | Notify learners (or admins) when assignments are at-risk or overdue. |
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

*ByteOS — Learns with you, for you. | Updated as development progresses.*
