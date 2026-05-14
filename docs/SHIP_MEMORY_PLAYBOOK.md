# Sudar — Ship memory playbook

**Coding agents (Cursor):** This repo loads **`.cursor/rules/sudar-ship-memory.mdc`** with `alwaysApply: true`, so ship-memory expectations apply every session unless the user explicitly defers docs.

This playbook tells **humans and coding agents** what to update when work ships, so the repo stays a trustworthy record of **what exists**, **why it matters**, and **where the code lives**.

For product philosophy and schema, see [ECOSYSTEM.md](../ECOSYSTEM.md) and [AGENTS.md](../AGENTS.md).

---

## The two ship documents

| Document | Role | When to touch it |
|----------|------|------------------|
| [UPDATES.md](../UPDATES.md) | **Dated development log** — narrative of what changed and when (phases, days, or milestones). | Add a **Latest** entry when you merge meaningful work: user-visible features, notable refactors, ops/deploy changes, or doc waves. Follow the format already described at the top of `UPDATES.md`. |
| [SHIPPED_FEATURES.md](SHIPPED_FEATURES.md) | **Durable capability catalog** — each section is a shipped capability with **Where / What / Key files / Flow** (and **Env** / **Database** when relevant). | Add or extend a section when the change is **user-visible**, **operator-deployable**, or a **new contract** (API, env, migration) that others must discover from the repo. |

### Decision table

| Change type | UPDATES.md | SHIPPED_FEATURES.md |
|-------------|------------|---------------------|
| New learner or admin UI, new modality tab, new tutor behavior learners see | Yes (dated entry) | Yes (new or extended section) |
| New or changed API route, cron, or env var operators rely on | Yes | Yes (include **Key files**, **Flow**, **Env** as needed) |
| New Supabase migration affecting behavior or operators | Yes | Yes (mention migration path under **Database** or **Key files**) |
| Bugfix, no contract or UX change | Optional one-liner in Latest | No |
| Internal refactor, tests only, lint | Optional or omit | No |
| Docs-only (typos, clarifications) | Optional | Only if correcting a shipped-feature description |

---

## Roadmap and trackers (do not fork)

- When a merge **closes a roadmap gap**, align wording with [STRATEGIC_PATH.md](STRATEGIC_PATH.md) and [ACTION_PLANS.md](ACTION_PLANS.md) (check off or edit there as your process allows).
- **LAMP / ALP** work: after each task, update [LAMP_BUILD_TRACKER.md](LAMP_BUILD_TRACKER.md) (Status, Last updated) per [AGENTS.md](../AGENTS.md).
- New or changed env vars: document in [ENV_REFERENCE.md](ENV_REFERENCE.md) when operators must set them.

---

## Template: new section for SHIPPED_FEATURES.md

Use `---` between sections. Match the tone of existing entries (factual, path-oriented).

```markdown
## Short feature title (Studio | Learn | Intelligence)

- **Where**: Surface and route or page (e.g. Sudar Learn — course viewer — **Watch** tab).
- **What**: One tight paragraph: capability in plain language.
- **Value**: Optional bullets — **L&D / admin** vs **learner** if both care.
- **Key files**:
  - `sudar-learn/src/...` — role of this file.
  - `sudar-learn/src/app/api/.../route.ts` — API responsibility.
- **Database**: Optional — `supabase/migrations/....sql` and affected tables.
- **Env**: Optional — vars (link [ENV_REFERENCE.md](ENV_REFERENCE.md)).
- **Flow**: User or operator steps end-to-end (short numbered or bullet flow).
```

---

## Template: new Latest entry in UPDATES.md

Add **at the top** of **Latest** (newest first), per instructions in `UPDATES.md`:

```markdown
### YYYY-MM-DD — Short title

- **Theme**: One line (e.g. Learn — memory panel + preferences API).
- **Shipped**: Bullets with repo-relative paths where helpful.
- **Docs**: Note if `SHIPPED_FEATURES.md` / `ENV_REFERENCE.md` / migrations were updated.
```

---

## Telemetry and twin (reminder)

If the feature is learner-facing, confirm whether it writes to **`learning_events`**, updates **`learner_profiles`**, or logs **`ai_interactions`**, and say so in the PR and in shipped docs when it is part of the contract. See [AGENTS.md](../AGENTS.md) — “When Building a New Feature”.

---

## Agents (Cursor, Copilot, etc.)

1. Read this playbook when a task is **merge-ready** and user-visible or operator-facing.
2. Update **UPDATES.md** and/or **SHIPPED_FEATURES.md** in the **same PR** as the code when possible; otherwise open a immediate follow-up PR.
3. Prefer **real paths and flows** over marketing language; do not invent ships that are not in the diff.

---

*Sudar — Learns with you, for you.*
