# Sudar — Enterprise and institutional provisioning

This document gives recommended setups and best practices for deploying Sudar in K-12, higher education, and corporate environments. Use it together with the in-app **Provisioning checklist** (Studio → Integrations) and [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md).

---

## Provisioning flow (checklist)

Set up in this order so each step has what it needs:

1. **Identity** — SSO (SAML/OIDC) via Supabase Auth so users sign in with your IdP.
2. **Directory / user sync** — Provision users and org membership (Provisioning API or HRIS/SIS sync); see [Provisioning API](#provisioning-api) and INTEGRATION_GUIDE.
3. **LMS / LTI** — ALP API keys, LTI 1.3 for Canvas/Blackboard/Moodle, embed URL; see [LTI / LMS options](#lti--lms-options).
4. **AI & API keys** — Configure in Studio → Settings → AI & API Keys; see [ENV_REFERENCE.md](./ENV_REFERENCE.md).
5. **Data** — ALP events endpoint and optional batch ingestion from your data lake.

---

## Recommended setups by segment

| Audience    | Identity                          | Directory / sync                                      | LMS / content                               | AI / keys                                                |
|------------|------------------------------------|--------------------------------------------------------|---------------------------------------------|----------------------------------------------------------|
| **K-12**   | Google Workspace SSO (Supabase)    | Clever/ClassLink or roster CSV → Provisioning API      | ALP + LTI if LMS in use                     | Together or OpenRouter (cost-effective)                  |
| **Higher ed** | University SAML/OIDC (Supabase) | SIS sync via Provisioning API or cron                 | LTI 1.3 (Canvas/Blackboard/Moodle), SCORM   | OpenRouter or OpenAI; embed in existing LMS              |
| **Corporate** | Azure AD / Okta (Supabase)      | Workday/BambooHR/Rippling → Provisioning API          | ALP for intranet/LMS; xAPI for data lake    | OpenAI/Claude for compliance; or OpenRouter for multi-model |
| **Scale**  | Dedicated Supabase project; consider HA | Batch provisioning + rate limits              | ALP keys per partner; document rate limits   | Per-org keys (optional) for billing; prefer one primary provider |

### K-12

- **Identity**: Use Supabase Auth with Google Workspace (or Clever/ClassLink) as the IdP so students and teachers sign in with school accounts.
- **Directory**: If you use Clever or ClassLink, sync rosters via their APIs or export CSV and use the Provisioning API to create/update users and org membership.
- **LMS**: If the district uses an LMS, use ALP API keys to send events and embed the Sudar tutor; LTI 1.3 can be added when the Moodle/Canvas connector is available (see LAMP_BUILD_PLAN.md).
- **AI**: Together AI or OpenRouter keeps costs low for high volume.

### Higher ed

- **Identity**: Configure university SAML or OIDC in Supabase (Auth → Providers). Map institutional IDs to Sudar profiles.
- **Directory**: Sync from SIS (Banner, Colleague, etc.) via cron or the Provisioning API; map external_id for idempotent updates.
- **LMS**: LTI 1.3 for Canvas, Blackboard, or Moodle so Sudar appears as a tool; SCORM 1.2 is supported for existing content. Use ALP for events and tutor/next-action.
- **AI**: OpenRouter or OpenAI; embed Sudar inside the existing LMS experience.

### Corporate

- **Identity**: Azure AD or Okta via Supabase SSO so employees use existing credentials.
- **Directory**: Sync from Workday, BambooHR, Rippling, or similar via script/cron or the Provisioning API.
- **LMS**: ALP for internal portals and LMS; send xAPI/LRS events to your data lake if needed.
- **AI**: OpenAI or Anthropic for compliance and data policies; or OpenRouter for multi-model with a single key.

---

## Scaling Sudar

- **Supabase**: Use a dedicated project for production; consider high-availability and connection pooling for large cohorts. See Supabase docs and ECOSYSTEM.md.
- **Sudar Intelligence**: Scale `BYTEOS_INTELLIGENCE_URL` (the Python FastAPI service) horizontally; put it behind a load balancer and set timeouts/rate limits as needed.
- **Rate limits**: Document and enforce rate limits per ALP API key so partners and batch jobs don’t overload the system. Use Org settings and ALP key metadata if you track usage.
- **Deployment**: See ECOSYSTEM.md §12 (env vars) and the deployment section for Studio, Learn, and Intelligence.

---

## LTI / LMS options

Sudar supports:

- **LTI 1.3** — For Canvas, Blackboard, Moodle: Sudar can be launched as an LTI tool; the Moodle connector is planned (see docs/LAMP_BUILD_PLAN.md).
- **SCORM 1.2** — For packaging and importing existing content.
- **xAPI / LRS** — For sending or receiving learning statements; use the ALP events API and map to your LRS if needed.

The **ALP (Adaptive Learning Layer)** is the intelligence layer: your LMS sends events and calls the tutor/next-action APIs; content can stay in your LMS. See INTEGRATION_GUIDE.md for endpoints and user mapping.

---

## Provisioning API

The Provisioning API allows batch creation of users and org membership so institutions can plug in their directory (HRIS/SIS) without manual invites only.

- **Endpoint**: `POST /api/org/provisioning/users` (Studio app; use your Studio base URL, e.g. `https://studio.yoursudar.com`).
- **Auth**: Key-based. Use an org-scoped Integration API key from Studio → Integrations → ALP & API access. Send it in the `x-alp-api-key` header or `Authorization: Bearer <key>`.
- **Payload**: `{ "users": [ { "email": "user@example.com", "full_name": "Optional", "role": "LEARNER" } ] }`. `role` is one of `ADMIN`, `MANAGER`, `CREATOR`, `LEARNER` (default `LEARNER`). Max 200 users per request.
- **Behavior**: For each item, the server creates a Supabase Auth user (with a random temporary password and `require_password_change`), a `profiles` row, an `org_members` row, and a `learner_profiles` row if missing. If the email already exists in Auth, that row returns `ok: false` with an error.
- **Response**: `{ "results": [ { "email", "ok", "id?", "error?" } ], "summary": { "total", "ok", "failed" } }`.
- **Docs**: See INTEGRATION_GUIDE for user mapping and ALP events.

---

## References

- **In-app**: Studio → Integrations (Provisioning checklist), Studio → Settings → AI & API Keys, Studio → Help & Guides.
- **Repo**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md), [ENV_REFERENCE.md](./ENV_REFERENCE.md), [ECOSYSTEM.md](../ECOSYSTEM.md), [LAMP_BUILD_PLAN.md](./LAMP_BUILD_PLAN.md).
