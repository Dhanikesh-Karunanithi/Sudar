# Sudar — Ecosystem Master Context
## The Operating System for Learning
### *"Learns with you, for you."*

> **FOR AI AGENTS (Cursor, Copilot, Devin):** This is the authoritative context document for the Sudar project.
> Read this file completely before making any changes. Every architectural decision, naming convention,
> tech stack choice, and product philosophy is documented here. Do not deviate from these decisions
> without explicit instruction from the project owner.

---

## 1. Mission & Vision

**Mission**: Democratize high-quality, personalized learning — giving every learner in the world
access to the kind of adaptive, intelligent education that was previously available only to those
who could afford thousands of dollars in eLearning subscriptions (Rise360, Articulate Storyline,
Adobe Captivate, etc.).

**Vision**: Sudar is the world's first AI-native Learning Operating System — a platform that doesn't
just deliver content, but *learns* the learner. It adapts modality, pace, difficulty, and content
in real-time based on behavioral signals, preferences, and outcomes.

**Tagline**: *Learns with you, for you.*

**The Core Promise**:
- For **learners**: A personal AI tutor that remembers you, adapts to you, and never judges you.
- For **L&D teams / admins**: Build world-class training content without needing instructional
  designers, video producers, or graphic designers. AI handles everything.
- For **organizations**: A platform that connects learning outcomes to business outcomes, with
  full analytics and compliance tracking.

---

## 2. The Builder

**Project Owner**: Dhani (dkaru002)
**Repository root**: Local path may still show ByteOS; the **product and canonical repo are Sudar**.
**Canonical repo**: https://github.com/Dhanikesh-Karunanithi/Sudar (official account; default push target). The project was rebranded from ByteOS to Sudar; ByteOS (lorddannykay) is legacy and will be private — focus is Sudar only.
**Build style**: Solo builder — decisions must be achievable without a large team
**Stack preference**: Pragmatic and modern. Always prefer the simplest architecture that achieves
  the goal without over-engineering.

---

## 3. Product Architecture

Sudar is composed of three primary surfaces and one shared intelligence + data layer:

```
╔══════════════════════════════════════════════════════════════════════╗
║                           S U D A R                                 ║
║               The Operating System for Learning                     ║
╠═════════════════════════╦════════════════════════════════════════════╣
║   SUDAR STUDIO          ║   SUDAR LEARN                             ║
║   (Admin / Creator)     ║   (Learner / Delivery)                   ║
║   Port: 3000             ║   Port: 3001                             ║
║   Base: SudarLab         ║   Base: SudarVerse-LMS                   ║
╠═════════════════════════╩════════════════════════════════════════════╣
║             SUDAR INTELLIGENCE (Python FastAPI)                    ║
║   Port: 8001 (default with dev script; not 8000 when SudarVid runs) ║
║   Tutor · TTS · Agents · Sim coach (NBA / twin: Learn APIs)           ║
╠══════════════════════════════════════════════════════════════════════╣
║                   SUPABASE (Single Source of Truth)                 ║
║   Auth · Learner Profiles · Content · Events · Analytics           ║
╚══════════════════════════════════════════════════════════════════════╝
```

Also in-repo (not shown in the ASCII banner): **SudarVid** (`sudar_vid`), **SudarSim** (`sudar-sim`), **MCP** (`packages/sudar-mcp` + Cloudflare worker), **ALP** plugins (`integrations/`), **teachwithsudar** marketing, shared TS (`shared/`), migrations (`supabase/migrations/`).
### 3.1 Sudar Studio (`/sudar-studio`)
- **Base**: SudarLab (Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase JS — Prisma is leftover, not the runtime ORM)
- **Purpose**: The admin/creator surface where L&D teams build courses
- **Key capabilities**:
  - AI-powered course generation from any source (PDF, DOCX, URL, text prompt)
  - RAG pipeline for context-aware generation from uploaded documents
  - **Learning personas** (five curated visual themes in Studio: `learningPersonas.ts`) plus block-based course layouts; legacy schema field `courses.template` may still reference older template ids
  - Slide Mode (absorbed from bytelabslide)
  - Multi-source media search (Google primary, Pexels, Unsplash, Giphy)
  - Project media peek (images, video scenes, podcast dialogue in one view)
  - Web-search–driven module generation with citations (Google Custom Search)
  - SCORM 1.2 export
  - Content fact-checking and validation
  - Learning path builder (assign ordered course sequences to teams)
  - Analytics dashboard (completions, skill gaps, drop-off analysis)
  - White-label config per organization (partial / roadmap for full brand portals)
  - Role-based access (Admin, Manager, Creator, Learner)
  - Compliance tracking (mandatory training, certifications, due dates)
  - Teaching OS **Domains** curator; SudarSim scenario library; MCP OAuth handoff

