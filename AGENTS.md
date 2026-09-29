# Sudar — AI Agent Instructions
## For: Cursor, GitHub Copilot, Devin, and all AI coding agents

> **READ THIS BEFORE WRITING A SINGLE LINE OF CODE.**
> This file exists so that every AI agent working on Sudar understands exactly what it is,
> why it exists, and how to build it correctly. The context here is not optional — it is the
> architectural contract you must follow.

> **Naming:** This **`AGENTS.md`** is for **coding agents** (Cursor, Copilot, etc.). The **product** feature **Sudar Agents** (bounded AI orchestration, audit trail, Intelligence gateway) is documented in **`docs/AGENTS_PLATFORM.md`**.

> **Ship memory (coding agents):** If the work is **user-visible** or **operator-facing** (Learn/Studio surfaces, public or cron APIs, env vars, migrations deployers run), do **not** consider the task finished until you have applied **[docs/SHIP_MEMORY_PLAYBOOK.md](docs/SHIP_MEMORY_PLAYBOOK.md)** — update **[UPDATES.md](UPDATES.md)** and/or **[docs/SHIPPED_FEATURES.md](docs/SHIPPED_FEATURES.md)** in the **same PR as the code** unless the user explicitly defers documentation. In Cursor, the always-on rule lives at `.cursor/rules/sudar-ship-memory.mdc`.

---

## Cursor: Agent mode vs Plan mode

- **Implementing code** (TypeScript, TSX, Python, config, etc.): use **Agent mode** in Cursor so the assistant can apply edits with the normal patch tools.
- **Plan mode** is for planning only: it blocks edits to non-markdown files, which forces fragile workarounds (shell one-liners) and is easy to miss.
- When the user asks to **execute**, **implement**, or **ship** a plan, work in **Agent mode**, not Plan mode.

---

## What Is Sudar?

Sudar is an AI-native Learning Operating System. It is NOT:
- Just another LMS (like Moodle, Canvas, Blackboard)
- Just another eLearning authoring tool (like Rise360, Articulate Storyline, Adobe Captivate)
- Just another AI chatbot bolted onto a course platform

Sudar IS:
- A platform where the AI *learns the learner* over time and adapts everything to them
- A democratized alternative to expensive authoring tools — anyone can build world-class training
- An integrated system where content is authored ONCE and delivered in ANY modality (text, video,
  audio, game, mindmap, flashcards, TikTok-style feed)
- Built for L&D teams at companies who need to train employees without hiring an army of
  instructional designers, video producers, and graphic designers

**Mission**: "Learns with you, for you."
**Primary user**: L&D managers and corporate training administrators
**Secondary user**: Learners within those organizations

---

## Branding & Repositories (Important)

- **Product name is Sudar.** The project started as ByteOS but has been **rebranded to Sudar**. All focus, docs, and communication use **Sudar** — not ByteOS.
- **Canonical repo**: **https://github.com/Dhanikesh-Karunanithi/Sudar** (official account). This is the main, public repo. Push default is to this repo.
- **ByteOS repo** (lorddannykay/ByteOS) is **legacy** and will be made private; it has no major purpose going forward. Do not treat it as the primary target or confuse it with Sudar.
- Folder names in this codebase (`sudar-studio`, `sudar-learn`, etc.) are **legacy directory names**; the product and all user-facing references are **Sudar** (Sudar Studio, Sudar Learn, Sudar Intelligence).

---

## Project Structure (Always Check ECOSYSTEM.md First)

```
Sudar/  (repo: Dhanikesh-Karunanithi/Sudar)
├── ECOSYSTEM.md              ← Architecture + schema (read with UPDATES.md / SHIPPED_FEATURES)
├── AGENTS.md                 ← This file
├── .cursorrules              ← Coding rules
├── docs/                     ← Planning, trust, ALP, ship memory
├── shared/                   ← Shared TS (access, AI, sudarsim schemas, CSP, …)
├── supabase/migrations/      ← Canonical schema (not Prisma runtime)
├── help-center/              ← Help articles + AI knowledge sync into Studio/Learn
├── sudar-studio/             ← Sudar Studio (Admin/creator, Next.js 15)
├── sudar-learn/              ← Sudar Learn (Learner, Next.js 15)
├── sudar-intelligence/       ← Sudar Intelligence (Python FastAPI)
├── sudar_vid/                ← SudarVid (Watch modality video)
├── sudar-sim/                ← SudarSim voice service (LiveKit / Pipecat)
├── packages/sudar-mcp/       ← MCP server package
├── workers/                  ← Cloudflare MCP, cron, staging DNS
├── integrations/             ← Moodle / Canvas / ALP SDK (ship channel)
└── teachwithsudar/           ← Marketing / gateway site
```

