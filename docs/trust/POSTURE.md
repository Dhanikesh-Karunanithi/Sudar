# Deployment and data posture (internal)

Use this memo to scope HIPAA, PCI, and regional law discussions.

## Deployment models

1. **Sudar-hosted SaaS** — Sudar (or a partner) operates Studio, Learn, Supabase project, and Intelligence. Customer is controller for learner data; Sudar is processor under DPA terms you define.
2. **Customer VPC / self-hosted** — Customer operates infrastructure; Sudar supplies software. Responsibility shifts per contract; subprocessors list differs.

## Data categories

| Category | Typical in Sudar | Notes |
|----------|------------------|--------|
| Learner PII | Name, email, profile | In `profiles`, auth |
| Learning records | Events, progress, tutor messages | `learning_events`, `ai_interactions` |
| Cardholder data | Usually **none** in-app | Prefer Stripe Checkout / hosted fields; Sudar should not store PAN |
| PHI | **Only if** customer puts it in content | Healthcare scenarios need BAA and scope |

## Markets

Document primary regions (EU/UK/US) to drive GDPR, UK GDPR, and state privacy laws. AI Act obligations depend on use case and role (provider vs deployer); see AI_SYSTEM_REGISTER.md.

## Checklist (per deployment)

- [ ] Primary customer regions and lawful basis documented with legal counsel.
- [ ] Subprocessor list finalized for **this** environment (hosting, email, model APIs).
- [ ] Whether cardholder data or PHI will appear in course content or attributes (scopes HIPAA/PCI discussion).
- [ ] `organisations.settings.ai_compliance` reviewed in Sudar Studio (Governance + Org settings).
- [ ] `CRON_SECRET`, `ALP_EMBED_SIGNING_SECRET`, `NOTIFICATION_UNSUBSCRIBE_SECRET`, and `NOTIFICATION_LINK_SIGNING_SECRET` set to unique random values; no signing use falls back to service-role or integration API keys.
- [ ] `ENABLE_DANGEROUS_ADMIN_TOOLS` remains unset in production; if used locally, `PURGE_KEEP_EMAIL` is set and access is limited to super admins.
- [ ] `DOCUMENT_URL_HOST_ALLOWLIST` reviewed for Studio document ingestion; private/local network fetches remain blocked.
- [ ] SudarVid is not directly internet-exposed unless it has its own authentication; Learn proxies enforce job ownership before status, stream, and render access.
- [ ] SCORM packages are served only through authorized app proxies or short-lived signed URLs; package paths remain under `scorm-packages/{courseId}/`.
- [ ] Retention fields in Org settings treated as **policy intent** until automated jobs exist.
- [ ] LLM subprocessors confirmed for **data use / training opt-out** (contractual; not a code guarantee).
- [ ] Analytics rollout flag (`ENABLE_ANALYTICS_ENGINE`) reviewed before production enablement.
- [ ] Rollup refresh operations (`refresh_analytics_rollups`, `refresh_analytics_risk_signals`) scheduled and monitored.
- [ ] Access checks validated for Studio analytics exports (org-scoped only).
- [ ] Recommendation feedback retention window defined for `analytics_feedback`.

**Sovereignty / self-host**: Customers who run their own Supabase instance and Sudar apps retain infrastructure control; marketing claims should still distinguish **product capability** from **customer deployment choices**.

## Security measures to highlight externally

- **Fail-closed operations**: scheduled jobs refuse to run when their secret is missing, reducing self-host misconfiguration risk.
- **Tenant-aware service-role use**: SCORM files, ALP events/embed tokens, and SudarVid outputs now perform explicit org/enrollment/job ownership checks before using privileged server credentials.
- **SSRF-resistant ingestion**: Studio can create courses from URLs while blocking private network targets, redirects, oversized responses, and long-running fetches.
- **Dedicated signing secrets**: embed, unsubscribe, and notification tracking links use purpose-specific HMAC secrets rather than reusing API or database keys.
- **Safer admin operations**: destructive purge tooling is disabled by default and requires super-admin access, same-origin requests, environment opt-in, and typed confirmation.