### 3.2 Sudar Learn (`/sudar-learn`)
- **Base**: SudarVerse-LMS (Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase JS)
- **Purpose**: The learner-facing delivery platform
- **Key capabilities**:
  - Personalized learner dashboard (based on Supabase learner profile)
  - Modality switching: Text, Listen (TTS), Watch (SudarVid / prebuilt video), Map (mindmap), Flashcards, SCORM; optional **Sim** tab when a scenario is linked; **SudarFeed** and **SudarPlay** are partial or roadmap (see `docs/STRATEGIC_PATH.md`)
  - AI Tutor: RAG over course content (content_chunks + pgvector, ingest API in Learn); Floating Sudar Chat (global); reactive Q&A + **proactive nudges with tap-to-reply chips** (idle on module, session welcome on home, contextual prompts on navigation) + longitudinal memory; structured response blocks (enroll, continue, review); quick memory preferences; outcome logging (`tutor_action_taken`, `proactive_choice`). My Memory page with insights carousel.
  - **SudarNotes** (`/journey`, flag `NEXT_PUBLIC_SUDAR_JOURNEY`): conversational learning — living notebook + pedagogical modes; client of **Teaching OS** claim/mastery spine (see `docs/TEACHING_OS.md`, `docs/SUDAR_2_0_VISION.md`). Coexists with course Learn; does not replace authored courses. Session state in `sudar_notes_sessions`.
  - Teaching OS: domain claim graphs, `learner_claim_mastery`, unified NBA v2 (reviews → gaps → continue); Studio **Domains** curator.
  - **SudarSim**: roleplay sessions (`/sim/`, voice via `sudar-sim` + Intelligence STT/TTS)
  - Skills graph and knowledge gap visualization
  - Next Best Action recommendations (**canonical scorer in Learn**)
  - Learning path enrollment and progress tracking
  - Certification management
  - Digital Learner Twin (the accumulation of all signals about a learner)
  - SCORM delivery: proxy for SCORM package assets from Supabase Storage (course-media) with correct MIME types for iframe playback.
  - Change password flow when require_password_change is set (e.g. after admin reset).

### 3.3 Sudar Intelligence (`/sudar-intelligence`)
- **Base**: bytengine (Python FastAPI)
- **Purpose**: Heavy AI computation (tutor, TTS, generation, Agents, Sim coach). **Not** the sole owner of adaptation: next-best-action and twin rollups are implemented in **Learn** (`/api/intelligence/next-action`, `/api/learner/twin-rollup`); some Intelligence learner routes proxy to Learn or remain stubs.
- **Key capabilities**:
  - AI Tutor engine (RAG-aware when called; proactive **`/api/tutor/nudge`** may return structured **choices** for ALP / embed clients). Longitudinal context is loaded via Supabase from Learn-managed data.
  - Content generation helpers (multi-format, multi-provider)
  - SudarSim STT/TTS + coach evaluation
  - Sudar Agents gateway (`/api/agents/*`)
  - Learner profile scoring (where implemented); **no shipped in-repo fine-tuning pipeline** today

**Sudar Agents (gateway)** — Bounded task orchestration (`/api/agents/*` on Intelligence): synchronous and streaming agent runs backed by **`agent_runs`** in Postgres (plans, tool traces, artefacts). Learn and Studio forward **JWT-authenticated** BFF routes; learner tools can call Learn’s **`/api/internal/agent-tools/*`** behind a shared secret for NBA parity with the canonical scorer in Learn. Product documentation: [docs/AGENTS_PLATFORM.md](docs/AGENTS_PLATFORM.md). Org-level enablement and features live in **`organisations.settings.sudar_agents`**.

### 3.4 Adjacent services (not separate `byteos-*` repos)

There are **no** top-level `byteos-feed` / `byteos-play` / `byteos-mind` folders in this repo.

