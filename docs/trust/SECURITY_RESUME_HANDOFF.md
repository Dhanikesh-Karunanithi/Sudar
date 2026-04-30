# Security resume handoff

Last updated: 2026-04-28

Use this as the starting point when resuming Sudar security hardening.

## Summary

The urgent security pass focused on making Sudar safer for end users and organisations despite being open source. The main risks found were fail-open privileged routes, service-role APIs missing object-level authorization, SSRF in document ingestion, unsafe token/link secret reuse, and trust documentation gaps.

The highest-risk items are now addressed in code and documented in the trust pack. The remaining work is mostly build hygiene, CI/security gates, deeper service-role review, RLS/storage validation, and production hardening.

## Completed

### P0 app-layer hardening

- **Cron fail-closed**
  - Added `rejectInvalidCronRequest()` helpers in Learn and Studio.
  - Updated:
    - `sudar-learn/src/app/api/cron/notification-monthly-bonus/route.ts`
    - `sudar-studio/src/app/api/cron/analytics-rollups/route.ts`
    - `sudar-studio/src/app/api/cron/compliance-reminders/route.ts`
  - Rationale: cron endpoints previously ran unauthenticated if `CRON_SECRET` was unset.

- **ALP org scoping**
  - Added reusable ALP org check in `sudar-learn/src/lib/alp-auth.ts`.
  - Learn **middleware** now treats `/api/alp/*` and `/alp/embed` as public prefixes so LMS server-to-server and iframe flows are not redirected to `/login`; routes still require integration keys or signed embed tokens.
  - Updated:
    - `sudar-learn/src/app/api/alp/events/route.ts`
    - `sudar-learn/src/app/api/alp/embed-token/route.ts`
  - Rationale: org-scoped integration keys could previously target arbitrary `user_id` values.

- **Dedicated embed signing**
  - Added `ALP_EMBED_SIGNING_SECRET` support.
  - Removed fallback from embed signing to `ALP_API_KEY`.
  - Updated docs and `.env.example`.
  - Rationale: integration API keys and signing keys have different blast radii.

- **SCORM storage authorization**
  - Added SCORM access helpers:
    - `sudar-learn/src/lib/security/scormAccess.ts`
    - `sudar-studio/src/lib/security/scormAccess.ts`
  - Updated Learn/Studio SCORM proxies.
  - Rationale: SCORM proxy used service role to download arbitrary `course-media` paths.

- **SudarVid job ownership**
  - Added `sudar-learn/src/lib/security/sudarVidAccess.ts`.
  - Updated generate/status/stream/render routes under `sudar-learn/src/app/api/ai/generate-video/`.
  - Rationale: authenticated users could proxy other jobs if `jobId` was known.

- **SSRF-safe document ingestion**
  - Added `sudar-studio/src/lib/security/safeFetch.ts`.
  - Updated `sudar-studio/src/app/api/ai/generate-from-document/route.ts`.
  - Rationale: logged-in creators could make Studio fetch arbitrary URLs, including internal targets.

- **Dangerous admin tooling hardening**
  - Updated `sudar-studio/src/app/api/admin/purge-users/route.ts`.
  - Now disabled by default and gated by:
    - `ENABLE_DANGEROUS_ADMIN_TOOLS=true`
    - `PURGE_KEEP_EMAIL`
    - super-admin check
    - same-origin check
    - typed confirmation
    - paginated auth user listing
  - Rationale: route previously used a hardcoded keeper email and POST form without CSRF/origin protection.

- **Notification/link signing**
  - Updated `shared/notifications/unsubscribeToken.ts` to require `NOTIFICATION_UNSUBSCRIBE_SECRET`.
  - Added `shared/notifications/trackingToken.ts`.
  - Updated `sudar-learn/src/app/api/notifications/track/route.ts`.
  - Restricted email CTA links in `sudar-learn/src/lib/notifications/dispatch.ts` to safe relative paths.
  - Rationale: links should not rely on service-role keys or unsigned query params.

