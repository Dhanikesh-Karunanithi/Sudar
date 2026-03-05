# ByteOS — The Operating System for Learning

<p align="center">
  <strong>Learns with you, for you.</strong>
</p>

<p align="center">
  An <strong>AI-native</strong>, <strong>evidence-informed</strong> learning platform that solves the biggest problems in learning today: <br/>
  <strong>static content</strong>, <strong>one course for all</strong>, and <strong>no memory of the learner</strong>.
</p>

### What makes ByteOS different

- **Sudar's longitudinal memory** — The AI tutor remembers struggles, preferences, and prior learning across sessions and courses; most "AI in LMS" is stateless.
- **Adaptive paths** — Next-best-action, struggle detection from quizzes, and optional course reordering so each learner gets a path that fits.
- **AI tutor in context** — RAG over course content plus learner memory; "Explain this" from selected text; My Memory page.
- **Compliance and certifications** — Assign paths with due dates, compliance view (overdue / at-risk / on-track), shareable certificates with verification.
- **Open source and research-backed** — MIT license; design grounded in learning sciences ([RESEARCH_FOUNDATION.md](./RESEARCH_FOUNDATION.md)). Flashcards modality and document/SCORM import in progress.

---

## The problem (and why it matters)

Most learning today is **static and one-size-fits-all**: the same course for every learner, no adaptation to prior knowledge or goals, and **no persistent memory of who the learner is**. Traditional LMSs track completions and scores but do not maintain a **longitudinal learner model** or offer **adaptive sequencing** and **AI tutoring with memory**. Research shows that adaptive instruction and intelligent tutoring consistently outperform fixed instruction (VanLehn, 2011; Aleven et al., 2016), yet **no widely used technology today combines learner memory, adaptive enhancement, and AI tutoring inside a single platform** that can also power — or integrate with — traditional LMS workflows. ByteOS is built to be that technology: **personalised, memory-aware, and adaptive**, so every learner gets an experience that learns with them.

---

## About ByteOS

**ByteOS** is an open-source Learning Operating System built on principles from the **learning sciences** and **cognitive science**. It combines:

- **AI-powered authoring** — Create courses from prompts or documents without armies of instructional designers.
- **Adaptive delivery** — Content adapts to each learner’s goals, prior knowledge, and struggles.
- **Multi-modality** — One authoring flow; delivery in text, video, audio, mindmaps, flashcards, and games.
- **Personal AI tutor “Sudar”** — RAG-based Q&A with longitudinal memory and contextual help.
- **Learning paths & certifications** — Structured programmes with due dates, compliance, and shareable credentials.

The platform is designed so that **learners** get a personalised, supportive experience, **L&D teams** can build and assign training quickly, and **organisations** can track outcomes and compliance — all without the cost of traditional enterprise authoring tools and LMSs.

We are actively working on **bringing this same AI intelligence — learner memory and adaptive enhancement — into traditional LMS environments**, so that existing course catalogues and workflows can be personalised for every learner. There is no widely adopted technology that does this today; ByteOS is built to fill that gap and is backed by the research summarised in [RESEARCH_FOUNDATION.md](./RESEARCH_FOUNDATION.md).

---

## Origin: from ByteAI and ByteVerse to ByteOS

**ByteOS** was created by **Dhanikesh "Dhani" Karunanithi** as the culmination of the **ByteAI** and **ByteVerse** ecosystem — a long-running line of experiments and products in AI-powered learning and authoring. Over **hundreds of variants and versions** (authoring tools, LMS prototypes, AI tutors, modality switchers, and adaptive engines), the same vision kept surfacing: learning that **remembers the learner**, **adapts in real time**, and **delivers content in the modality that fits**. ByteOS is the unified system that brings that vision into one open platform: **Studio** (authoring and ops), **Learn** (learner experience), and **Intelligence** (adaptive engine and Sudar, the AI tutor). It stands on the lessons of ByteAI and ByteVerse while aiming to become the reference implementation for **memory-aware, adaptive learning** that the world can use, extend, and cite.

---

## Updates (what we've built & what's next)

We maintain a **phase-wise development log** so every commit tells a clear story. See:

- **[UPDATES.md](./UPDATES.md)** — What we've built (Phases 1–4 complete; Phase 5 in progress: flashcards modality, document-to-course, SCORM 1.2 import), what's upcoming, and a **daily-update template** for end-of-day commits.