**Status truth order:** [UPDATES.md](UPDATES.md) Latest → [docs/SHIPPED_FEATURES.md](docs/SHIPPED_FEATURES.md) → code → then this file / ECOSYSTEM.md.

**Project memory for agents:** [docs/memory/](docs/memory/README.md): decision log (`DECISIONS.md`), glossary, feature map (routes/tables/flags/tests per feature), known gaps, and lessons mined from past chats (`LEARNED_FROM_CHATS.md`). Scoped rules live in `.cursor/rules/`: `sharp-edges.mdc` (always on), plus `learn.mdc`, `studio.mdc`, `intelligence.mdc`, `migrations.mdc` and `content-generation.mdc`. Docs index: [docs/README.md](docs/README.md).

---

## The Three Apps — Know Which One You're In

### 1. Sudar Studio (`/sudar-studio`)
**Who uses it**: Admins, L&D managers, content creators
**What it does**: Course creation, learning path management, analytics, org settings, Domains (Teaching OS), SudarSim scenarios, MCP OAuth handoff
**Stack**: Next.js 15, TypeScript, Tailwind CSS, Supabase (`@supabase/ssr` + service-role). Prisma may remain as a leftover dependency/schema file — **runtime DB access is Supabase**, canonical DDL in `supabase/migrations/`
**Port**: 3000
**Key files**:
- `app/` — Next.js App Router pages
- `lib/ai/` — AI provider integrations (OpenRouter / Together / OpenAI / Anthropic + org BYOM / Sudar AI)
- `lib/themes/learningPersonas.ts` — **5** learning personas (visual themes), not 14 templates
- `lib/courseTemplates.ts` — module starter blueprints (structural, not visual skins)
- `lib/rag/` — document-based generation / RAG helpers where present

### 2. Sudar Learn (`/sudar-learn`)
**Who uses it**: Learners
**What it does**: Take courses, interact with AI tutor "Sudar", track progress, switch modalities; optional **SudarNotes** conversational learning; SudarSim sessions
**Stack**: Next.js 15, TypeScript, Tailwind CSS, Supabase, Framer Motion, Zustand (same Supabase note as Studio — no Prisma runtime)
**Port**: 3001
**Key files**:
- `app/` — Next.js App Router pages
- `app/(dashboard)/journey/` — **SudarNotes** (`/journey`; flag `NEXT_PUBLIC_SUDAR_JOURNEY`)
- `app/(dashboard)/courses/[id]/learn/` — course viewer modalities (text, listen, watch, map, cards, optional sim)
- `components/tutor/` — AI Tutor "Sudar" sidebar / docked chat
- `components/journey/` — SudarNotes notebook + workspace
- `components/sudarsim/` — Sim workspace / voice shell
- `lib/sudarNotes/` — turn contract + adapter to Teaching OS pedagogy
- `lib/teaching/` — Teaching OS claim graph, mastery, scheduler, pedagogy engine
- `lib/intelligence/nextBestActionEngine.ts` — **canonical NBA** (not only an HTTP client)

**SudarNotes** — Conversational learning surface: living notebook + pedagogical tutor modes (intake → socratic / teach / check / replan / note_craft). Coexists with course Learn; does **not** replace authored courses. It is a **client of the Teaching OS spine** (shared claims/mastery), not a separate architecture. Docs: [docs/SUDAR_2_0_VISION.md](docs/SUDAR_2_0_VISION.md), [docs/TEACHING_OS.md](docs/TEACHING_OS.md).

### 3. Sudar Intelligence (`/sudar-intelligence`)
**Who uses it**: Called by sudar-learn and sudar-studio via HTTP
**What it does**: Tutor/TTS/generation helpers, Sudar Agents gateway, SudarSim STT/TTS coach, SudarPlay stubs — **NBA and twin rollups are owned by Learn**
**Stack**: Python 3.11+, FastAPI, multi-provider AI client, Supabase Python client
**Port**: typically **8001** in local dev when SudarVid uses **8000** (`scripts/dev-with-sudarvid.mjs`); set `SUDAR_INTELLIGENCE_URL` / `BYTEOS_INTELLIGENCE_URL` accordingly
**Key files**:
- `src/api/` — FastAPI route handlers (`tutor`, `audio`, `sim`, `agents`, `content`, …)
- `src/core/` — `ai_client.py`, TTS/STT helpers
- `src/agents/` — Sudar Agents orchestration
- `src/sudarplay/` — SudarPlay launch/events (partial)
- There is **no** `src/adaptive/`, `src/tutor/`, or `src/generation/` package tree — those AGENTS paths were stale

