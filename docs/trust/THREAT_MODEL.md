# Threat model (application)

Living document; extend when adding routes that accept URLs or HTML.

| Threat | Mitigation direction |
|--------|---------------------|
| Prompt injection | System/user separation; strip role override lines; do not execute model output as code; whitelist tutor/Studio actions |
| Sensitive data in prompts | Pre-LLM pattern scan (Luhn PAN, SSN-style, keys); org toggle to disable only with care |
| XSS / stored content | Safe markdown/HTML rendering; sandbox SCORM; CSP where possible |
| SQL injection | Parameterised Supabase/Prisma queries only |
| SSRF | Avoid fetching arbitrary user URLs; allowlists for webhooks |
| Auth abuse | Rate limits on tutor; `CRON_SECRET` on scheduled routes; short-lived embed tokens |
| Scheduled job abuse | `byteos-studio` cron routes (e.g. compliance reminders): require `CRON_SECRET` in `Authorization: Bearer` or query; never expose without auth |
| Supply chain | Lockfiles, monitor CVEs, upgrade cadence |
