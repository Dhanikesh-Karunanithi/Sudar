# ALP connector delivery path (toward installable LMS add-ons)

This document makes the ALP ambition executable: not just API docs, but connector deliverables and an honest **maturity ladder** so claims match what is runnable in-repo.

## Maturity ladder

| Level | Meaning | Gates |
|-------|---------|--------|
| **Starter** | Reference API + sample integration code; may omit production concerns. | Docs + minimal code paths. |
| **Pilot** | End-to-end correct `user_id` (Sudar UUID), org-scoped keys, queue reliability, basic ops runbooks. | Identity bridge + resolve API in use; queue retry/DLQ; Vitest golden payload tests green in CI. |
| **Production** | LTI/deep linking where required, full observability, partner conformance sign-off, privacy artefacts. | Pilot gates + LTI verification path + institutional checklist (e.g. trust docs). |

**Current repo position (Moodle path)**: **Pilot** for SudarMemory / SudarChat / SudarRecommend when admins provision `lms_identity_links` and use org-scoped keys. **Production** wording should wait for partner hardening and optional LTI-only pilots without manual CSV mapping.

## Shipped in-repo

- TypeScript SDK: `integrations/alp-sdk/` (includes `resolveIdentity`)
- Moodle local plugin: `integrations/moodle/local_sudaralp/` (identity resolve, queue DLQ, capabilities)
- Moodle block: `integrations/moodle/block_sudaralp/` (dashboard / course links)
- Supabase: `lms_identity_links`, `lti_platform_deployments` ([migration](../supabase/migrations/20260427000000_lms_identity_links.sql))
- Learn: `POST /api/alp/identity/resolve`, `GET /api/alp/lti/jwks`, `POST /api/alp/lti/launch`
- Studio: `POST/DELETE /api/org/provisioning/lms-identity-links`, `POST /api/org/provisioning/lti-deployments`
- CI: golden ALP payload contract tests in `sudar-learn` (`src/lib/alp/alpGoldenContracts.test.ts`)

## Capability mapping

| Goal | Status | Notes |
|------|--------|--------|
| SudarMemory | Pilot | UUID via resolve + retry/DLQ on `local_sudaralp_q` |
| SudarChat | Pilot | Embed flow + course/user capabilities + block link |
| SudarRecommend | Pilot | Next-action + block link |
| LTI 1.3 | Pilot | Launch + JWKS + deployment registry; custom claim `sudar_user_id` for JIT link |

## Claim guidance

- **Accurate now**: “ALP is implemented on Learn; Moodle connector reaches **Pilot** maturity when `lms_identity_links` is provisioned and org-scoped keys are used.”
- **Avoid until Production gate**: “Installable Moodle connector is production-ready for any tenant without mapping/LTI work.”
