# Application answers — Director, Product Education Engineering (Cursor)

Drafts that deep-link to live Sudar portfolio artifacts. Replace URLs with your Learn/Studio staging or production hosts after confirming deploy.

**Suggested links (fill host):**

- Path: `{LEARN}/paths/b44bfb7f-9188-445e-a42e-59c68659dfba` — Cursor Developer Fluency Program  
- Course 1: `{LEARN}/courses/56e01253-7e39-4eee-a903-6dd24001d802/learn` — Cursor Fluent  
- Course 2: `{LEARN}/courses/b50a236b-d06e-4897-991c-23f40eef4305/learn` — From Isolated to Org-Wide  
- Course 3: `{LEARN}/courses/53d6a056-98c9-4080-b91c-a39878fac788/learn` — Education Ops (see E03 mid-flight)  
- Invite: `CURSOR-HIRE-01` (tester tier)

Path ID: `b44bfb7f-9188-445e-a42e-59c68659dfba`  
Org ID: `89c5fbb1-127d-4075-97cc-d4922f703659`

---

## 1. Link to a technical tutorial / course / workshop you created

**Role:** Curriculum architect + platform owner (designed pedagogy, IDE-as-classroom UX, SCORM packaging, LMS hosting, fluency instrumentation).  
**Audience:** Professional developers (IC path) and eng leaders (org adoption path).  
**Artifact:** [Cursor Fluent](https://staging.learn.thesudar.com) inside Sudar — a SCORM course where the learning space *is* a Cursor-like IDE (Explorer files = sections, Agent Chat = missions, Terminal = lab checks, Browser = preview).

**One thing I’d rebuild differently today:** Instrument fluency signals (activation, agent depth, unsafe-accept catches) as first-class `learning_events` from day one of the shell—not only SCORM score.raw—so Twin/NBA can coach between missions without waiting for module_complete.

---

## 2. Experience with AI coding tools (Cursor or others)

I use Cursor as core infrastructure for product work (Sudar itself: Next.js, FastAPI, rules/`AGENTS.md`, multi-file agents, MCP for platform tools). Features I use most: Agent for multi-file changes with tests, project rules as durable context, `@` grounding, diff review before accept, and MCP when it pulls external system state (not vanity tools).

Shipped with AI coding tools: Sudar (Studio/Learn/Intelligence), ByteVerse microlearning generator, and this portfolio’s interactive SCORM shells—authored and iterated in Cursor, then hosted on Sudar.

---

## 3. Redesign content because the product changed mid-production

**Live artifact:** Education Ops course → mission **E03 Mid-flight redesign** (and E04 deprecate).

**Situation:** Composer-layout walkthrough 60% filmed; Agent layout v2 ships.

**Cut:** UI-specific screenshots and click-paths tied to the old chrome.  
**Keep:** Durable mental model (Chat vs Agent vs Tab), grounding/`@` habits, diff-review judgment.  
**Why:** Shipping wrong chrome teaches the wrong product; keeping concepts preserves fluency investment. Deprecate with redirect (`content deprecate`) so no orphan learner path.

---

## 4. Biggest mistake most technical education programs make

Optimizing for **completion and content volume** while the product ships weekly—so learners finish courses that already lie about the UI, and nobody measures whether they can *ship with the tool*.

**How I’d avoid it at Cursor:**

1. Launch-coupled DoD: capability ships with tutorial + path update + deprecate note (Course 3 E02).  
2. Fluency metrics over vanity completion (glossary + Org Adoption A04).  
3. Labs inside the product metaphor (Cursor Fluent IDE shell)—not slide decks about the IDE.  
4. Content lifecycle as a first-class system (deprecate/redirect), not a wiki cleanup day.

---

## Closing line for recruiter notes

I already run the stack this role must invent: content roadmap, interactive technical curriculum, fluency-oriented measurement, and launch coupling—demonstrated on Sudar with a Cursor-shaped learning environment hiring managers can enroll in today (`CURSOR-HIRE-*`).
