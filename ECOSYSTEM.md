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
**Repository root**: `C:\Users\dkaru002\Desktop\Dhani-Laboratory\ByteAI\ByteOS`
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
║   Port: 8000 · Adaptive Engine · AI Tutor · Modality Dispatcher    ║
╠══════════════════════════════════════════════════════════════════════╣
║                   SUPABASE (Single Source of Truth)                 ║
║   Auth · Learner Profiles · Content · Events · Analytics           ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 3.1 Sudar Studio (`/byteos-studio`)
- **Base**: SudarLab (Next.js 14, TypeScript, Tailwind CSS, Prisma → Supabase)
- **Purpose**: The admin/creator surface where L&D teams build courses
- **Key capabilities**:
  - AI-powered course generation from any source (PDF, DOCX, URL, text prompt)
  - RAG pipeline for context-aware generation from uploaded documents
  - 14 visual course templates
  - Slide Mode (absorbed from bytelabslide)
  - Multi-source media search (Google, DuckDuckGo, Pexels, Unsplash, Giphy)
  - SCORM 1.2 export
  - Content fact-checking and validation
  - Learning path builder (assign ordered course sequences to teams)
  - Analytics dashboard (completions, skill gaps, drop-off analysis)
  - White-label config per organization
  - Role-based access (Admin, Manager, Creator, Learner)
  - Compliance tracking (mandatory training, certifications, due dates)

### 3.2 Sudar Learn (`/byteos-learn`)
- **Base**: SudarVerse-LMS (Next.js 14, TypeScript, Tailwind CSS, Prisma → Supabase)
- **Purpose**: The learner-facing delivery platform
- **Key capabilities**:
  - Personalized learner dashboard (based on Supabase learner profile)
  - Modality switching: Text / Video / Audio / MindMap / Flashcards / SudarFeed / SudarPlay
  - AI Tutor: RAG over course content (content_chunks + pgvector, ingest API in Learn); Floating Sudar Chat (global); reactive Q&A + proactive nudges + longitudinal memory; structured response blocks (enroll, continue, review); quick memory preferences; outcome logging (tutor_action_taken). My Memory page with insights carousel.
  - Skills graph and knowledge gap visualization
  - Next Best Action recommendations
  - Learning path enrollment and progress tracking
  - Certification management
  - Digital Learner Twin (the accumulation of all signals about a learner)
  - SCORM delivery: proxy for SCORM package assets from Supabase Storage (course-media) with correct MIME types for iframe playback.
  - Change password flow when require_password_change is set (e.g. after admin reset).

### 3.3 Sudar Intelligence (`/byteos-intelligence`)
- **Base**: bytengine (Python FastAPI)
- **Purpose**: The AI brain — all heavy computation, adaptation, and generation
- **Key capabilities**:
  - Adaptive difficulty engine (adjusts content complexity per learner)
  - Modality dispatcher (decides which modality to recommend next)
  - AI Tutor engine (RAG-powered, longitudinal memory via Supabase)
  - Next Best Action algorithm
  - Fine-tuning pipeline (Together AI fine-tune on educational data)
  - Content generation engine (multi-format, multi-provider)
  - Learner profile scoring and skill gap mapping
  - Event processing (ingests learner events and updates profiles)

### 3.4 Microservices (standalone, called by Intelligence layer)
- **byteos-video** (`/byteos-video`) — bytetexttovid: Python, FFmpeg, Edge-TTS
- **byteos-renderer** (`/byteos-renderer`) — Remotion: TypeScript, React, MP4 render server
- **byteos-feed** — shayshay (TikTok-style feed): absorbed into Sudar Learn as a modality
- **byteos-play** — SudarPlay (game generator): Phaser.js, called as modality from Learn
- **byteos-mind** — SudarMind (mindmap): embedded as modality component in Learn

---

## 4. Tech Stack (Canonical — Do Not Deviate)

