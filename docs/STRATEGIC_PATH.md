# Sudar — Strategic Path to the Ultimate Goal

**Document purpose**: Align all development toward the single vision and provide a clear, executable roadmap.  
**Ultimate goal**: *Sudar is the world's first AI-native Learning Operating System that learns the learner and adapts modality, pace, difficulty, and content in real time.*  
**Tagline**: *Learns with you, for you.*

---

## 1. Vision Alignment — How Every Development Ladders Up

| Strategic pillar | What it means | How we measure progress |
|------------------|---------------|--------------------------|
| **Learns the learner** | Sudar and the platform accumulate signals (goals, struggles, preferences, behavior) and use them to personalize content, order, and recommendations. | Learner profile richness, next best action accuracy, adaptive path ordering, tutor memory usage. |
| **Author once, deliver any modality** | Content is authored once in Studio; Learn can present it as text, video, audio, mindmap, flashcards, feed, or game. | Number of modalities live, content reuse across modalities, learner modality switches. |
| **Democratize creation** | L&D can build world-class training without armies of designers; AI and simple UX do the heavy lifting. | Time-to-course, source inputs (doc/URL/prompt), template usage, zero-code flows. |
| **Outcomes and compliance** | Organizations see completions, skill gaps, and risk; mandatory training and certifications are tracked and attested. | Analytics usage, path assignments, due dates, certificates, compliance views. |

Every new feature or fix should map to at least one of these pillars. If it doesn’t, defer it.

---

## 2. Current State (As of This Document)

**Done and live**  
- **Foundation**: Supabase schema, shared auth, Studio + Learn scaffold, env contracts.  
- **Integration**: Course CRUD, publish → Learn, enrollments, learning_events, progress.  
- **Learner experience**: Personalized dashboard (streak, time, engagement, Sudar recommends) with DashboardSidebar, TopNav, ActivityChart, ProgressPieChart, PathNodeGraph; CourseThemeProvider and learning personas. Course viewer with markdown, quizzes; SCORM delivery (proxy for SCORM package assets from Supabase Storage with correct MIME types for iframe playback). AI tutor Sudar: RAG in Learn (content_chunks + pgvector 1024, ingest API, embed/retrieve/cache); Floating Sudar Chat (global), startup questions, paste context; longitudinal memory (ai_interactions + ai_tutor_context); structured tutor responses (blocks/actions: enroll, continue, review); validate-memory quick preferences (response length, modality); tutor workflow API (summarize, extract_terms); outcome logging (tutor_action_taken); My Memory page and memory insights (InsightsCarousel). Onboarding assessment, text selection → Sudar. Change password flow when require_password_change is set (e.g. after admin reset).  
- **Intelligence**: Next best action engine, onboarding bootstrap, learner_profiles + ai_tutor_context, struggle detection from quizzes, adaptive path ordering (optional courses reordered by Sudar). Tutor outcome logging so the system learns from suggestions.  
- **Paths & certs**: Learning paths (Studio: create/edit, mandatory/adaptive/certificate toggles; Learn: enroll, personalised sequence, progress sync), path unlock rules (complete previous first), certifications on path completion with shareable public link.  
- **Studio analytics**: Org-level analytics (completions, quiz scores, struggle topics); **Time per section** — per-course view of learner time per module with active vs idle time, “possible skip” and “over time” flags.
- **Progress**: Dedicated Progress page (courses, paths, certificates), path progress % sync on course complete.
- **Completion rules (Studio + Learn)**: Admins can set per-module completion rule: “Learner marks complete” (default) or “Minimum time on section” (minutes). Learn enforces minimum active time (tab visible) before the Mark complete button is enabled; time tracking uses Page Visibility API so idle time is excluded.

**Recently added (Action Plans A–C)**  
- **Creator velocity**: Assign path to learners from Studio path editor (org members list + optional due date); “Assigned learners” table with progress and due date.  
- **Learner polish**: Certificate page has reliable “Print / Save as PDF” (client component + print CSS); Learn dashboard shows “Upcoming deadlines” and “Required by your organisation” when relevant.  
- **Compliance**: Studio “Compliance” page lists path assignments with due date, progress, and status (Overdue / At risk / On track / Completed); Learn dashboard surfaces required paths and due-soon items.

**Built and documented (shipped)** — see [docs/SHIPPED_FEATURES.md](SHIPPED_FEATURES.md) for details.  
- **Flashcards modality**: FlashcardsCard in Learn course viewer; generate-flashcards API.  
- **Document-to-course**: Studio generate-from-document API (PDF/DOCX/URL → course outline + modules).  
- **SCORM 1.2 import**: Studio import-scorm API (ZIP → courses + modules).  
- **Listen (Audio TTS) modality**: Listen tab in Learn course viewer; AudioCard + generate-audio API (proxies to Intelligence or returns use_browser_tts).  
- **Compliance email reminders**: Studio cron endpoint `POST /api/cron/compliance-reminders` (CRON_SECRET, RESEND_API_KEY); at-risk/overdue path assignments.  
- **RAG (Learn)**: content_chunks, ingest API, tutor uses it for course search.  
- **Floating Sudar Chat**, structured tutor responses, outcome logging, validate-memory quick preferences, memory insights, SCORM delivery proxy, change-password flow (see UPDATES.md 2026-03-08).

