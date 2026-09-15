# Sudar — Progress & Next 3

**Single source of truth for "what's done" and "what's next":** [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md).  
This file is a short pointer so you and Cursor can quickly see the **Next 3** without re-reading the full strategic path.

---

## Next 3 (concrete outcomes)

Update this list after each milestone (and keep it in sync with STRATEGIC_PATH Section 3).

1. **Security / trust** — Complete RLS/RAG/Bearer sub-plan after review ([docs/RLS_RAG_BEARER_SUBPLAN.md](docs/RLS_RAG_BEARER_SUBPLAN.md)); keep [docs/CLOUDFLARE_PAGES_DEPLOY.md](docs/CLOUDFLARE_PAGES_DEPLOY.md) current for Studio/Learn prod.
2. **Visibility** — Record Sudar memory / SudarNotes demo video (1–2 min); add 2–4 screenshots to [docs/screenshots/](docs/screenshots/) and link from README.
3. **Teaching OS loop** — Prove closed loop on the seeded domain (checks → mastery → NBA “Next 15 minutes”); expand Studio Domains curator as needed. See [docs/TEACHING_OS.md](docs/TEACHING_OS.md).

---

## Latest checkpoint (2026-09-15)

- **Security P0**: Public invite codes revoked (`EARLY_TALISMA`, `CURSOR-HIRE-*`); `security:audit` matcher restored for `createServiceRoleSupabaseClient()`.
- **Docs truth-sync**: AGENTS / ECOSYSTEM / PROGRESS aligned with Cloudflare prod, Learn-owned NBA, SudarSim, MCP, 5 personas.
- Prior (2026-07-28): SudarNotes + Teaching OS spine. See **UPDATES.md** Latest for MCP (2026-09-10) and SudarSim voice.

---

## Quick context for Cursor

- **Current phase**: Phases 1–4 complete; Phase 5 (Engagement & Scale) in progress. See [ECOSYSTEM.md](ECOSYSTEM.md) Section 8.
- **Prod deploy**: Studio + Learn → **Cloudflare Workers (OpenNext)**; marketing → Cloudflare Pages. Intelligence / SudarVid / SudarSim / MCP workers: manual or host-specific (Render/Railway/OCI/Wrangler).
- **Sudar's memory**: Implemented in Learn API ([sudar-learn/src/app/api/tutor/query/route.ts](sudar-learn/src/app/api/tutor/query/route.ts)); see [docs/sudar-memory.md](docs/sudar-memory.md).
- **NBA**: Canonical engine in [sudar-learn/src/lib/intelligence/nextBestActionEngine.ts](sudar-learn/src/lib/intelligence/nextBestActionEngine.ts).
- **SudarNotes**: [docs/SUDAR_2_0_VISION.md](docs/SUDAR_2_0_VISION.md); code under `sudar-learn/src/lib/sudarNotes/` and `components/journey/`.
- **Teaching OS**: [docs/TEACHING_OS.md](docs/TEACHING_OS.md); code under `sudar-learn/src/lib/teaching/`.
- **Structural cleanup**: [docs/STRUCTURAL_CLEANUP_AUDIT.md](docs/STRUCTURAL_CLEANUP_AUDIT.md).
- **SudarVid status**: Creator-side overhaul landed in `sudar_vid`; pending final demo capture and README visuals.

---

*Sudar — Learns with you, for you.*
