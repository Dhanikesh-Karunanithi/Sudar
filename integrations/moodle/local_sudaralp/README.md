# Moodle ALP connector: `local_sudaralp` + `block_sudaralp`

Moodle 4.x plugins that send telemetry and surface Sudar (ALP) against [docs/ALP_API.md](../../docs/ALP_API.md).

## Install

1. Copy **`local_sudaralp`** to `moodle/local/sudaralp`
2. Copy **`block_sudaralp`** to `moodle/blocks/sudaralp` (optional; dashboard/course links)
3. Site administration → Notifications → upgrade
4. Configure **Local plugins → Sudar ALP**:
   - Learn base URL (e.g. `https://learn.example.com`)
   - Org-scoped **integration API key** from Sudar Studio → Integrations
   - Identity provider string (default `moodle`) — must match `lms_identity_links.provider` in Supabase
   - **Fail closed on events**: when enabled, events are not queued unless `/api/alp/identity/resolve` already succeeds (avoids DLQ noise)
5. **Provision mappings** in Sudar: `POST /api/org/provisioning/lms-identity-links` on Studio (each Moodle user id → Sudar `profiles.id` UUID). See [ALP_API.md](../../docs/ALP_API.md) §3.5.
6. Run **cron** so `local_sudaralp\task\push_queue` forwards the queue.

## What ships

| Area | Behaviour |
|------|-----------|
| SudarMemory | Observers enqueue rows; task resolves Moodle → Sudar UUID, `POST /api/alp/events`, exponential backoff, **dead** status after max attempts |
| SudarChat / SudarRecommend | `tutor.php`, `nextaction.php` resolve identity then call embed-token / next-action |
| Capabilities | Course + user context: `nextaction_*`, `launchtutor_*`; legacy system `view` |
| Block | `block_sudaralp` lists next-action + tutor links on Dashboard / course |

## LTI 1.3 (optional)

Register Learn tool JWKS (`GET /api/alp/lti/jwks`, env `ALP_LTI_TOOL_JWKS_JSON`), launch target `POST /api/alp/lti/launch`, and register the platform deployment via Studio `POST /api/org/provisioning/lti-deployments`. Use LTI custom parameter `sudar_user_id=<uuid>` and/or pre-provision `lms_identity_links` with `provider: lti` and `external_user_id` = LTI `sub`.

## Related

- [docs/ALP_API.md](../../docs/ALP_API.md)
- [integrations/alp-sdk/README.md](../alp-sdk/README.md)