- **Same-origin guard**
  - Added:
    - `sudar-learn/src/lib/security/sameOrigin.ts`
    - `sudar-studio/src/lib/security/sameOrigin.ts`
  - Applied to sensitive/high-impact routes.
  - Rationale: cookie-authenticated state-changing routes need basic CSRF/origin defense.

### Tests and audit support

- Added focused tests:
  - `sudar-learn/src/lib/security/securityHelpers.test.ts`
- Added service-role audit script:
  - `scripts/security-audit.mjs`
  - `package.json` script: `npm run security:audit`
- Added service-role audit docs:
  - `docs/trust/SERVICE_ROLE_AUDIT.md`
- Added typed shared notification DB shim:
  - `shared/notifications/dbTypes.ts`
- Added `web-push` type shim:
  - `sudar-learn/src/types/web-push.d.ts`

### Trust and OSS docs

- Added:
  - `SECURITY.md`
  - `.well-known/security.txt`
  - `docs/trust/SELF_HOST_SECURITY.md`
  - `docs/trust/SERVICE_ROLE_AUDIT.md`
- Updated:
  - `docs/trust/README.md`
  - `docs/trust/THREAT_MODEL.md`
  - `docs/trust/DATA_FLOWS.md`
  - `docs/trust/POSTURE.md`
  - `docs/ENV_REFERENCE.md`
  - `docs/ALP_API.md`
- Rationale: Sudar should market trust through concrete controls: fail-closed jobs, tenant-aware service-role use, dedicated signing secrets, SSRF-resistant ingestion, and safer admin operations.

## Validation completed

- Focused Vitest command passed:

```bash
cd sudar-learn
npm test -- --run src/lib/security/securityHelpers.test.ts src/lib/tutor/responseContract.test.ts
```

Result on 2026-04-27: 2 files passed, 14 tests passed.

On 2026-04-28, the focused resume check passed:

```bash
cd sudar-learn
npm test -- --run src/lib/security/securityHelpers.test.ts src/lib/alp-auth.test.ts src/lib/tutor/responseContract.test.ts
```

Result: 3 files passed, 26 tests passed.

- `ReadLints` reported no linter errors in edited security/helper/doc files.
- 2026-04-28 late pass: `ReadLints` reported no diagnostics for the Supabase type repair and Studio notification route edits. Full `tsc`/Vitest rechecks could not be completed in the terminal session because spawned commands hung without producing compiler/test output and had to be terminated.
- `npx tsc --noEmit` still fails in both apps, but several security-pass blockers were removed:
  - Shared notification `never` errors in Learn were reduced by `shared/notifications/dbTypes.ts`.
  - `web-push` missing type error was addressed by `sudar-learn/src/types/web-push.d.ts`.
  - Next 15 dynamic route signature errors were fixed for security-touched routes.
  - 2026-04-28: remaining Next 15 page prop errors were fixed for Learn course/path/search/cert pages.
  - 2026-04-28: ALP auth helper generic errors were removed by accepting real Supabase clients through the helper boundary.
  - 2026-04-28: SudarVid handler/event logging typing issues were cleaned up.
  - 2026-04-28 late pass: Learn database type gaps were patched for `learning_paths`, `certifications`, and foreign-key relationships used by course/module/path/cert queries.
  - 2026-04-28 late pass: Studio notification template and delivery log inserts were tightened to table `Insert` types.
  - 2026-04-28 late pass: Known local Learn `CourseViewer.tsx` errors were patched for `ModuleContent`, nullable generated mindmaps, and tutor error responses.

## Known remaining blockers

### Build hygiene

`npx tsc --noEmit` is still red.

Current categories after the late 2026-04-28 Supabase type repair:

