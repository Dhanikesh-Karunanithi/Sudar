# RLS and storage audit checklist (Supabase)

Run against a **staging** project before production. Record pass/fail in `docs/trust/SERVICE_ROLE_AUDIT.md` or a dated appendix.

## 1. RLS on `public` tables

- [ ] List tables in `public` (`information_schema.tables` or Supabase Table Editor).
- [ ] For each table reachable from the Data API: **RLS enabled**.
- [ ] Policies match intent: `anon` vs `authenticated` vs service role only (remember server routes use service role and bypass RLS — app-layer checks still required).

## 2. Views and security invoker

- [ ] For Postgres 15+: security-invoker views where appropriate.
- [ ] No unintended `security definer` functions exposed to `anon`/`authenticated` without review.

## 3. Storage buckets

- [ ] `course-media`, SCORM paths (`scorm-packages/{courseId}/…`), avatars, generated assets: **object-level** rules match enrollment and org membership.
- [ ] Confirm upload vs read vs delete rules for each role (learner, creator, admin).

## 4. Cross-tenant denial (manual or scripted)

- [ ] As **User A** (org 1), attempt to read/write **User B** (org 2) ids via Learn and Studio APIs (expect 403/404).
- [ ] SCORM proxy: path for course in org 1 while enrolled only in org 2 (expect deny).
- [ ] ALP: org-scoped API key with `user_id` outside org (expect 403).

## 5. Advisors

- [ ] Run Supabase **security advisors** (dashboard or CLI when available); fix critical findings.

## 6. Sign-off

- Date, environment (project ref), executor, link to exported advisor output (internal only).