**Remaining gaps vs. ultimate goal**  
- **Modality**: Text, Flashcards, and Listen (Audio TTS) live; Video/Podcast/MindMap use pre-generated or on-demand content; SudarFeed/SudarPlay still placeholders.  
- **Polish**: No server-generated certificate PDF.  
- **Scale**: No white-label, SSO, or HRIS hooks yet (explicitly later phase).

---

## 3. Prioritized Next Developments (In Order)

**Next 3 (concrete outcomes)** — update after each milestone:
1. **Visibility**: Record Sudar memory demo video (1–2 min); add 2–4 screenshots to docs/screenshots and link from README.
2. ~~**Ship recent work**: Commit and document Flashcards, document-to-course, SCORM 1.2 import; update current state in Section 2.~~ **Done** — see docs/SHIPPED_FEATURES.md and §2 above.
3. ~~**One more win**: Ship Audio TTS (Listen tab) and document compliance email reminders.~~ **Done** — Listen modality + compliance-reminders cron documented.
4. **Production deployment documented**: Studio and Learn deploy to Vercel; Intelligence deploys to Railway, Render, or Fly.io. See docs/VERCEL_DEPLOYMENT.md and docs/INTELLIGENCE_DEPLOYMENT.md.

**Pending phases (from ECOSYSTEM §8)**  
- **Phase 3 remaining**: Video modality (wire to bytetexttovid / Remotion).  
- **Phase 5 — Engagement & Scale**: SudarPlay, SudarFeed, SudarMind modalities; white-label per org; HRIS integration hooks.  
- **Compliance**: Email reminders shipped (cron endpoint; see SHIPPED_FEATURES.md).  
- **Polish**: Server-generated certificate PDF.

---

Priorities are chosen to maximise progress toward the four pillars without overbuilding.

1. **Creator velocity (Studio)**  
   - Assign learning path to learners (and optionally set due date).  
   - Show due dates and “at-risk” on Analytics or a simple compliance view.  
   - *Why first*: Drives real usage of paths and certifications; aligns with “outcomes and compliance”.

2. **Learner polish (Learn)**  
   - Certificate page: reliable “Print / Save as PDF” (browser print + optional instructions).  
   - Dashboard/Progress: surface “Upcoming deadlines” when enrollments have due_date.  
   - *Why second*: Improves perceived quality and urgency without new backend services.

3. **Compliance & visibility (Studio + Learn)**  
   - Studio: Compliance view — list path/course enrollments with due_date, status (on track / at-risk / overdue).  
   - Learn: “Required” or “Due soon” on dashboard for assigned paths/courses with due dates.  
   - *Why third*: Makes “outcomes and compliance” visible and actionable.

4. **Second modality (Learn)**  
   - Ship one non-text modality end-to-end (e.g. Flashcards from module content or Audio TTS for current module).  
   - *Why fourth*: Proves “author once, deliver any modality” with minimal scope.

5. **Document/URL import (Studio)**  
   - Upload PDF/DOCX or paste URL; extract text; optional RAG for course generation.  
   - *Why fifth*: Big win for “democratize creation” but larger scope; after core flows are solid.

5b. **SCORM & format import (Studio)**  
   - Upload SCORM 1.2 packages (ZIP); parse imsmanifest.xml and assets; map to Sudar courses/modules. Other formats (xAPI, HTML bundle) as follow-on.  
   - *Why after document import*: Enables reuse of existing content from other authoring tools/LMS; SCORM import is non-trivial (ZIP, manifest, asset resolution).

6. **Further modalities and scale**  
   - SudarPlay, SudarFeed, SudarMind, then white-label/SSO/HRIS as in ECOSYSTEM Phase 5.  
   - *Why last*: Higher effort and dependency; follow once 1–5 are in place.

---

## 4. Strategic Principles for Execution

- **Solo builder**: Prefer the simplest implementation that meets the pillar; avoid over-engineering.  
- **Data first**: Use existing schema (e.g. `enrollments.due_date`, `learning_paths`) before adding new tables.  
- **One surface at a time**: Finish a full flow on one app (e.g. Studio assign + due date) before spreading to the other.  
- **Agents**: Use multiple agents for independent workstreams (e.g. Studio vs Learn) when tasks are clearly scoped and non-overlapping.  
- **Definition of done**: Each task ends with “working in UI + no regressions” and, if applicable, a one-line note in CHANGELOG or this doc.

---

## 5. How This Document Is Used

- **Before starting work**: Read Section 1 (vision) and Section 3 (priorities). Confirm the task maps to a pillar and a priority.  
- **Planning**: Use `docs/ACTION_PLANS.md` for concrete tasks, owners, and order.  
- **Review**: After each sprint or plan, update Section 2 (current state) and adjust Section 3 if priorities change.  
- **Onboarding**: New contributors or agents read ECOSYSTEM.md → AGENTS.md → this file → ACTION_PLANS.md.

---

*Last updated: 2026-03-15. Production deployment (Vercel + Intelligence hosting) documented in docs/VERCEL_DEPLOYMENT.md and docs/INTELLIGENCE_DEPLOYMENT.md. Pilot (LAMP Phase 3) after build complete.*
