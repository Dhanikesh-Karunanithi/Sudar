# Sudar — Progress & Next 3

**Single source of truth for "what's done" and "what's next":** [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md).  
This file is a short pointer so you and Cursor can quickly see the **Next 3** without re-reading the full strategic path.

---

## Next 3 (concrete outcomes)

Update this list after each milestone (and keep it in sync with STRATEGIC_PATH Section 3).

1. **Visibility** — Record Sudar memory demo video (1–2 min); add 2–4 screenshots to [docs/screenshots/](docs/screenshots/) and link from README.
2. **SudarVid polish** — Finalize and demo the refreshed SudarVid creator UX (timeline/loader flow) and capture before/after clips for docs.
3. **One more win** — Either ship one more modality end-to-end (e.g. Audio TTS for current module) or add compliance email reminders for at-risk/overdue.

---

## Latest checkpoint (2026-04-17)

- **Repository migration is now materially complete**: active surfaces and references are aligned around `sudar-*` paths, with legacy `byteos-*` remnants reduced to compatibility/cleanup follow-ups.
- **Learn engagement layer expanded**: gamification, check-ins, coins/rewards, achievements, notifications, and learner insight endpoints/pages were added and wired into the dashboard experience.
- **Tutor + audio experience advanced**: proactive tutor primitives, voice preview/provider status routes, and generation pipeline updates landed for richer support and media output.
- **Documentation pass updated**: roadmap, shipped features, trust/deployment references, and product docs were updated to reflect current architecture and shipped scope.

---

## Quick context for Cursor

- **Current phase**: Phases 1–4 complete; Phase 5 (Engagement & Scale) in progress. See [ECOSYSTEM.md](ECOSYSTEM.md) Section 8.
- **Sudar's memory**: Implemented in Learn API ([sudar-learn/src/app/api/tutor/query/route.ts](sudar-learn/src/app/api/tutor/query/route.ts)); see [docs/sudar-memory.md](docs/sudar-memory.md).
- **Action Plans A–C**: Complete (assign path + due date, certificate print, compliance view). See [docs/ACTION_PLANS.md](docs/ACTION_PLANS.md).
- **Time per section & completion rules**: Studio Analytics has “Time per section” (per-course, per-learner active/idle time; possible skip / over time flags). Admins can set per-module completion rule: “Learner marks complete” or “Minimum time on section” (minutes). Learn enforces min time using active (tab-visible) time only.
- **SudarVid status**: Creator-side overhaul landed in `sudar_vid` (timeline editing, loader UX, expanded media pipeline and templates); pending final demo capture and README visuals.

---

*Sudar — Learns with you, for you.*
