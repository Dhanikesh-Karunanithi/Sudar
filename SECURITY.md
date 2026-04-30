# Security Policy

Sudar is open source, so security must come from strong defaults, explicit trust boundaries, and clear operator guidance rather than obscurity.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately through GitHub Security Advisories:

https://github.com/Dhanikesh-Karunanithi/Sudar/security/advisories/new

Do not open a public issue for exploitable vulnerabilities, secrets, tenant-isolation bypasses, auth bypasses, or data exposure.

When reporting, include:

- Affected surface: Sudar Studio, Sudar Learn, Sudar Intelligence, SudarVid, Supabase schema/storage, or deployment config.
- Reproduction steps or proof of concept.
- Expected impact and affected data, if known.
- Whether the issue requires authenticated access, org membership, an integration key, or self-host misconfiguration.

## Supported Versions

Sudar is currently pre-1.0 and actively evolving. Security fixes target the main public repository unless a release branch is explicitly documented.

## Security Baseline

Current hardening highlights:

- Cron endpoints fail closed when `CRON_SECRET` is missing.
- ALP org-scoped integration keys must match the requested learner’s organisation.
- Learn **middleware** allows unauthenticated access only to documented public prefixes (e.g. `/api/alp/*`, `/alp/embed`); each ALP route still validates the integration key or signed embed token.
- Embed, unsubscribe, and notification tracking links use purpose-specific HMAC signing secrets.
- SCORM and SudarVid asset proxies enforce object-level authorization before service-role access.
- Studio document URL ingestion blocks local/private network targets to reduce SSRF risk.
- Destructive purge tooling is disabled by default and requires super-admin access plus same-origin confirmation.

See `docs/trust/` for the technical trust pack and `docs/ENV_REFERENCE.md` for required production secrets.

## Self-hosting Responsibility

Self-hosters must configure secrets, Supabase RLS/storage policies, CORS, CSP, AI provider terms, and data retention for their own environment. Sudar provides safer defaults and documentation, but operators remain responsible for infrastructure exposure, key rotation, backups, logging, and legal/compliance obligations.
