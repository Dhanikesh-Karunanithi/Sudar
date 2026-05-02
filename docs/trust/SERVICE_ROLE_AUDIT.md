# Service-role audit

Sudar uses Supabase service-role clients in server-only routes for operations that cannot be performed with the learner/admin browser session alone. Service-role access bypasses RLS, so every callsite must have an explicit app-layer authorization check before privileged reads, writes, storage access, or auth-admin calls.

## Invariant

Every `createServiceRoleSupabaseClient()` use must satisfy one of these patterns before touching tenant data:

- Authenticated learner owns the target row (`user.id === user_id`) or is enrolled in the target course.
- Authenticated Studio user is a super admin, org admin/manager, content editor, or creator of the target course.
- Org-scoped integration key is verified against `org_members` before accepting a caller-supplied `user_id`.
- Signed token is valid, unexpired, purpose-specific, and scoped to the target object.
- Cron or internal worker call has a required shared secret that fails closed when missing.

## Audit command

Run this from the repo root to review all service-role callsites:

```bash
npm run security:audit
```

The script exits non-zero while unclassified callsites remain. That is intentional: it makes the remaining manual review queue visible in CI without pretending the sweep is complete.

## Hardened in current pass

| Area | Files | Authorization now required |
|------|-------|----------------------------|
| Cron jobs | `sudar-learn/src/app/api/cron/notification-monthly-bonus/route.ts`, `sudar-studio/src/app/api/cron/analytics-rollups/route.ts`, `sudar-studio/src/app/api/cron/compliance-reminders/route.ts` | `CRON_SECRET` must be configured and match; missing secret returns 503 |
| ALP events/embed | `sudar-learn/src/app/api/alp/events/route.ts`, `sudar-learn/src/app/api/alp/embed-token/route.ts` | Org-scoped integration keys must map requested `user_id` to `org_members` |
| SCORM storage | `sudar-learn/src/app/api/scorm/[...path]/route.ts`, `sudar-studio/src/app/api/scorm/[...path]/route.ts` | Storage path must be under `scorm-packages/{courseId}/`; learner enrollment or Studio editor rights required |
| SudarVid proxy | `sudar-learn/src/app/api/ai/generate-video/*` | Course/module enrollment required before generation; `job_id` ownership event required before status/stream/render proxying |
| Notification links | `sudar-learn/src/app/api/notifications/track/route.ts`, `sudar-learn/src/app/api/notifications/unsubscribe/route.ts` | Dedicated HMAC secrets for tracking and unsubscribe tokens |
| Dangerous admin tool | `sudar-studio/src/app/api/admin/purge-users/route.ts` | Disabled by default; requires env opt-in, super admin, same-origin request, confirmation, and keeper email |
| URL ingestion | `sudar-studio/src/app/api/ai/generate-from-document/route.ts` | SSRF-safe fetcher blocks local/private targets and limits response behavior before service-role course creation |

## Remaining audit queues

### P0/P1 route families

- Studio course/user/org management routes: confirm every route uses `requireOrgAdmin`, `requireOrgContentEditor`, `requireSuperAdmin`, or direct creator/org checks before service-role access.
- Learn learner-owned routes: confirm `getUser()` occurs before `createAdminClient()` writes and all caller-provided IDs are pinned to `user.id`.
- AI generation routes: confirm enrolled course/module checks and org AI policy checks before expensive provider calls.
- Notification routes: continue replacing raw service-role writes with typed helper functions that enforce recipient ownership or admin role.

### Recommended guardrail

ESLint now blocks importing `createClient` from `@supabase/supabase-js` outside `src/lib/supabase/server.ts`. Naming was standardized to **`createServiceRoleSupabaseClient()`** so reviewers can grep it. Optionally add CI that fails if those callsites omit approved helpers (`requireOrgAdmin`, `requireOrgContentEditor`, `requireSuperAdmin`, `rejectInvalidCronRequest`, `rejectAlpUserOutsideOrg`, `canLearnerAccessScormPath`, `canStudioUserAccessScormPath`, `canUserAccessSudarVidJob`, or equivalents).

## Residual risk

This audit document records the current hardening state. It does not replace a Supabase RLS/storage policy audit. RLS still needs to be verified independently because direct client access, storage policies, and generated database types are separate control planes.

**Repeatable checklist:** [RLS_STORAGE_AUDIT_CHECKLIST.md](./RLS_STORAGE_AUDIT_CHECKLIST.md)