| Layer | Technology | Why |
|---|---|---|
| Studio & Learn frontend | Next.js 14 (App Router) | Most mature base projects are Next.js 14 |
| Styling | Tailwind CSS 3 | Consistent across all projects |
| Language (frontend) | TypeScript 5 | Type safety across the board |
| ORM | Prisma | Already configured in ByteLab & ByteVerse-LMS |
| Database | Supabase (PostgreSQL) | Single source of truth, auth included |
| Animation | Framer Motion | Already in ByteVerse-LMS |
| State management | Zustand | Lightweight, already used in SudarMind & ByteVerse-LMS |
| AI providers | Together AI (primary), OpenAI (secondary), Anthropic (tertiary) | Cost-effective, multi-model |
| Backend AI engine | Python FastAPI | Best for ML/AI operations, fine-tuning |
| Video generation | Python + FFmpeg + Edge-TTS | bytetexttovid |
| Programmatic video | Remotion 4.0 | MP4 render server |
| Game engine | Phaser.js | SudarPlay |
| Auth | Supabase Auth | Shared across Studio + Learn |
| File storage | Supabase Storage | RAG source docs, media assets |
| Deployment target | Vercel (Studio + Learn) + Railway/Render (FastAPI) | Standard for Next.js |

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
  next_best_action jsonb,   -- {type, target_id, reason, computed_at}
  ai_tutor_context jsonb,   -- last N interactions summary for longitudinal memory
  updated_at timestamptz DEFAULT now()
)
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
  template text,               -- which of the 14 visual templates
  difficulty text,             -- 'beginner' | 'intermediate' | 'advanced'
  estimated_duration_mins integer,
  target_skills jsonb,         -- [{skill_id, target_proficiency}]
  tags text[],
  scorm_url text,              -- if exported as SCORM
  settings jsonb,              -- {allow_ai_tutor, require_completion_order, etc.}
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
  created_at timestamptz DEFAULT now()
)
```

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
                            -- 'drop_off' | 'streak_broken' | 'streak_maintained'
  payload jsonb,            -- event-specific data (e.g. module_complete: active_secs, idle_secs)
  modality text,            -- which modality was active when event fired
  duration_secs integer,    -- time spent if applicable
  created_at timestamptz DEFAULT now()
)

ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references profiles NOT NULL,
  course_id uuid references courses,
  module_id uuid references modules,
  interaction_type text,   -- 'question' | 'hint_request' | 'explanation' | 'proactive_nudge'
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

## 6. API Contracts Between Services

### Studio → Supabase
- Studio writes to: `courses`, `modules`, `content_assets`, `learning_paths`, `org_members`
- Studio reads from: `learner_profiles`, `learning_events`, `enrollments`, `certifications` (for analytics)

### Learn → Supabase
- Learn writes to: `learning_events`, `ai_interactions`, `enrollments`
- Learn reads from: `courses`, `modules`, `learning_paths`, `learner_profiles`, `learner_skills`

### Learn → Intelligence (`http://localhost:8000`)
```
POST /api/tutor/query         — AI tutor Q&A
POST /api/tutor/nudge         — proactive nudge generation
POST /api/learner/profile     — update learner profile from events
POST /api/learner/next-action — compute next best action
POST /api/modality/recommend  — recommend modality switch
POST /api/content/generate    — generate content from topic/document
POST /api/video/generate      — trigger bytetexttovid pipeline
POST /api/mindmap/generate    — generate mindmap from content
POST /api/game/generate       — trigger SudarPlay game generation
```

### Intelligence → External Services
- Together AI API (primary LLM + embeddings + fine-tuning)
- OpenAI API (fallback)
- Anthropic API (fallback)
- bytetexttovid (subprocess or HTTP call)
- Remotion render server (`POST http://localhost:3040/render`)

---

## 7. Project Folder Structure

```
ByteOS/
├── ECOSYSTEM.md              ← THIS FILE (read first, always)
├── AGENTS.md                 ← Cursor AI instructions
├── .cursorrules              ← Coding standards
├── docs/
│   ├── PRD.md
│   ├── PITCH_DECK.md
│   ├── MARKETING_DECK.md
│   ├── PRODUCT_FEATURES.md
│   ├── USER_PERSONAS.md
│   └── USER_FLOWS.md
├── byteos-studio/            ← Next.js 14 (SudarLab base)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── prisma/
│   └── package.json
├── byteos-learn/             ← Next.js 14 (SudarVerse-LMS base)
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── prisma/
│   └── package.json
├── byteos-intelligence/      ← Python FastAPI (bytengine base)
│   ├── src/
│   │   ├── api/
│   │   ├── adaptive/
│   │   ├── tutor/
│   │   ├── generation/
│   │   └── models/
│   └── requirements.txt
├── byteos-video/             ← Python (bytetexttovid)
├── byteos-renderer/          ← TypeScript/Remotion
└── archive/                  ← All deprecated/backup projects
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
- [ ] Video modality (wire to bytetexttovid / Remotion)
- [x] AI Tutor sidebar (reactive Q&A, RAG against course content)
- [x] RAG in Learn (content_chunks + pgvector, ingest API, tutor course search)
- [x] Floating Sudar Chat (global), structured responses, outcome logging, validate-memory quick preferences, memory insights
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
- [ ] SudarMind mindmap modality
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

- **Product**: Sudar (repo/folders remain ByteOS / byteos-* for compatibility)
- **Admin surface**: Sudar Studio (runs in `byteos-studio/`)
- **Learner surface**: Sudar Learn (runs in `byteos-learn/`)
- **AI engine**: Sudar Intelligence (runs in `byteos-intelligence/`)
- **Video modality**: Sudar Video (powered by Remotion + bytetexttovid)
- **Game modality**: SudarPlay (branded feature within Sudar Learn)
- **Feed modality**: SudarFeed (branded feature within Sudar Learn)
- **Mindmap modality**: SudarMind (branded feature within Sudar Learn)
- **AI Tutor**: "Sudar" (the tutor's name — short, memorable, on-brand)
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
| bytetexttovid | byteos-video microservice | Keep as microservice |
| Remotion | byteos-renderer microservice | Keep as microservice |
| shayshay | SudarFeed modality in Learn | Absorb as feature |
| BytePlay | SudarPlay modality in Learn | Absorb as feature |
| ByteMind | SudarMind modality in Learn | Absorb as feature |
| byteblink | Base template | Utility |
| Synchronicity | External project | Removed from ecosystem |
| All backup/* | — | Archive folder |

---

## 12. Environment Variables (Required)

### Both Studio + Learn
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=
BYTEOS_INTELLIGENCE_URL=http://localhost:8000
```

### Studio only
```env
TOGETHER_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_SEARCH_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=
PEXELS_API_KEY=
UNSPLASH_ACCESS_KEY=
GIPHY_API_KEY=
REMOTION_SERVER_URL=http://localhost:3040
```

### Intelligence (Python)
```env
TOGETHER_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BYTEOS_VIDEO_SERVICE_URL=http://localhost:5001
REMOTION_SERVER_URL=http://localhost:3040
```

---

*Last updated: February 2026 | Sudar v1.0 Foundation*
*This document is the single source of truth for the Sudar ecosystem.*