### Adjacent product services
- **`sudar_vid/`** — Watch modality video pipeline
- **`sudar-sim/`** — LiveKit/Pipecat voice roleplay; Learn BFF at `/api/sim/*`
- **`packages/sudar-mcp` + `workers/sudar-mcp-cloudflare`** — MCP for ChatGPT/Cursor (`mcp.thesudar.com`)
- **`integrations/moodle`** — ALP Moodle plugins calling Learn `/api/alp/*`
- **`teachwithsudar/`** — public marketing site (Cloudflare Pages)
---

## Shared Supabase Database

**CRITICAL**: Both `sudar-studio` and `sudar-learn` connect to the **SAME Supabase project**.
This is what enables content to flow from Studio to Learn and events to flow back.

The schema is defined in `ECOSYSTEM.md` Section 5. The most important tables:
- `profiles` — user identity (extends Supabase Auth)
- `organisations` — companies/institutions
- `learner_profiles` — the Digital Learner Twin (preferences, scores, history)
- `courses` + `modules` — all course content
- `learning_events` — every learner interaction (telemetry)
- `ai_interactions` — every AI tutor exchange (enables longitudinal memory)
- `enrollments` — learner ↔ course/path assignments
- Teaching OS: `learning_domains`, `learning_claims`, `learner_claim_mastery`, `learning_sessions`
- SudarNotes: `sudar_notes_sessions` (pedagogical session state per user/thread)

---

## The AI Tutor — "Sudar"

The AI tutor is named **"Sudar"**. When writing UI copy, error messages, or tutor responses,
always refer to the tutor as "Sudar". Sudar is:
- **Reactive**: Answers questions the learner asks about the course content
- **Proactive**: Notices when a learner is struggling (long pause, replay, low quiz score)
  and offers help WITHOUT being asked
- **Longitudinal**: Remembers previous interactions across sessions via `ai_interactions` table
- **Non-judgmental**: Never criticizes the learner. Always encouraging and constructive.
- **Concise**: Responses are brief (under 150 words) unless the learner asks for more

Sudar's personality: Friendly, knowledgeable, patient. Like a brilliant study buddy.
Sudar's tone: Conversational, not academic. Uses simple language. Avoids jargon.

---

## The Digital Learner Twin

This is the core innovation of Sudar. Every learner has a `learner_profile` record in Supabase
that accumulates signals over time:

- **Modality scores** (0.0 to 1.0): How well the learner engages with each modality
- **Behavioral signals**: Session duration, completion rate, replay rate, drop-off patterns
- **Skill graph**: What they know, what gaps exist
- **Next Best Action**: AI-computed recommendation for what to do next (computed primarily in **Learn** today; Intelligence may be called for tutor/TTS and related tasks)

The Digital Learner Twin is NEVER shown in raw form to the learner.
Instead, it silently powers ALL personalization decisions behind the scenes.

---

## Coding Standards for This Project

### TypeScript (Next.js apps)
- Always use TypeScript strict mode
- Define types in `types/` folder, not inline
- Use `zod` for runtime validation of API payloads
- Use Server Components by default; only use `"use client"` when necessary
- API routes go in `app/api/` using the App Router convention
- Use `@/` path alias for imports from project root
- Tailwind for ALL styling — no inline styles, no CSS modules (except for complex animations)

### Python (FastAPI)
- Python 3.11+
- Use Pydantic v2 models for all request/response schemas
- Async handlers everywhere (`async def`)
- Use `supabase-py` for all database operations
- Environment variables via `python-dotenv`
- All AI calls wrapped in try/except with fallback providers

### General
- No hardcoded strings for user-facing copy — use constants files
- No hardcoded API keys — always from environment variables
- All Supabase queries must use the service role key on the server, anon key on the client
- Console.log and print statements must be removed before committing
- All new features must write to `learning_events` so the adaptive engine can learn from them

---

## Component Naming Conventions

- Pages: `PascalCase` (e.g. `LearnerDashboard.tsx`)
- Components: `PascalCase` (e.g. `AITutorSidebar.tsx`)
- Utility functions: `camelCase` (e.g. `computeNextBestAction.ts`)
- API routes: `kebab-case` folders (e.g. `app/api/learner-profile/route.ts`)
- Supabase table names: `snake_case` (e.g. `learner_profiles`)
- Environment variables: `SCREAMING_SNAKE_CASE` (e.g. `BYTEOS_INTELLIGENCE_URL`)

