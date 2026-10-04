# Content quality in Sudar

This is how Sudar makes sure AI-generated learning content is accurate, safe, and built on learning science before a learner sees it. It covers what runs automatically, what a human reviews, how to tune it, and how to measure it.

**Code:** `shared/content-generation/quality.ts` (rubric, checks, gate), `shared/content-generation/moderation.ts`, `sudar-studio/src/lib/ai/courseGeneration/qualityGate.ts` (Studio wiring).
**Agent rule:** `.cursor/rules/content-generation.mdc`.

---

## 1. What happens to every AI-generated module

```
draft (LLM, structured prompt)
  -> judge (full module, rubric, Zod-validated)
  -> deterministic checks + citation check
  -> below threshold or critical issue? regenerate with the critique (max N retries, keep best)
  -> moderation (Llama Guard -> OpenAI -> local)
  -> save with review_status + quality
  -> Quality page review -> publish (blocked on unresolved critical issues)
```

This applies to `generate-course`, `generate-from-document`, `generate-all-modules` (all through `fillEmptyModulesForCourse`), plus `generate-module` and `generate-module-with-research`, which return the gated content and a `quality` summary to the editor.

### Prompts enforce the structure

Module prompts require, and the reviewer checks for:

| Principle | What the module must contain |
|---|---|
| Merrill: activation | First section connects to prior knowledge or a prior module |
| Worked-example effect | A `### Worked example` walked through step by step before practice |
| Merrill: application | One `[apply]` "Your turn" task where the learner produces or decides something |
| Retrieval practice | A closing `### Check yourself` with 2–3 recall questions (answers not inline) |
| Interleaving | From module 2 on, at least one recall question mixes in an earlier module's concept |
| Cognitive load | Paragraphs under 120 words, one idea per paragraph, jargon defined on first use |
| Bloom progression | Curriculum plan assigns rising Bloom levels; module writes at its level |
| Accuracy | No invented statistics, studies, quotes, or numbered citations |

### The rubric (LLM judge)

Nine dimensions, 1–10, higher is better. The overall score is a weighted mean; accuracy and objective alignment weigh most.

| Dimension | Weight | Meaning |
|---|---|---|
| `objective_alignment` | 1.5 | Every section serves the stated objectives |
| `bloom_fit` | 1 | Cognitive demand matches the target Bloom level |
| `retrieval_practice` | 1.25 | The learner must recall or apply, not only reread |
| `worked_examples` | 1 | Concrete example shown before practice |
| `cognitive_load` | 1 | Chunked, one idea at a time |
| `accuracy_risk` | 2 | 10 = well established or sourced; low = likely invented specifics |
| `interactivity` | 0.75 | Meaningful practice or reflection |
| `clarity` | 1 | Plain, concrete language |
| `engagement` | 0.75 | Work-relevant hook, scenarios |

Long modules are split on section boundaries and every part is judged. The combined score takes the **minimum** per dimension, so one weak section can't be averaged away. If the judge fails, the module is marked `needs_review`; it never gets a made-up score.

Severity rules: **critical** means a factual error, an invented statistic or citation, unsafe advice, contradicting the source, or being off-topic. Pedagogy gaps are warnings.

### Deterministic checks (no LLM)

These catch the obvious problems cheaply: no example or scenario, no retrieval prompt, a paragraph over 180 words, a module under 150 words, generic openings ("In this module…"), two or more statistics with no sources, banned stock openings, and `[N]` citations that don't map to a provided source. The last one is critical.

### Moderation

`moderateContent()` tries Llama Guard on Together first, then OpenAI `omni-moderation-latest`, then a local keyword screen. Categories that legitimately appear in corporate training are tolerated: specialised advice, non-violent crimes, privacy, defamation, and elections (compliance, legal and safety training need them). Flagged modules are saved with a critical issue, which blocks publish until a reviewer acts.

### Assessments

Quiz generation (`/api/ai/generate-quiz`) reads the full module, writes at least one question per learning objective, requires 4 distinct options and a valid answer key, and bans "all/none of the above". It repairs once when validation finds problems, and drops any question with a broken key before saving. Interactive quiz components go through the same answer-key validation, and broken ones are never shown.

### Grounding

Document-sourced courses select source passages by relevance to each module (BM25-style scoring over the title, brief and planned headings), not by position in the document. The judge receives the excerpt and treats contradicting it as critical. Research-mode modules cite numbered web results, and every `[N]` is verified against the real list.

---

## 2. Human review

Each module stores:

- `modules.review_status`: `draft` (passed automated review), `needs_review`, or `approved`. Existing modules defaulted to `approved` when the column was added.
- `modules.quality` (`StoredModuleQuality`): rubric scores, issues (dimension, severity, description, suggestion, quote), gate attempts, moderation verdict, citation check, and reviewer-resolved issue keys.

On **Studio → course → Quality** (`/courses/[id]/quality`) a reviewer sees per-dimension bars and the issue list. They can mark an issue resolved or approve a module. Every action is written to `audit_events`.

**Publish rule:** `POST /api/courses/[id]/publish` returns **409** while any non-approved module has an unresolved critical issue.

---

## 3. Configuration

| Env var | Default | Effect |
|---|---|---|
| `CONTENT_QUALITY_THRESHOLD` | `7` | Minimum overall score (1–10) to pass without review |
| `CONTENT_QUALITY_MAX_RETRIES` | `2` | Regeneration passes (0–4) |
| `CONTENT_MODERATION_MODE` | `auto` | `auto` = providers then local; `local` = local screen only; `off` = skip (dev only) |
| `CONTENT_MODERATION_MODEL` | `meta-llama/Llama-Guard-4-12B` | Together Llama Guard model id |

Per-course creator toggles (BrandSettings):

- `apply_quality_filtering=false` skips the LLM judge. Modules are then marked `needs_review`, never auto-passed.
- `strict_component_validation=false` keeps low-value but valid interactives. Broken ones are always removed.
- `vary_introductions=false` uses one consistent opening strategy.

**Cost:** each module costs one draft plus 1–4 judge calls (one per chunk) plus up to `MAX_RETRIES` regenerations and judges. A typical 5-module course costs about 2–3× the old pipeline in tokens. Lower the retries for cheap demo orgs.

---

## 4. Measuring it: the golden set

- `scripts/evals/golden/content-golden.json` holds good and bad modules and quizzes, each with its expected verdict.
- `sudar-studio/src/lib/ai/courseGeneration/contentEval.test.ts` runs the deterministic expectations in `npm test`, which blocks CI.
- `npm run eval:content` (root or Studio) also runs the **LLM judge calibration**: good samples must score 7 or above and bad ones 6.9 or below. Keys come from the environment or `sudar-studio/.env.local`. In CI, the `content-eval` job runs this non-blocking.

When you change prompts, rubric wording, weights, or the judge model, run `npm run eval:content` and put the result in the PR. When you find a new failure mode in real content, add a sample to the golden set first, then fix it.

---

## 5. Known limits

- Moderation and the LLM gate run on **Studio** generation. Learn-side generators (ALP create API, flashcards, mindmaps, MCP learner tools) use schema validation and answer-key checks but not the full gate yet.
- The judge is an LLM; it can be fooled. Human review of `needs_review` modules is the backstop, and the golden set is how we notice drift.
- There's no automated fact-checking of general claims against the web; accuracy relies on grounding, the accuracy-risk dimension, and the unsourced-statistic check.
