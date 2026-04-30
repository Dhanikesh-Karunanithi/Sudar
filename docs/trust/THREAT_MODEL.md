# Threat model (application)

Living document; extend when adding routes that accept URLs or HTML.

| Threat | Mitigation direction |
|--------|---------------------|
| Prompt injection | System/user separation; strip role override lines; do not execute model output as code; whitelist tutor/Studio actions |
| Sensitive data in prompts | Pre-LLM pattern scan (Luhn PAN, SSN-style, keys); org toggle to disable only with care |
| XSS / stored content | Safe markdown/HTML rendering; sandbox SCORM; CSP where possible |
| Tutor “rich” blocks (choice_group, media_card, etc.) | Model output is parsed as JSON, **Zod-validated** per block type; `media_card` / links require http(s) and basic host safety; no execution of model HTML/JS; interactive_demo allows only **curated** `component_id` values; cookie `POST /api/tutor/choice` is same-origin gated |
| Tutor web enrichment | Google Custom Search only on server; gated by org `tutor_web_enrichment_enabled` and `TUTOR_WEB_ENRICHMENT_ENABLED`; results rendered as `media_card` with attribution — learners should verify against course content |
| Future tutor URL page fetch | Use Learn `safeFetchText` (same SSRF model as Studio: `DOCUMENT_URL_HOST_ALLOWLIST`, no redirects to private networks) if HTML ingestion is added |
| SQL injection | Parameterised Supabase/Prisma queries only |
| SSRF | User-driven document URL ingestion uses an SSRF-safe fetcher: `http`/`https` only, blocks local/private IPs, rejects redirects, enforces size/time limits, and supports `DOCUMENT_URL_HOST_ALLOWLIST` |
| Auth abuse | Rate limits on tutor; fail-closed `CRON_SECRET` on scheduled routes; short-lived embed tokens signed with dedicated secrets; Learn middleware allows `/api/alp/*` and `/alp/embed` without a browser session so route handlers must enforce ALP keys and embed signatures |
| Scheduled job abuse | Studio and Learn cron routes require `CRON_SECRET` in `Authorization: Bearer` or query; missing `CRON_SECRET` returns 503 rather than running unauthenticated |
| Storage proxy IDOR | SCORM proxies resolve storage paths to `scorm-packages/{courseId}/...` and require learner enrollment or Studio content-editor access before service-role download |
| Video job IDOR | SudarVid status, stream, and render proxy routes verify the job belongs to the authenticated learner through `learning_events.payload.job_id` before proxying |
| Destructive admin tools | `purge-users` is disabled unless `ENABLE_DANGEROUS_ADMIN_TOOLS=true`, requires super admin, same-origin POST, explicit confirmation, and `PURGE_KEEP_EMAIL` |
| Email link abuse | Unsubscribe and notification tracking links use dedicated HMAC secrets; learner email CTA links are restricted to same-site relative paths |
| CSRF on cookie APIs | Destructive or expensive cookie-authenticated POST routes use same-origin checks (`Origin` / `Sec-Fetch-Site`) before continuing |
| Supply chain | Lockfiles, monitor CVEs, upgrade cadence |
