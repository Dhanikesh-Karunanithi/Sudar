# Cursor Education Portfolio (Sudar)

Interactive SCORM 1.2 courses that simulate **Cursor IDE / DevEx Console / Launch Board** learning environments, hosted on Sudar for the Director, Product Education Engineering application.

## What's here

| Artifact | Location |
|----------|----------|
| Course outlines (locked) | [OUTLINES.md](OUTLINES.md) |
| Fluency metrics glossary | [FLUENCY_METRICS.md](FLUENCY_METRICS.md) |
| Demo script | [DEMO_SCRIPT.md](DEMO_SCRIPT.md) |
| Application essay drafts | [APPLICATION_ANSWERS.md](APPLICATION_ANSWERS.md) |
| SCORM sources | `course-1-fluent/`, `course-2-org-adoption/`, `course-3-edu-ops/` |
| Shared IDE shell | `shared/shell.js`, `shared/shell.css` |
| Built ZIPs | `dist/*.zip` |
| Credentials (gitignored) | `credentials.local` |

## Rebuild locally

These two commands are **how you rebuild and push** the interactive SCORM packages to Sudar (not required every time you open Learn — already run once):

```bash
# 1) Compile course JSON + IDE shell into SCORM 1.2 ZIPs under dist/
node portfolio/cursor-education/scripts/build-scorm.mjs

# 2) Upload those ZIPs into the Cursor Education Portfolio org (courses + path + enrollments)
node --env-file=sudar-studio/.env.local portfolio/cursor-education/scripts/upload-to-sudar.mjs
```

Re-run only when you change course content or the shell.

## Live org

- **Org:** Cursor Education Portfolio (`cursor-education`)
- **Path:** Cursor Developer Fluency Program (certificate enabled)
- **Invite codes:** `CURSOR-HIRE-01`, `CURSOR-HIRE-02`, `CURSOR-HIRE-03`
- **Test users:** see `credentials.local` (not committed)

## Design principle

> The course *is* Cursor. Content lives in Explorer, Agent Chat, Terminal, and Browser—not beside them.