- **`sudar_vid/`** — SudarVid: Python FastAPI, Together AI (slide planning + image generation), Edge-TTS, FFmpeg, Playwright. Canonical video generation for Watch. Port **8000**; Learn proxies via `SUDARVID_URL`.
- **`sudar-sim/`** — Voice roleplay (LiveKit / Pipecat); Learn BFF + Intelligence coach.
- **Mindmap** — Generated via Learn API (`/api/ai/generate-mindmap`), not a standalone microservice.
- **SudarFeed** — Roadmap / placeholder (not a shipped course modality tab).
- **SudarPlay** — Partial (Intelligence router + Learn launch path + `workadventure/` bridge stub); not a full game modality. See `docs/SUDARPLAY_STATUS.md`.
- **`packages/sudar-mcp` + `workers/`** — MCP and cron/staging workers.
- **`integrations/`** — Moodle/Canvas ALP distribution.
- **`teachwithsudar/`** — Marketing site.

### 3.5 Audio and AI model selection
- **Listen modality**: Audiobook/podcast-style high-quality TTS only. No browser fallback; when Intelligence is unavailable the client shows “Audio unavailable” and Retry. TTS is generated by Sudar Intelligence (Edge-TTS by default; optional Sarvam AI when `SARVAM_API_KEY` is set and voice is `sarvam_*`). Voice and rate are configurable; long text is chunked and concatenated.
- **Read-along (Reading modality)**: Optional “Read aloud” control using browser `speechSynthesis` with sentence-level highlighting so the learner can follow along. Does not use server TTS.
- **Model selection**: A unified card-grid UI (ModelPicker) is used for choosing AI models and TTS voices. **Studio** (Org settings): default TTS voice and content-generation model stored in `organisations.settings.ai_models`. **Learn** (Settings): learner TTS voice (and optional tutor model) preference stored in `learner_profiles.ai_tutor_context.preferences`. Learn’s generate-audio API passes the learner’s preferred voice (or request override) to Intelligence. See `docs/AUDIO_STRATEGY.md` for the full design and ByteLab references.

---

## 4. Tech Stack (Canonical — Do Not Deviate)

| Layer | Technology | Why |
|---|---|---|
| Studio & Learn frontend | Next.js 15 (App Router) | Current app `package.json` targets Next 15 |
| Styling | Tailwind CSS 3 | Consistent across all projects |
| Language (frontend) | TypeScript 5 | Type safety across the board |
| Database | Supabase (PostgreSQL) | Single source of truth, auth included |
| ORM / data access | Supabase JS + `supabase/migrations/` | Canonical schema and runtime; Prisma leftover in apps is not the live path |
| Animation | Framer Motion | Learner UI motion |
| State management | Zustand | Complex client state where used |
| AI providers | OpenRouter → Together → OpenAI → Anthropic (+ org BYOM / Sudar AI / custom) | Multi-key fallback; see ENV_REFERENCE |
| Backend AI engine | Python FastAPI | Best for ML/AI operations and orchestration |
| Video generation | SudarVid — Python FastAPI + Together AI + Edge-TTS + FFmpeg + Playwright | Slide deck + TTS narration; HTML-first (iframe), optional MP4 |
| Game engine | Phaser.js / WorkAdventure (SudarPlay — partial) | Roadmap / stub |
| Auth | Supabase Auth | Shared across Studio + Learn (not NextAuth) |
| File storage | Supabase Storage | RAG source docs, media assets |
| Deployment target | **Cloudflare Workers/Pages** (Studio, Learn, marketing) + Railway/Render/OCI (Intelligence/Vid/Sim) + Wrangler (MCP/cron) | Staging may still use Vercel hostnames |

---

## 5. Supabase Schema (Canonical Data Model)

This is the **single source of truth** schema. All tables must be created in this Supabase project.
Both Studio and Learn reference the SAME Supabase project.

