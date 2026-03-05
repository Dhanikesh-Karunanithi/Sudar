# ByteOS — AI Agent Instructions
## For: Cursor, GitHub Copilot, Devin, and all AI coding agents

> **READ THIS BEFORE WRITING A SINGLE LINE OF CODE.**
> This file exists so that every AI agent working on ByteOS understands exactly what it is,
> why it exists, and how to build it correctly. The context here is not optional — it is the
> architectural contract you must follow.

---

## What Is ByteOS?

ByteOS is an AI-native Learning Operating System. It is NOT:
- Just another LMS (like Moodle, Canvas, Blackboard)
- Just another eLearning authoring tool (like Rise360, Articulate Storyline, Adobe Captivate)
- Just another AI chatbot bolted onto a course platform

ByteOS IS:
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

## Project Structure (Always Check ECOSYSTEM.md First)

```
ByteOS/
├── ECOSYSTEM.md              ← AUTHORITATIVE CONTEXT — read this first
├── AGENTS.md                 ← This file
├── .cursorrules              ← Coding rules
├── docs/                     ← All planning documents
├── byteos-studio/            ← Admin/creator app (Next.js 14)
├── byteos-learn/             ← Learner app (Next.js 14)
├── byteos-intelligence/      ← AI engine (Python FastAPI)
├── byteos-video/             ← Video generation microservice
└── byteos-renderer/          ← Remotion MP4 renderer
```

---

## The Three Apps — Know Which One You're In

### 1. ByteOS Studio (`/byteos-studio`)
**Who uses it**: Admins, L&D managers, content creators
**What it does**: Course creation, learning path management, analytics, org settings
**Stack**: Next.js 14, TypeScript, Tailwind CSS, Prisma, Supabase
**Port**: 3000
**Key files**:
- `app/` — Next.js App Router pages
- `lib/ai/` — AI provider integrations (Together AI, OpenAI, Anthropic)
- `lib/rag/` — RAG pipeline for document-based generation
- `lib/templates/` — 14 course visual templates
- `prisma/schema.prisma` — Database schema (mirrors Supabase)

### 2. ByteOS Learn (`/byteos-learn`)
**Who uses it**: Learners
**What it does**: Take courses, interact with AI tutor "Sudar", track progress, switch modalities
**Stack**: Next.js 14, TypeScript, Tailwind CSS, Prisma, Supabase, Framer Motion, Zustand
**Port**: 3001
**Key files**:
- `app/` — Next.js App Router pages
- `components/modalities/` — Text, Video, Audio, MindMap, Flashcards, ByteFeed, BytePlay
- `components/tutor/` — AI Tutor "Sudar" sidebar
- `lib/intelligence/` — API client for byteos-intelligence

### 3. ByteOS Intelligence (`/byteos-intelligence`)
**Who uses it**: Called by byteos-learn and byteos-studio via HTTP
**What it does**: All heavy AI computation — adaptive engine, AI tutor, content generation
**Stack**: Python 3.11+, FastAPI, Together AI, Supabase Python client
**Port**: 8000
**Key files**:
- `src/api/` — FastAPI route handlers
- `src/adaptive/` — Adaptive learning engine
- `src/tutor/` — AI Tutor engine with RAG
- `src/generation/` — Content generation pipeline

---

## Shared Supabase Database

**CRITICAL**: Both `byteos-studio` and `byteos-learn` connect to the **SAME Supabase project**.
This is what enables content to flow from Studio to Learn and events to flow back.

The schema is defined in `ECOSYSTEM.md` Section 5. The most important tables:
- `profiles` — user identity (extends Supabase Auth)
- `organisations` — companies/institutions
- `learner_profiles` — the Digital Learner Twin (preferences, scores, history)
- `courses` + `modules` — all course content
- `learning_events` — every learner interaction (telemetry)
- `ai_interactions` — every AI tutor exchange (enables longitudinal memory)
- `enrollments` — learner ↔ course/path assignments

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

This is the core innovation of ByteOS. Every learner has a `learner_profile` record in Supabase
that accumulates signals over time:

- **Modality scores** (0.0 to 1.0): How well the learner engages with each modality
- **Behavioral signals**: Session duration, completion rate, replay rate, drop-off patterns
- **Skill graph**: What they know, what gaps exist
- **Next Best Action**: AI-computed recommendation for what to do next

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
- Do NOT refer to the platform as "ByteLab", "ByteVerse", or any old name — it is "ByteOS"
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

---

## Current Build Status

**Phase**: Phases 1–4 complete; Phase 5 (Engagement & Scale) not started.
**Priority**: Visibility (demo, screenshots), document/SCORM import, second modality; then further modalities and scale.

For up-to-date state and next priorities, see **docs/STRATEGIC_PATH.md** and **docs/ACTION_PLANS.md**.
See `ECOSYSTEM.md` Section 8 for the full build roadmap with checkboxes.

---

*ByteOS — Learns with you, for you.*
*This agent context file is maintained by the project owner.*
*Last updated: February 2026*