---

## DO NOT Do These Things

- Do NOT create a new database (the Supabase schema in ECOSYSTEM.md is canonical)
- Do NOT add new AI providers without updating ECOSYSTEM.md
- Do NOT use `localStorage` for anything sensitive (auth tokens, user data)
- Do NOT hardcode organization IDs, user IDs, or course IDs in any logic
- Do NOT create new npm packages/pip packages without a clear reason
- Do NOT rename "Sudar" (the AI tutor) to anything else
- Do NOT refer to the platform as "ByteOS", "ByteLab", "ByteVerse", or any old name — it is **Sudar**. (ByteOS was the original name; the project is rebranded to Sudar; only the Sudar repo and branding are used going forward.)
- Do NOT break the separation between Studio (admin) and Learn (learner) surfaces
- Do NOT store AI model responses in a way that can't be updated when models improve

---

## When Building a New Feature, Always Ask:

1. Which surface does this belong to — Studio (admin) or Learn (learner)?
2. What Supabase tables does this read from and write to?
3. Does this generate a `learning_events` record? (it usually should)
4. Does this update the `learner_profiles` Digital Learner Twin?
5. Is there a modality-agnostic version of this feature? (content should work across all modalities)
6. Does this work on mobile? (learner surface is mobile-first)
7. If this is user-visible or operator-facing: have I updated **ship memory** per **[docs/SHIP_MEMORY_PLAYBOOK.md](docs/SHIP_MEMORY_PLAYBOOK.md)** (**[UPDATES.md](UPDATES.md)** / **[docs/SHIPPED_FEATURES.md](docs/SHIPPED_FEATURES.md)**) in the same PR?

---

## Project memory (shipped features)

After shipping **user-visible** or **operator-facing** work (new surfaces, APIs, env, migrations), keep the repo’s story accurate. **Coding agents:** treat this as mandatory unless the user explicitly skips docs for this task.

1. Follow **[docs/SHIP_MEMORY_PLAYBOOK.md](docs/SHIP_MEMORY_PLAYBOOK.md)** — when to update **[UPDATES.md](UPDATES.md)** vs **[docs/SHIPPED_FEATURES.md](docs/SHIPPED_FEATURES.md)**.
2. Prefer updating those docs **in the same PR** as the code; use a tiny follow-up PR if necessary.
3. Keep **Current Build Status** below aligned with reality: either refresh the short “Recent ship” bullets or point readers to the newest **Latest** entry in `UPDATES.md`.

Pull requests use **[.github/pull_request_template.md](.github/pull_request_template.md)** so impact, paths, and doc checkboxes stay structured for humans and agents.

---

## Current Build Status

**Phase**: Phases 1–4 complete; Phase 5 (Engagement & Scale) partially in motion. Teaching OS, SudarNotes, SudarSim, MCP (ChatGPT/Cursor) shipped — see **UPDATES.md** Latest.
**Priority**: Security/RLS policy tighten (see [docs/RLS_RAG_BEARER_SUBPLAN.md](docs/RLS_RAG_BEARER_SUBPLAN.md)); visibility (demo/screenshots); Teaching OS loop on seeded domains; enterprise packaging later.
**Production frontends**: Studio + Learn on **Cloudflare Workers (OpenNext)** — [docs/CLOUDFLARE_PAGES_DEPLOY.md](docs/CLOUDFLARE_PAGES_DEPLOY.md). Staging may still use Vercel. Intelligence/Vid/Sim/MCP workers are manual/ops deploy today.

**Recent ship**: MCP OAuth + course build tools; SudarSim voice; SudarNotes; Teaching OS; Personalization v2; trust pack. See **UPDATES.md** (Latest) and **docs/SHIPPED_FEATURES.md**. Structural cleanup board: [docs/STRUCTURAL_CLEANUP_AUDIT.md](docs/STRUCTURAL_CLEANUP_AUDIT.md).

For up-to-date state and next priorities, see **docs/STRATEGIC_PATH.md** and **docs/ACTION_PLANS.md**.
See `ECOSYSTEM.md` Section 8 for the full build roadmap with checkboxes.

**For LAMP/ALP work (plugin layer, Moodle connector, paper)**: Use the **build-first** plan: **docs/LAMP_BUILD_PLAN.md**. After completing any task, update **docs/LAMP_BUILD_TRACKER.md** (set Status to Done, update Last updated). Stay grounded in ECOSYSTEM.md and this file.

---

*Sudar — Learns with you, for you.*
*This agent context file is maintained by the project owner.*
*Last updated: 15 September 2026*