**Why star this repo?** ByteOS is one of the few open-source platforms that combine **learner memory**, **adaptive sequencing**, and **AI tutoring** in a single stack — with a clear research foundation and a roadmap to bring this intelligence into traditional LMS workflows. Star and watch **UPDATES.md** to follow progress; we ship in phases and document each step.

---

## Sudar's memory (the differentiator)

Sudar, the AI tutor, uses **longitudinal memory**: it remembers what you've struggled with, what you know, and how you like to learn — across sessions and courses. Most "AI in LMS" implementations are stateless; Sudar is not. For how it works and where it lives in the codebase, see **[docs/sudar-memory.md](./docs/sudar-memory.md)**. A short **demo video** will be linked from **[docs/demo.md](./docs/demo.md)** once recorded.

---

## Screenshots

Screenshots (Learn dashboard, course viewer with Sudar, Studio paths/compliance) are in **[docs/screenshots/](./docs/screenshots/)**. Adding 2–4 screenshots there improves contributor and user confidence that ByteOS is building, not just planning.

---

## Research Foundation

ByteOS is grounded in established research on **adaptive instruction**, **multimodal learning**, **intelligent tutoring**, **formative assessment**, and **learner modelling**. For a concise account of the evidence base and design choices, see:

- **[RESEARCH_FOUNDATION.md](./RESEARCH_FOUNDATION.md)** — Learning sciences alignment, references, and suggested citation.

