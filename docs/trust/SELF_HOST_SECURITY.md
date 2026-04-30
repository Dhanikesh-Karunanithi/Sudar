# Self-host security checklist

Use this checklist before exposing a Sudar deployment to real learners or customer data.

## Required secrets

- `SUPABASE_SERVICE_ROLE_KEY`: server-only, never `NEXT_PUBLIC_`, rotate if exposed.
- `CRON_SECRET`: required for Studio and Learn cron endpoints; routes fail closed when missing.
- `ALP_EMBED_SIGNING_SECRET`: dedicated embed-token signing secret.
- `NOTIFICATION_UNSUBSCRIBE_SECRET`: dedicated unsubscribe-token signing secret.
- `NOTIFICATION_LINK_SIGNING_SECRET`: dedicated notification tracking-link signing secret.
- `INTELLIGENCE_SERVICE_SECRET`: required if Learn/Studio call Intelligence through service-secret auth.
- AI provider keys: store in platform secret manager; do not commit to `.env`.

## Supabase

- Enable RLS on every exposed `public` table.
- Verify storage policies for `course-media`, avatars, and generated game/map buckets.
- Keep `course-media` SCORM paths under `scorm-packages/{courseId}/`.
- Regenerate generated Supabase TypeScript types after migrations.
- Run a cross-tenant test suite before production.

## Network and services

- Keep SudarVid private behind Learn when possible; if internet-exposed, add its own auth.
- Set `CORS_ORIGINS` explicitly for Sudar Intelligence in production. **Intelligence refuses to start** when `ENV`/`ENVIRONMENT` is `production` and `CORS_ORIGINS` is empty (no implicit localhost allowlist).
- Disable FastAPI docs in production with the documented production environment flag.
- Use Redis/Upstash or another shared store for production rate limits.

## Application controls

- Keep `ENABLE_DANGEROUS_ADMIN_TOOLS` unset in production.
- Configure `DOCUMENT_URL_HOST_ALLOWLIST` if document ingestion should only fetch approved domains.
- Review CSP and remove `unsafe-inline` / `unsafe-eval` where possible.
- Confirm email links use your deployed `NEXT_PUBLIC_APP_URL`.
- Require MFA for super-admin and organisation-admin accounts where available.

## Operations

- Turn on secret scanning and dependency scanning in CI.
- Keep backups and restore tests for Supabase/Postgres.
- Define retention windows for `learning_events`, `ai_interactions`, and notification logs.
- Maintain the subprocessor list for hosting, email, model providers, observability, and analytics.
- Publish `SECURITY.md` and `.well-known/security.txt` for private vulnerability reporting.
