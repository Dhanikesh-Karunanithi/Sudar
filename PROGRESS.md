# ByteOS — Progress & Next 3

**Single source of truth for "what's done" and "what's next":** [docs/STRATEGIC_PATH.md](docs/STRATEGIC_PATH.md).  
This file is a short pointer so you and Cursor can quickly see the **Next 3** without re-reading the full strategic path.

---

## Next 3 (concrete outcomes)

Update this list after each milestone (and keep it in sync with STRATEGIC_PATH Section 3).

1. **Visibility** — Record Sudar memory demo video (1–2 min); add 2–4 screenshots to [docs/screenshots/](docs/screenshots/) and link from README.
2. **Ship recent work** — Commit and document Flashcards modality, document-to-course (generate-from-document), and SCORM 1.2 import; update current state in STRATEGIC_PATH Section 2.
3. **One more win** — Either ship one more modality end-to-end (e.g. Audio TTS for current module) or add compliance email reminders for at-risk/overdue.

---

## Quick context for Cursor

- **Current phase**: Phases 1–4 complete; Phase 5 (Engagement & Scale) not started. See [ECOSYSTEM.md](ECOSYSTEM.md) Section 8.
- **Sudar's memory**: Implemented in Learn API ([byteos-learn/src/app/api/tutor/query/route.ts](byteos-learn/src/app/api/tutor/query/route.ts)); see [docs/sudar-memory.md](docs/sudar-memory.md).
- **Action Plans A–C**: Complete (assign path + due date, certificate print, compliance view). See [docs/ACTION_PLANS.md](docs/ACTION_PLANS.md).
- **Time per section & completion rules**: Studio Analytics has “Time per section” (per-course, per-learner active/idle time; possible skip / over time flags). Admins can set per-module completion rule: “Learner marks complete” or “Minimum time on section” (minutes). Learn enforces min time using active (tab-visible) time only.

---

*ByteOS — Learns with you, for you.*