### Auth & Identity
```sql
-- Handled by Supabase Auth (auth.users)
-- Extended by:

profiles (
  id uuid references auth.users PRIMARY KEY,
  full_name text,
  avatar_url text,
  role text CHECK (role IN ('super_admin', 'org_admin', 'manager', 'creator', 'learner')),
  org_id uuid references organisations,
  onboarding_complete boolean DEFAULT false,
  require_password_change boolean DEFAULT false,  -- set when admin resets password (OTP); force change on first login
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

### Organisations
```sql
organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  branding jsonb,          -- {logo_url, primary_color, secondary_color, font}
  settings jsonb,          -- {default_language, timezone, sso_config, institution_type, performance_config}
  plan text DEFAULT 'free', -- 'free' | 'pro' | 'enterprise'
  created_at timestamptz DEFAULT now()
)
-- settings.performance_config: institution_type 'corporate' | 'educational' | 'other'
--   corporate: { kpis: [{ id, name, unit, target?, period }] }
--   educational: { scale: 'percentage' | 'letter' | 'gpa', terms: [{ id, name, start, end }] }

org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid references organisations NOT NULL,
  user_id uuid references profiles NOT NULL,
  role text CHECK (role IN ('admin', 'manager', 'creator', 'learner')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
)

org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations NOT NULL,
  email text NOT NULL,
  role text CHECK (role IN ('admin', 'manager', 'creator', 'learner')) DEFAULT 'learner',
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, email)
)

integration_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid references organisations NOT NULL ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
)

-- LMS / LTI → Sudar profile UUID (see docs/ALP_API.md). Managed via Studio provisioning API + Learn resolve; RLS on, no learner policies (service role only).
lms_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid references organisations NOT NULL ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'moodle',  -- e.g. moodle, lti
  external_user_id text NOT NULL,          -- Moodle userid string or LTI sub
  external_email text,
  sudar_user_id uuid references profiles NOT NULL ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,                  -- soft revoke; unique active (org, provider, external_user_id) in DB
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
)

-- LTI 1.3 platform registrations (issuer + OAuth client + deployment → org). Used to verify id_token on launch.
lti_platform_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid references organisations NOT NULL ON DELETE CASCADE,
  issuer text NOT NULL,
  client_id text NOT NULL,
  deployment_id text NOT NULL,
  platform_jwks_uri text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, client_id, deployment_id)
)
```

### Learner Profiles (The Digital Learner Twin)
```sql
learner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references profiles UNIQUE NOT NULL,
  -- Modality preferences (0.0 to 1.0 affinity scores, updated by AI)
  modality_scores jsonb DEFAULT '{
    "text": 0.5, "video": 0.5, "audio": 0.5,
    "mindmap": 0.5, "flashcards": 0.5, "game": 0.5, "feed": 0.5
  }',
  -- Learning style
  learning_pace text DEFAULT 'medium',    -- 'fast' | 'medium' | 'slow'
  difficulty_comfort text DEFAULT 'intermediate', -- 'beginner' | 'intermediate' | 'advanced'
  cognitive_style text DEFAULT 'mixed',   -- 'visual' | 'auditory' | 'reading' | 'kinaesthetic' | 'mixed'
  preferred_language text DEFAULT 'en',
  -- Behavioral signals
  avg_session_duration_mins float DEFAULT 0,
  avg_completion_rate float DEFAULT 0,
  total_learning_minutes float DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_active_at timestamptz,
  -- AI-computed
  overall_engagement_score float DEFAULT 0.5,
  next_best_action jsonb,   -- {type, target_id, reason, computed_at} — NBA v2 may cite claim_ids
  ai_tutor_context jsonb,   -- Twin control plane + tutor memory (goals, struggles, teaching_os slice)
  generative_ai_consent_at timestamptz,  -- learner accepted org-required AI personalization
  updated_at timestamptz DEFAULT now()
)
```

### Teaching OS — claim graph & mastery (see docs/TEACHING_OS.md)
```sql
learning_domains (id, org_id, title, source, source_course_id, version, ...)
learning_claims (id, domain_id, stem, misconceptions, bloom, evidence_types, ...)
claim_edges (from_claim_id, to_claim_id, kind)  -- prerequisite | related
claim_content_links (claim_id, link_kind, target_id)  -- module | chunk | sim_scenario | flashcard_set
learner_claim_mastery (user_id, claim_id, p_know, next_review_at, ...)
learning_sessions (user_id, surface, domain_id, state jsonb, ...)
-- learning_events also: claim_check | claim_mastery_update | review_due_served | session_replan
```

### Learner performance data (institution-aware)
```sql
learner_performance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations NOT NULL,
  user_id uuid REFERENCES profiles NOT NULL,
  source_type text NOT NULL,   -- 'kpi' | 'grade' | 'custom'
  key text NOT NULL,           -- KPI id or exam/term id from org performance_config
  value numeric NOT NULL,
  value_display text,          -- optional letter grade / label
  period_start date,
  period_end date,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id, source_type, key, period_start)
)
```

### Skills & Knowledge Graph
```sql
skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text,
  parent_skill_id uuid references skills,
  description text,
  org_id uuid references organisations  -- null = global skill
)

