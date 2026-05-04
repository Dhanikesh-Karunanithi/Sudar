# Sudar Help Center (canonical corpus)

Markdown articles in `articles/` power the in-app Help Center (Sudar Studio + Sudar Learn) and excerpts on Teach with Sudar. **`_ai/`** holds short distillates used only for model prompts (Sudar tutor + Studio agent); regenerate TypeScript embedding with **`npm run help-center:sync-ai`** from the repo root (or rely on Studio/Learn **`prebuild`**, which runs the same script).

## Frontmatter (YAML)

Every file under `articles/**/*.md`:

| Field | Required | Values / notes |
|-------|----------|----------------|
| `title` | yes | Heading shown in nav and SEO. |
| `description` | recommended | Summary for hub cards and search. |
| `audience` | yes | `learner` \| `admin` \| `both` |
| `category` | yes | Stable slug used for grouping (`start-here`, `learners`, `admins`, `ai-literacy`, `trust`, `success`). |
| `order` | yes | Sort order within category (integer). |
| `marketing` | optional | `true` = safe for public marketing site (full article on teachwithsudar). Omit or `false` for internal-only ops/env detail. |

## When to update

1. **UI navigation or sidebar labels change** → update `_ai/learn-navigation.md` and/or `_ai/studio-navigation.md`, then **`npm run help-center:sync-ai`**.
2. **New learner or admin workflows** → add or edit `articles/**/*.md`; keep marketing flag accurate for Teach with Sudar.
3. **Major product releases** → align with `ECOSYSTEM.md` and link out to deeper `docs/` (ALP_API, AGENTS_PLATFORM, trust pack) rather than copying secrets or env values here.

## Search (phase 2)

Phase 1 search is client-side Fuse.js over titles and descriptions baked into the Hub. For large corpora, consider **[Pagefind](https://pagefind.app/)**: static index at post-build; document in CI when/if adopted.

## Layout

```
help-center/
  README.md           ← this file
  _ai/                ← distillates for codegen only (not shown in Help Center UI)
  articles/           ← learner/admin facing articles only
  meta/manifest.json ← auto-generated index (slugs + frontmatter snapshot); run `npm run help-center:sync-ai`
```

The apps still scan `articles/` directly at runtime; the manifest is for tooling, CI drift checks, and Teach with Sudar–style indexing without re-parsing every file.

## Deploy note

Apps resolve content with **`process.cwd()/../help-center`** or **`HELP_CENTER_ROOT`**. Deployments that checkout only `sudar-studio/` **without** the repo root must set **`HELP_CENTER_ROOT`** to a path that includes this folder.
