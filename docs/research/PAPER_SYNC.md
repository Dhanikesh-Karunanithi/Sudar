# Keeping the Paper Aligned With the Build

**Purpose:** So the LAMP/ALP paper and any arXiv or submission drafts stay accurate and reflect what is actually shipped, this doc defines a lightweight **paper sync** process. Use it whenever you ship a feature or change the roadmap.

---

## When to update the paper

- **After shipping a feature** that the paper describes as “planned” or “in progress” (e.g. a new modality, compliance reminders, SCORM import).
- **When changing the roadmap** (e.g. pilot timing, ALP phases, “remaining” items).
- **Before a submission or demo** (quick pass over implementation and limitations).

---

## What to update

| Source of truth (ship / roadmap) | Paper artifacts to touch |
|----------------------------------|---------------------------|
| [docs/SHIPPED_FEATURES.md](../SHIPPED_FEATURES.md) | [docs/research/paper.tex](paper.tex) (LaTeX), [docs/LAMP-Updated-Draft.md](../LAMP-Updated-Draft.md) (Markdown) |
| [docs/STRATEGIC_PATH.md](../STRATEGIC_PATH.md) §2 (Current state) | Same: paper.tex §Implementation / §Evidence; LAMP-Updated-Draft §4 “Currently implemented” and “Remaining planned” |
| [docs/ACTION_PLANS.md](../ACTION_PLANS.md) (Plan D, pilot) | paper.tex “Pilot planned / in progress”; LAMP-Updated-Draft pilot and OSS wording |

---

## Checklist per update

1. **SHIPPED_FEATURES.md**  
   Already the single list of what’s shipped. When you add something here, continue to step 2.

2. **paper.tex**  
   - **§3 Modality (Modality-Agnostic Delivery):**  
     - List only modalities that are actually implemented; mark others as “planned” or “in progress” as appropriate.  
     - If you add a new modality (e.g. Listen/Audio TTS), add it to the list and to the implementation paragraph.
   - **§Implementation / §Evidence (proof of concept):**  
     - One paragraph that summarises “what the reference platform currently implements.”  
     - Keep it in sync with SHIPPED_FEATURES and STRATEGIC_PATH §2: document-to-course, SCORM import, modalities (text, listen, flashcards, mindmap, video, podcast, SCORM), compliance view and **compliance email reminders**, analytics, tutor memory, paths/certs, etc.  
     - Remove “in progress” for anything that is now shipped.
   - **Pilot:**  
     - If pilot is not yet started: “Pilot planned … to be initiated after the current build phase” (or similar).  
     - If pilot has started: “Pilot in progress …” and point to PILOT_PLAN.md or collaboration details.

3. **LAMP-Updated-Draft.md**  
   - **§4 “Currently implemented features”:**  
     - Add any new shipped feature (e.g. Listen modality, compliance email reminders).  
     - Keep the list ordered and consistent with SHIPPED_FEATURES.
   - **“Remaining planned items”:**  
     - Move items to “implemented” when shipped; add new planned items if the roadmap changes.  
     - Note pilot/OSS timing if it changes (e.g. “Pilot and Claude-for-OSS after build complete”).

4. **Repository URL (if you standardise on Sudar):**  
   - paper.tex and LAMP-Updated-Draft currently reference the repo; if the canonical repo becomes **https://github.com/Dhanikesh-Karunanithi/Sudar**, update all repo URLs in both files (author block, footnotes, acknowledgments, call for collaboration).

---

## Who does it

- **Developers / agents:** When merging a feature that is mentioned in the paper, update paper.tex and/or LAMP-Updated-Draft per the checklist above and mention “Paper sync: …” in the PR or commit.
- **Author / maintainer:** Before any submission or major release, do a full pass using SHIPPED_FEATURES and STRATEGIC_PATH §2 as the source of truth.

---

## Quick reference: where things live in the paper

| Topic | paper.tex | LAMP-Updated-Draft.md |
|-------|-----------|------------------------|
| Modalities (what’s implemented) | §3.4 Modality-Agnostic Delivery | §3.4 Modality-Agnostic Delivery; §4 Currently implemented |
| Implementation summary | §Implementation; proof-of-concept paragraph in §Evidence | §4 Currently implemented / Remaining planned |
| Compliance (view + reminders) | §Evidence (proof of concept) | §4 implemented list |
| Pilot | §Evidence “Pilot planned” | §4 Remaining planned (and evaluation section if present) |
| ALP / plugin architecture | §3.5 (ALP); §Implementation | §3.6; §4 |

---

## When you're ready to continue writing the paper

Use this as a quick re-entry checklist:

1. **Source of truth for “what’s built”**: [docs/SHIPPED_FEATURES.md](../SHIPPED_FEATURES.md) and [docs/STRATEGIC_PATH.md](../STRATEGIC_PATH.md) §2. Ensure nothing new you shipped is missing from either.

2. **Paper artifacts to edit**:
   - **LaTeX**: [docs/research/paper.tex](paper.tex) — §Implementation (currently implemented list), §Evidence (proof of concept, pilot sentence), §Discussion (limitations) if needed.
   - **Markdown draft**: [docs/LAMP-Updated-Draft.md](../LAMP-Updated-Draft.md) — §4 “Currently implemented features” and “Remaining planned items”.

3. **Sync steps** (from checklist above): Update the “Currently implemented” paragraph in paper.tex to match SHIPPED_FEATURES; move any “in progress” to “implemented” in LAMP-Updated-Draft; keep pilot wording consistent (“planned … to be initiated after the current build phase” until O1 starts).

4. **Build status**: Phase 1 (Build) and Phase 2 (Paper) are complete per [docs/LAMP_BUILD_TRACKER.md](../LAMP_BUILD_TRACKER.md). Phase 3 (Pilot O1, Claude-for-OSS O2) is not started — paper should say “pilot planned” not “pilot in progress”.

5. **Deployment**: Production deployment (Vercel for Studio/Learn, Railway/Render/Fly for Intelligence) is documented and reflected in SHIPPED_FEATURES; add a sentence in paper.tex §Implementation if you want the paper to explicitly mention production hosting options.

---

*Last updated: March 2026. Keep this file in the repo so agents and contributors know how to keep the paper aligned with the build.*