- Learn/studio typecheck status needs a clean rerun in a fresh terminal. The repair pass addressed the known `learning_paths`, `certifications`, course/module relation, `CourseViewer.tsx`, and Studio notification insert categories, but full compiler confirmation is pending due terminal hangs.
- Remaining likely Learn issues, if any, are dashboard JSON/nullability shape mismatches rather than missing path/cert table definitions.
- The hand-written Learn database stub should eventually be replaced by `supabase gen types` against the real project to avoid drift.

Latest confirmed 2026-04-28 typecheck state before the late repair:

- Learn `npx tsc --noEmit --pretty false`: still red, now mostly `CourseViewer.tsx`, `never` rows from stale Supabase types, and dashboard/path/cert query shapes.
- Studio `npx tsc --noEmit --pretty false`: red with 2 notification insert/upsert type errors.

Late repair validation status:

- `ReadLints`: clean on edited files.
- Full Learn/Studio `tsc`: pending clean rerun in a fresh terminal because the commands hung with no output during this pass.
- Focused Vitest: pending rerun for the same terminal hang reason.

### Service-role audit

`npm run security:audit` now works and intentionally exits non-zero while review remains.

Latest result on 2026-04-28:

- Service-role callsites: 164
- Needs manual authZ review: 118

The script already marks hardened P0 areas as OK. Remaining review is mostly broad Learn/Studio route families that need classification, not necessarily all vulnerabilities.

### RLS/storage audit

Not yet executed against a live Supabase project.

Still needed:

- Confirm every exposed public table has RLS enabled.
- Confirm storage policies for `course-media`, avatars, and generated game/map buckets.
- Write a repeatable RLS test suite or SQL checklist.

### Intelligence hardening

Still pending:

- Standardize production flag (`ENV` / `ENVIRONMENT`).
- Require explicit `CORS_ORIGINS` in production.
- Restrict CORS methods/headers.
- Set JWT audience verification where possible.
- Move rate limiting from in-memory to Redis/Upstash for production.

### CI/security gates

Current status:

- `.github/workflows/ci.yml` exists locally and currently runs Learn lint/test/build, Studio lint/build, dependency audit, and non-blocking `npm run security:audit`.
- The workflow was untracked in the 2026-04-28 `git status`; commit it when ready so GitHub Actions will run.
- Add explicit `npx tsc --noEmit` jobs once app typechecks are green enough, or add them as non-blocking visibility gates first.
- Secret scanning is still pending.

## Recommended next plan

### Next focused pass: CI and build hygiene

1. Rerun Learn and Studio `npx tsc --noEmit --pretty false` in a fresh terminal.
2. Fix any remaining dashboard JSON/nullability shape errors from the new compiler output.
3. Replace the Learn/Studio database stubs with generated Supabase types when project credentials are available.
4. Commit the existing CI workflow when ready, then add explicit typecheck and secret-scanning gates.

### Then: service-role review pass

1. Classify the 118 `REVIEW` callsites from `npm run security:audit`.
2. Add/standardize helpers for common authorization patterns:
   - learner owns row
   - learner enrolled in course/path
   - Studio content editor for course
   - org admin/manager
   - super admin
   - signed token
3. Update `docs/trust/SERVICE_ROLE_AUDIT.md` as callsites move from review to OK.

### Then: RLS/storage and Intelligence

1. Run Supabase RLS/storage audit.
2. Add SQL or test harness for cross-tenant denial checks.
3. Harden Sudar Intelligence production config.

## Commands to resume with

```bash
# Focused tests
cd sudar-learn
npm test -- --run src/lib/security/securityHelpers.test.ts src/lib/alp-auth.test.ts src/lib/tutor/responseContract.test.ts

# Learn typecheck
npx tsc --noEmit --pretty false

# Studio typecheck
cd ../sudar-studio
npx tsc --noEmit --pretty false

# Service-role audit
cd ..
npm run security:audit
```

## Important caution

Do not read or commit `.env.local` files. They may contain live Supabase, AI provider, email, or signing secrets.

Also note that unrelated research paper files were already modified/untracked during this session. Keep security commits separate from research/paper changes.