learner_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references profiles NOT NULL,
  skill_id uuid references skills NOT NULL,
  proficiency_level float DEFAULT 0,   -- 0.0 to 1.0
  evidence_count integer DEFAULT 0,    -- number of assessments/activities
  last_assessed_at timestamptz,
  UNIQUE(user_id, skill_id)
)

skill_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references profiles NOT NULL,
  skill_id uuid references skills NOT NULL,
  gap_score float,         -- 0.0 = no gap, 1.0 = critical gap
  identified_at timestamptz DEFAULT now(),
  resolved_at timestamptz
)
```

### Content
```sql
courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid references organisations NOT NULL,
  created_by uuid references profiles NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  status text DEFAULT 'draft', -- 'draft' | 'published' | 'archived'
  template text,               -- legacy / persona key (see Studio learning personas)
  difficulty text,             -- 'beginner' | 'intermediate' | 'advanced'
  estimated_duration_mins integer,
  target_skills jsonb,         -- [{skill_id, target_proficiency}]
  tags text[],
  scorm_url text,              -- if exported as SCORM
  settings jsonb,              -- includes personalization: { audience, group_ids, user_ids, features }; video/podcast; module_completion
  is_adaptive boolean DEFAULT false,  -- must be true for Learn-side personalization gates
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid references courses NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,      -- structured content blocks
  modality_variants jsonb,     -- {video_url, audio_url, mindmap_data, game_id}
  order_index integer,
  quiz jsonb,                  -- quiz questions if applicable
  created_at timestamptz DEFAULT now()
)

content_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid references organisations,
  uploader_id uuid references profiles,
  type text,                   -- 'image' | 'video' | 'audio' | 'document' | 'scorm'
  url text NOT NULL,
  storage_path text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
)
```

### Learning Paths
```sql
learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid references organisations NOT NULL,
  created_by uuid references profiles NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  status text DEFAULT 'draft',
  courses jsonb NOT NULL,      -- [{course_id, order_index, is_required}]
  target_skills jsonb,
  certification_config jsonb,  -- {issue_cert, cert_template, validity_days}
  created_at timestamptz DEFAULT now()
)

enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references profiles NOT NULL,
  path_id uuid references learning_paths,
  course_id uuid references courses,
  enrolled_by uuid references profiles,  -- self-enrolled or admin-assigned
  status text DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'completed' | 'overdue'
  progress_pct float DEFAULT 0,
  due_date timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  personalized_welcome jsonb,           -- opt-in course welcome from Sudar
  personalized_sequence jsonb,          -- adaptive path ordering (path enrollments)
  personalization_overlays jsonb,       -- per-module AI views: { [module_id]: { role_explanation?, brief_3min?, updated_at } }
  created_at timestamptz DEFAULT now()
)

learner_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid references organisations NOT NULL,
  name text NOT NULL,
  description text,
  created_by uuid references profiles NOT NULL,
  created_at timestamptz DEFAULT now()
)

