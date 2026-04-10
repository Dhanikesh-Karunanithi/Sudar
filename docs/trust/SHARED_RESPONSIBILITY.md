# Shared responsibility

## Sudar (software vendor / operator)

- Application security patterns (RLS, server-side AI keys, input checks for high-risk patterns in tutor/chat).
- Providing documentation and configurable org policies where implemented.
- Not storing card data in application tables by design.

## Customer (organisation)

- Lawful basis, privacy notices, and contracts with learners/employees.
- **Content** uploaded to courses (may contain secrets or regulated data).
- SSO, HRIS, and LMS integration secrets.
- Retention and deletion schedules for their Supabase project or tenant.
- Calling cron endpoints (e.g. compliance reminders) with `CRON_SECRET`.
