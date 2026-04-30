# Sudar trust and governance documentation

This folder is the **technical** trust pack for Sudar (Sudar Studio, Sudar Learn, Sudar Intelligence). It supports security reviews and procurement; it is **not** legal advice and does not replace your counsel, DPA, or privacy policy.

## Contents

| Document | Purpose |
|----------|---------|
| [POSTURE.md](./POSTURE.md) | Deployment and data-category posture (internal memo) |
| [DATA_FLOWS.md](./DATA_FLOWS.md) | High-level data flows and main tables |
| [SUBPROCESSORS.md](./SUBPROCESSORS.md) | Typical third-party services |
| [SHARED_RESPONSIBILITY.md](./SHARED_RESPONSIBILITY.md) | What Sudar vs the customer operates |
| [AI_SYSTEM_REGISTER.md](./AI_SYSTEM_REGISTER.md) | Major AI features (transparency / EU AI Act style) |
| [THREAT_MODEL.md](./THREAT_MODEL.md) | Application threats and mitigations |
| [OPERATIONS.md](./OPERATIONS.md) | Incident, DSAR, breach outline |
| [AUDIT_LOG.md](./AUDIT_LOG.md) | Planned admin audit log (schema backlog) |
| [SERVICE_ROLE_AUDIT.md](./SERVICE_ROLE_AUDIT.md) | Service-role usage inventory and authorization invariant |
| [RLS_STORAGE_AUDIT_CHECKLIST.md](./RLS_STORAGE_AUDIT_CHECKLIST.md) | Repeatable Supabase RLS + storage cross-tenant checks |
| [SELF_HOST_SECURITY.md](./SELF_HOST_SECURITY.md) | Deployment checklist for self-hosted organisations |
| [SECURITY_RESUME_HANDOFF.md](./SECURITY_RESUME_HANDOFF.md) | Resume context: completed controls, validation, blockers, and next plan |

## Product surfaces

- **Studio → Governance** (`/governance`): Admin/Manager view of organisation protection toggles and links here.
- **Studio → Training compliance** (`/compliance`): L&D assignment tracking (due dates), not regulatory compliance.

## Current hardening highlights

- Privileged cron jobs fail closed without `CRON_SECRET`.
- ALP embed tokens, unsubscribe links, and notification tracking links use dedicated HMAC signing secrets.
- SCORM and SudarVid asset proxies enforce learner enrollment, org/editor access, or job ownership before service-role access.
- Studio document URL ingestion blocks local/private network targets and oversized or redirecting responses.
- Destructive admin tooling is disabled by default and requires super-admin access plus same-origin confirmation.