learner_group_members (
  group_id uuid references learner_groups ON DELETE CASCADE,
  user_id uuid references profiles ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
)
```

**AI personalization (data boundaries)**  
- **Course policy**: `courses.settings.personalization` — `{ audience: 'org'|'groups'|'individuals', group_ids[], user_ids[], features: { course_welcome, module_role_explain, module_brief } }`. **`courses.is_adaptive`** must be on for any of these features in Learn.  
- **Org policy**: `organisations.settings.ai_compliance` — `{ allow_generative_personalization, require_learner_consent, personalization_data_retention_days? }`.  
- **Learner consent**: `learner_profiles.generative_ai_consent_at` when the org requires consent.  
- **Telemetry**: `learning_events` types include `course_personalize`, `module_personalize`, `ai_personalization_consent`. Payloads avoid storing full model output.  
- **Canonical content**: `modules.content` is never overwritten by personalization; overlays live only on `enrollments.personalization_overlays`.

### Events & Analytics (Time-series learner telemetry)
```sql
learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references profiles NOT NULL,
  course_id uuid references courses,
  module_id uuid references modules,
  event_type text NOT NULL, -- 'module_start' | 'module_complete' | 'quiz_attempt' |
                            -- 'video_play' | 'video_pause' | 'video_replay' |
                            -- 'section_heartbeat' (periodic time on section; payload: active_secs, total_secs) |
                            -- 'ai_tutor_open' | 'ai_tutor_query' | 'modality_switch' |
                            -- 'session_end' (payload: active_secs, reason e.g. pagehide) |
                            -- 'drop_off' (incomplete module leave; payload: active_secs, completed: false) |
                            -- 'streak_broken' | 'streak_maintained' |
                            -- Teaching OS: 'claim_check' | 'claim_mastery_update' |
                            -- 'review_due_served' | 'session_replan'
  payload jsonb,            -- event-specific data (e.g. module_complete: active_secs, idle_secs;
 -- modality_switch: from_modality, to_modality;
                            -- video_play|video_pause: scene_index, scene_count;
                            -- video_replay: scene_from, scene_to)
  modality text,            -- which modality was active when event fired
  duration_secs integer,    -- time spent if applicable
  created_at timestamptz DEFAULT now()
)

ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references profiles NOT NULL,
  course_id uuid references courses,
  module_id uuid references modules,
  interaction_type text,   -- 'question' | 'hint_request' | 'explanation' | 'proactive_nudge' | 'proactive_choice'
  user_message text,
  ai_response text,
  context_used jsonb,      -- which module content was retrieved for context
  helpful boolean,         -- learner feedback (thumbs up/down)
  created_at timestamptz DEFAULT now()
)
```

### Certifications & Compliance
```sql
certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references profiles NOT NULL,
  path_id uuid references learning_paths NOT NULL,
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  certificate_url text,
  verification_code text UNIQUE
)

compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid references organisations NOT NULL,
  user_id uuid references profiles NOT NULL,
  course_id uuid references courses NOT NULL,
  required_by timestamptz,
  completed_at timestamptz,
  status text,  -- 'pending' | 'compliant' | 'overdue' | 'exempt'
  reminder_sent_at timestamptz
)
```

---

## 5a. Trust, governance, and compliance documentation

- **Technical trust pack** (data flows, AI feature register, subprocessors, shared responsibility, threat model, operations runbook, audit log design): [docs/trust/README.md](docs/trust/README.md).
- **Sudar Studio**: **Governance** (Admin/Manager) summarises organisation-level protections; **Org settings** stores `organisations.settings.ai_compliance` (including tutor input checks). **Training compliance** (`/compliance`) is L&D path assignments and due dates, not legal or GDPR compliance by itself.

---

## 6. API Contracts Between Services

### Studio → Supabase
- Studio writes to: `courses`, `modules`, `content_assets`, `learning_paths`, `org_members`
- Studio reads from: `learner_profiles`, `learning_events`, `enrollments`, `certifications` (for analytics)

### Learn → Supabase
- Learn writes to: `learning_events`, `ai_interactions`, `enrollments`
- Learn reads from: `courses`, `modules`, `learning_paths`, `learner_profiles`, `learner_skills`

### Learn → Intelligence (`http://localhost:8001` when using `scripts/dev-with-sudarvid.mjs`, which reserves **8000** for SudarVid)
```
POST /api/tutor/query         — AI tutor Q&A
POST /api/tutor/nudge         — proactive nudge generation (optional `choices` for MCQ-style follow-ups)
POST /api/learner/profile     — update learner profile from events
POST /api/learner/next-action — compute next best action
POST /api/modality/recommend  — recommend modality switch
POST /api/content/generate    — generate content from topic/document
POST /api/video/generate      — video job stub (orchestration lives in Learn → SudarVid)
POST /api/mindmap/generate    — generate mindmap from content
POST /api/game/generate       — trigger SudarPlay game generation
```

### Intelligence → External Services
- Together AI API (primary LLM + embeddings)
- OpenAI API (fallback)
- Anthropic API (fallback)
- SudarVid (`SUDARVID_URL` → `sudar_vid` service)
- Remotion render server (`POST http://localhost:3040/render`)

