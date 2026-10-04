# Sudar glossary

| Term | Meaning |
|------|---------|
| **Sudar** | The product (AI-native Learning Operating System) **and** the AI tutor's name. Never rename the tutor. |
| **Sudar Studio** | Admin / L&D creator app (`sudar-studio`, port 3000). |
| **Sudar Learn** | Learner app (`sudar-learn`, port 3001). |
| **Sudar Intelligence** | Python FastAPI service for tutor helpers, TTS/STT, agents gateway, sim coach (`sudar-intelligence`, port 8001 locally). |
| **SudarVid** | Watch-modality video pipeline (`sudar_vid`, port 8000). |
| **SudarSim** | Roleplay simulations (text, push-to-talk, and LiveKit streaming voice). Service `sudar-sim` (port 8090). |
| **SudarNotes** | Conversational learning surface at `/journey`: living notebook + pedagogical tutor modes. Flag `NEXT_PUBLIC_SUDAR_JOURNEY`. Formerly "Sudar 2.0 / journey". |
| **Journey** | Route and code name for SudarNotes (`app/(dashboard)/journey`, `components/journey`). |
| **Teaching OS** | Shared pedagogy spine: domains -> claims -> learner mastery -> scheduler -> pedagogy engine. Code `sudar-learn/src/lib/teaching`. |
| **Domain** | A Teaching OS knowledge area (`learning_domains`), curated in Studio `/domains`, often seeded from a course. |
| **Claim** | Atomic, checkable piece of knowledge in a domain (`learning_claims`). Mastery is tracked per claim. |
| **Mastery** | Per-learner per-claim estimate (`learner_claim_mastery`), SM-2-style spacing plus a knowledge-tracing nudge. |
| **Evidence** | A graded signal (quiz answer, tutor check, sim rubric) recorded against claims via `/api/teaching/evidence`. |
| **Pedagogy modes** | intake, probe/socratic, teach, practice, check, replan, note_craft — chosen by `pedagogyEngine.ts`. |
| **NBA** | Next Best Action — the recommendation for what a learner should do next. Canonical engine in Learn. |
| **Next fifteen** | Teaching OS "next 15 minutes" plan (`/api/teaching/next-fifteen`). |
| **Digital Learner Twin** | `learner_profiles` row accumulating modality scores and behaviour signals. Never shown raw to learners. |
| **Modality** | Delivery format: text, listen, watch, map (mindmap), cards (flashcards), sim, feed, play. |
| **Persona (learning)** | One of 5 visual themes for courses (`learningPersonas.ts`). |
| **Persona (sim)** | The simulated customer/character in a SudarSim scenario, with state rules. |
| **ALP** | Adaptive Learning Layer — Sudar's API for LMS plugins (`/api/alp/*`). |
| **LAMP** | The research paper / build plan behind ALP ("Learning That Remembers You"). `docs/LAMP_BUILD_PLAN.md`. |
| **BYOM** | Bring Your Own Model — org-level private model runtime used before the platform chain. |
| **Sudar AI** | The platform-hosted model option exposed to orgs. |
| **MCP** | Model Context Protocol server (`packages/sudar-mcp`, remote at `mcp.thesudar.com`) so ChatGPT/Cursor can build Sudar courses. |
| **Cavi** | The owner's sandbox org after the 2026-09-15 clean-slate wipe. |
| **Talisma / Foundever** | Former pilot orgs; data wiped 2026-09-15. |
| **Early access** | Invite-code gate (`EARLY_ACCESS_ENABLED`) for Studio/Learn sign-up. |
| **Quality gate** | Post-generation validation, moderation, rubric scoring, and regeneration contract for authored content. |
| **Ship memory** | Rule that user/operator-facing changes update `UPDATES.md` / `docs/SHIPPED_FEATURES.md` in the same PR. |
| **Option A / Option B** | Option A: monorepo layout. Cloudflare Option B: Learn served via a Vercel proxy during migration. |
