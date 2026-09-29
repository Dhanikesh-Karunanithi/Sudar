# Known gaps and risks

What testers or contributors could hit today, with the intended fix. Remove a row when it ships (and log it in `UPDATES.md`).

Last reviewed: 2026-09-29.

## Content quality
| Gap | Impact | Plan |
|---|---|---|
| Fact-checking is citation-level only (each `[N]` must map to a real source); claims are not verified against source text | Plausible but wrong statements can survive in un-sourced modules | Claim-level entailment check against retrieved chunks; flag for human review |
| Moderation chain (`CONTENT_MODERATION_MODE=auto`): Llama Guard via Together → OpenAI moderation → local keyword screen | Environments without Together/OpenAI keys only get the keyword screen | Keep Together key set in every deployed env; monitor moderation fallbacks |
| Learn-side generators (flashcards, mind map, personalised audio/video scripts) are moderated but not rubric-scored | Lower quality floor than authored modules | Route through `shared/content-generation/quality.ts` gate |
| Golden-set eval runs in CI as non-blocking | Prompt regressions are visible but not blocking | Make blocking once 3 baseline runs are stable |
| SudarVid content planner calls Together directly (outside the shared provider chain) | Video scripts skip the Studio quality gate | Route planner output through the shared gate |

## Learner experience
| Gap | Impact | Plan |
|---|---|---|
| Streaming voice needs 3 paid keys (LiveKit, Deepgram, Cartesia) plus Docker locally | Voice falls back to push-to-talk or typed when missing | Fallback is visible; document in tester guide |
| SudarNotes notebook sync is last-write-wins per thread | Two open tabs can overwrite each other | Add `updated_at` conflict check |
| SudarFeed / SudarPlay modalities are placeholders | Not in beta scope | Hidden from navigation |

## Security and ops
| Gap | Impact | Plan |
|---|---|---|
| One Supabase project for prod and staging | Tester data sits beside the sandbox org | Testers are in the **Sudar Beta** org (D-020); staging branch later |
| Rate limiting covers invite codes only (plus per-user AI usage caps) | Other unauthenticated endpoints (waitlist) can be hammered | Reuse `shared/access/rateLimit.ts` on waitlist + auth callbacks |
| Studio and Learn `tsc` report stale generated DB types (~150 / ~290 errors; builds ignore type errors) | Type regressions can slip through | Regenerate `types/database.ts` from Supabase, then drop `ignoreBuildErrors` |
| CSP still allows `unsafe-inline` / `unsafe-eval` | Weaker XSS defence | Nonce-based CSP after beta |
| FORCE RLS (Phase 3 of the sub-plan) deferred | Service-role code paths are the main guard | Keep `security:audit` REVIEW queue shrinking |
| `security:audit` is non-blocking in CI (157 REVIEW callsites) | New unscoped service-role use isn't blocked | Burn down queue, then `SECURITY_AUDIT_STRICT=1` |
| Intelligence, sudar-sim, SudarVid, MCP worker deploy manually | Drift between repo and prod services | Add deploy workflows post-beta |
| `npm audit --omit=dev` still reports 7 high in Learn/Studio (Next's bundled `postcss`, `sharp`, `ws`, `next-intl`, `adm-zip`, `file-type`) after the Next 15.5.26 patch | CI audit gate passes (no criticals) but the highs remain; fixes need major bumps | Upgrade `next-intl` / `sharp` / Next 16 after beta, one PR each |
| Beta PR stack (#112–#117) slices are not individually buildable (e.g. #112 imports modules added in #113) | Merging only the bottom PR would break `main` | Land the whole stack together, top-down |