---

## 7. Project Folder Structure

```
Sudar/
├── ECOSYSTEM.md
├── AGENTS.md
├── .cursorrules
├── docs/                     ← trust, ALP, ship memory, strategic path
├── shared/                   ← shared TypeScript modules
├── supabase/migrations/      ← canonical schema
├── help-center/
├── sudar-studio/             ← Next.js 15 admin/creator
├── sudar-learn/              ← Next.js 15 learner
├── sudar-intelligence/       ← Python FastAPI (api/, core/, agents/, sudarplay/)
├── sudar_vid/                ← Watch modality
├── sudar-sim/                ← Voice Sim service
├── packages/sudar-mcp/
├── workers/                  ← MCP, cron, staging
├── integrations/             ← Moodle / Canvas / alp-sdk
├── teachwithsudar/           ← Marketing
└── docs/archive/             ← Historical Phase 1/2 notes (when present)
```

---

## 8. Build Phases (The Roadmap)

**Current state (sync with docs/STRATEGIC_PATH.md):** Phases 1–4 complete; Phase 5 in progress (flashcards, document-to-course, SCORM import; RAG, Floating Sudar Chat, SCORM delivery, change password — see UPDATES.md).

### Phase 1 — Foundation
**Goal**: Supabase schema + shared auth + data contracts
- [x] Create Supabase project and run schema migrations
- [x] Set up shared auth (Supabase Auth) across Studio + Learn
- [x] Define environment variable contracts
- [x] Create ECOSYSTEM.md, AGENTS.md, .cursorrules
- [x] Set up Sudar Studio (ByteLab migration)
- [x] Set up Sudar Learn (ByteVerse-LMS migration)

### Phase 2 — Integration Layer
**Goal**: Course published in Studio appears in Learn, events flow back
- [x] ByteLab export → writes to Supabase `courses` + `modules`
- [x] ByteVerse-LMS reads courses from Supabase and renders
- [x] Learner events write to `learning_events`
- [x] End-to-end flow: author → publish → learn → track

### Phase 3 — Learner Experience
**Goal**: Personalized dashboard, modality switching, AI tutor
- [x] Learner home with personalized path (reads `learner_profiles`)
- [x] Modality switcher on course view
- [x] Watch modality (Learn proxies to SudarVid; optional Remotion for MP4)
- [x] AI Tutor sidebar (reactive Q&A, RAG against course content)
- [x] RAG in Learn (content_chunks + pgvector, ingest API, tutor course search)
- [x] Floating Sudar Chat (global), proactive prompts with **multiple-choice chips** (dashboard + idle nudge), structured responses, outcome logging, validate-memory quick preferences, memory insights
- [x] SCORM delivery proxy (serve SCORM assets from Supabase Storage with correct MIME for iframe)
- [x] Change password flow (require_password_change after admin reset)
- [x] Proactive nudges from Intelligence layer

### Phase 4 — Intelligence
**Goal**: System learns about the learner
- [x] Learner profile and next-best-action (Learn API + optional Intelligence)
- [x] AI tutor longitudinal memory (reads `ai_interactions` + `learner_profiles.ai_tutor_context`; implemented in Learn API)
- [x] Struggle detection from quizzes; adaptive path ordering
- [x] Admin analytics dashboard (completions, skill gaps, drop-off)

### Phase 5 — Engagement & Scale
**Goal**: All modalities + compliance + white-label
- [ ] SudarPlay game modality wired into Learn
- [ ] shayshay SudarFeed modality
- [x] SudarMind (mindmap) modality in Learn (on-demand generation where configured)
- [x] SudarNotes conversational learning (`/journey`) + Teaching OS claim/mastery spine (see `docs/TEACHING_OS.md`)
- [x] Compliance tracking + certifications
- [ ] White-label per org
- [ ] HRIS integration hooks (Workday, BambooHR)

---

## 9. Key Design Principles (Never Violate)

1. **Learner-first**: Every feature decision asks "does this make the learner's experience better?"
2. **Progressive disclosure**: Simple by default, powerful when needed. Don't overwhelm admins or learners.
3. **AI as a collaborator, not a replacement**: AI assists the human; final decisions remain with the user.
4. **Modality agnosticism**: Content is authored once, delivered in any modality. Never lock content to one format.
5. **Privacy by design**: Learner behavioral data is used to help the learner, never sold or shared.
6. **Accessibility**: WCAG 2.1 AA minimum. Learning is for everyone.
7. **Performance**: Core pages must load in under 2 seconds. Lazy-load everything else.
8. **Mobile-first**: All learner-facing UI designed mobile-first.