We encourage use and extension of ByteOS in **academic and applied research** and ask that you cite the repository when you do.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         B Y T E O S                             │
├────────────────────────────┬────────────────────────────────────┤
│   ByteOS Studio (:3000)    │   ByteOS Learn (:3001)             │
│   Admin / authoring        │   Learner delivery                  │
│   Next.js 14, TypeScript   │   Next.js 14, TypeScript            │
├────────────────────────────┴────────────────────────────────────┤
│   Supabase (PostgreSQL, Auth, Storage) — single source of truth  │
├─────────────────────────────────────────────────────────────────┤
│   ByteOS Intelligence (:8000) — Python FastAPI                  │
│   Adaptive engine, AI tutor, next-best-action                   │
└─────────────────────────────────────────────────────────────────┘
```

- **Studio** — Create courses, learning paths, assign learners, set due dates, view analytics and compliance.
- **Learn** — Enrol in courses and paths, learn with Sudar, track progress, earn certificates.
- **Intelligence** — Optional Python service for heavier adaptive logic; core flows also work with direct AI calls from Studio/Learn.

---

## Project Structure

```
ByteOS/
├── README.md                 ← You are here
├── RESEARCH_FOUNDATION.md    ← Learning sciences & citation
├── ECOSYSTEM.md              ← Master architecture (for contributors & AI agents)
├── AGENTS.md                 ← Instructions for AI coding agents
├── LICENSE                   ← MIT
├── docs/
│   ├── PRD.md                ← Product requirements
│   ├── STRATEGIC_PATH.md     ← Roadmap & priorities
│   ├── ACTION_PLANS.md       ← Executable action plans
│   ├── PRODUCT_FEATURES.md   ← Feature specification
│   ├── USER_PERSONAS.md      ← Personas
│   └── USER_FLOWS.md         ← User flows
├── byteos-studio/            ← Admin app (Next.js 14) — Port 3000
├── byteos-learn/             ← Learner app (Next.js 14) — Port 3001
├── byteos-intelligence/      ← AI engine (Python FastAPI) — Port 8000
└── byteos-video/             ← Video generation (optional)
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Supabase** account ([supabase.com](https://supabase.com))
- At least one **AI provider** key (e.g. [Together AI](https://together.ai))

### 1. Clone and install

```bash
git clone https://github.com/lorddannykay/ByteOS.git
cd ByteOS
```

### 2. Supabase

1. Create a project at [Supabase](https://supabase.com).
2. In the SQL Editor, run the schema/migrations from your Prisma schema or the SQL provided in `ECOSYSTEM.md` (and any triggers/policies as documented).
3. Note your project URL, anon key, and service role key.

### 3. ByteOS Studio (admin)

```bash
cd byteos-studio
cp .env.example .env.local   # or create .env.local
# Set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, DIRECT_URL, TOGETHER_API_KEY
npm install
npx prisma db push
npm run dev
```

→ **http://localhost:3000**

### 4. ByteOS Learn (learner)

```bash
cd byteos-learn
cp .env.example .env.local
# Use the SAME Supabase keys; add TOGETHER_API_KEY for Sudar
npm install
npm run dev
```

→ **http://localhost:3001**

### 5. (Optional) ByteOS Intelligence

```bash
cd byteos-intelligence
pip install -r requirements.txt
# Configure .env and run
uvicorn src.api.main:app --reload --port 8000
```

---

## Features (high level)

| Area | Capabilities |
|------|----------------|
| **Authoring** | AI course generation (outline + modules + quizzes), markdown content, adaptive/mandatory paths, assign learners + due dates. |
| **Learning** | Personalised dashboard, streaks & progress, Sudar tutor (RAG + memory), quizzes, text selection → Sudar, learning paths with unlock rules. |
| **Intelligence** | Next-best-action, onboarding assessment, struggle detection from quizzes, adaptive path ordering, personalised welcome. |
| **Compliance** | Path/course assignments, due dates, compliance view (overdue / at-risk / on-track), certificates with shareable verification link. |

See [docs/PRODUCT_FEATURES.md](./docs/PRODUCT_FEATURES.md) for the full specification.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Studio & Learn | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL); Prisma in Studio |
| Auth | Supabase Auth |
| AI | Together AI (primary), OpenAI/Anthropic (fallback) |
| Intelligence | Python FastAPI (optional) |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [UPDATES.md](./UPDATES.md) | **Phase-wise build log & upcoming** — updated as we ship; use for daily commits. |
| [ECOSYSTEM.md](./ECOSYSTEM.md) | Architecture, schema, phases — **read first** when contributing. |
| [RESEARCH_FOUNDATION.md](./RESEARCH_FOUNDATION.md) | Learning sciences, evidence base, the gap ByteOS fills, citation. |
| [AGENTS.md](./AGENTS.md) | Instructions for AI coding agents. |
| [docs/STRATEGIC_PATH.md](./docs/STRATEGIC_PATH.md) | Vision alignment and roadmap. |
| [PROGRESS.md](./PROGRESS.md) | Next 3 outcomes and quick context for contributors/agents. |
| [docs/ACTION_PLANS.md](./docs/ACTION_PLANS.md) | Executable action plans. |
| [docs/Sudar-memory.md](./docs/Sudar-memory.md) | How Sudar's longitudinal memory works and where it lives in the codebase. |
| [docs/demo.md](./docs/demo.md) | Demo video link (add once recorded). |
| [docs/PRD.md](./docs/PRD.md) | Product requirements. |

---

## Contributing

We welcome contributions that align with the project’s goal: **democratising high-quality, personalised learning** using evidence-informed design. Please read [ECOSYSTEM.md](./ECOSYSTEM.md) and [AGENTS.md](./AGENTS.md) before making large changes.

1. Fork the repository.
2. Create a branch, make your changes, and add tests if applicable.
3. Open a Pull Request with a clear description of the change and how it fits the roadmap.

---

## License

ByteOS is released under the **MIT License**. See [LICENSE](./LICENSE).

---

## Citation

If you use ByteOS in research or derivative work, please cite the repository and the research foundation:

```bibtex
@software{byteos2026,
  author       = {Karunanithi, Dhanikesh and ByteOS Contributors},
  title        = {ByteOS: An AI-Native Learning Operating System},
  year         = {2026},
  url          = {https://github.com/lorddannykay/ByteOS},
  note         = {Evidence-informed adaptive learning platform with learner memory and adaptive enhancement. Creator: Dhanikesh `Dhani' Karunanithi. Research foundation: RESEARCH_FOUNDATION.md}
}
```

---

## Creator & ecosystem

**Dhanikesh "Dhani" Karunanithi** is the creator of ByteOS and the ByteAI/ByteVerse ecosystem. ByteOS is the unified Learning Operating System that emerged from years of iteration across authoring tools, LMS prototypes, and AI tutors — so the world can benefit from **learning that learns with you, for you**.

---

<p align="center">
  <strong>ByteOS</strong> — Learns with you, for you.
</p>

<p align="center">
  <sub>February 2026 · Open source · MIT</sub>
</p>