---

## 10. Naming Conventions

- **Product**: Sudar (directories use `sudar-*` names; ByteOS is legacy branding only)
- **Admin surface**: Sudar Studio (runs in `sudar-studio/`)
- **Learner surface**: Sudar Learn (runs in `sudar-learn/`)
- **AI engine**: Sudar Intelligence (runs in `sudar-intelligence/`)
- **Video modality**: SudarVid (`sudar_vid/`)
- **Sim modality**: SudarSim (`sudar-sim/` + Learn `/sim/`)
- **Game modality**: SudarPlay (branded feature — partial / stub)
- **Feed modality**: SudarFeed (roadmap)
- **Mindmap modality**: SudarMind (Learn on-demand generation)
- **AI Tutor**: "Sudar" (the tutor's name — short, memorable, on-brand)
- **SudarNotes**: Conversational learning surface in Learn (`/journey`) — living notebook + pedagogical tutor; Teaching OS client
- **Teaching OS**: Shared claim/mastery spine (domains, claims, mastery, pedagogy engine, NBA v2)
- **The learner data profile**: Digital Learner Twin

---

## 11. Source Projects & What They Became

| Original Project | New Identity | Action |
|---|---|---|
| ByteLab | Sudar Studio (core) | Extend + rename |
| bytelabslide | Studio Slide Mode | Merge into Studio |
| ByteVerse-LMS | Sudar Learn (core) | Extend + rename |
| bytengine | Sudar Intelligence | Canonical backend |
| byteaugnew | Reference only | Archive after migration |
| bytetexttovid (historical) | SudarVid (`sudar_vid`) | Canonical Watch pipeline |
| Remotion | Remotion render server | Optional MP4 pipeline (`REMOTION_SERVER_URL`) |
| shayshay | SudarFeed modality in Learn | Absorb as feature |
| BytePlay | SudarPlay modality in Learn | Absorb as feature |
| ByteMind | SudarMind modality in Learn | Absorb as feature |
| byteblink | Base template | Utility |
| Synchronicity | External project | Removed from ecosystem |
| All backup/* | — | Archive folder |

---

## 12. Environment Variables (Required)

**Canonical list:** The full list of env vars, “Get key” links, and which app uses each lives in **docs/ENV_REFERENCE.md**. Below is a short summary. The stack is **provider-agnostic** for AI: set `AI_CHAT_PROVIDER` (e.g. `openrouter`, `together`, `openai`, `anthropic`, `custom`) and the corresponding key(s). Fallback when unset: OpenRouter → Together → OpenAI → Anthropic.

### Both Studio + Learn
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=           # canonical app origin (preferred)
NEXTAUTH_URL=                  # legacy alias for app origin only — not NextAuth
SUDAR_INTELLIGENCE_URL=http://localhost:8001
# Legacy alias still supported in code: BYTEOS_INTELLIGENCE_URL
```

Auth is **Supabase Auth**. Do not configure `NEXTAUTH_SECRET` — it is unused.
### AI (at least one chat provider)
```env
AI_CHAT_PROVIDER=openrouter|together|openai|anthropic|custom
OPENROUTER_API_KEY=
TOGETHER_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
AI_CHAT_BASE_URL=   # for custom/local models
```

### Studio only
```env
GOOGLE_SEARCH_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=
PEXELS_API_KEY=
UNSPLASH_ACCESS_KEY=
GIPHY_API_KEY=
REMOTION_SERVER_URL=http://localhost:3040
```

### Intelligence (Python)
Uses same `AI_CHAT_PROVIDER` and keys; see ENV_REFERENCE.md and `sudar-intelligence/src/core/ai_client.py`.
```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUDARVID_URL=http://localhost:8000
REMOTION_SERVER_URL=http://localhost:3040
```

---

*Last updated: September 2026 | Sudar (docs truth-sync: Cloudflare prod, Learn NBA, SudarSim/MCP, Supabase Auth)*
*This document is the single source of truth for the Sudar ecosystem architecture; ship status lives in UPDATES.md.*
