# Canvas — Sudar ALP + Sudar Create (LTI 1.3)

Install Sudar as an **LTI 1.3** tool in Canvas without Canvas-specific server code. Sudar Learn hosts the tool endpoints.

## Prerequisites

- Sudar Learn deployed with org-scoped **ALP API key** (Sudar Studio → Integrations)
- `ALP_EMBED_SIGNING_SECRET` set on Learn
- LTI platform deployment registered via `POST /api/org/provisioning/lti-deployments` (see [docs/ALP_API.md](../../docs/ALP_API.md))

## Tool URLs (Learn base)

| Setting | URL |
|---------|-----|
| OpenID Connect initiation URL | `{LEARN_URL}/api/alp/lti/launch` |
| Target link URI | `{LEARN_URL}/api/alp/lti/launch` |
| JWK Set URL | `{LEARN_URL}/api/alp/lti/jwks` |
| Redirect URIs | `{LEARN_URL}/api/alp/lti/launch` |

## Sudar Create (teacher tools)

1. Register a second LTI placement or deep link pointing to Sudar Create embed:
   - Obtain token: `POST {LEARN_URL}/api/alp/create/embed-token` with `{ "creator_user_id": "<Sudar profiles.id>", "tool": "quiz" }`
   - iframe `src`: response `embed_url` → `/alp/create?token=…`
2. Teachers paste content, click **Generate**, **Download SCORM 1.2**, upload to Canvas as SCORM package.

See [docs/SUDAR_CREATE_API.md](../../docs/SUDAR_CREATE_API.md) for all create endpoints.

## Example JSON (`integrations/canvas/lti-config.json`)

Use the bundled `lti-config.json` as a checklist when configuring the Canvas developer key.

## Identity

Map Canvas `sub` (LTI) or SIS ids to Sudar `profiles.id` via `lms_identity_links` (provider `lti` or custom) — same as Moodle ALP.

## Plugins reference

| Sudar service | ALP / Create endpoint |
|---------------|----------------------|
| SudarMemory | `POST /api/alp/events` |
| SudarChat | `POST /api/alp/tutor/query` + `/alp/embed` |
| SudarRecommend | `POST /api/alp/next-action` |
| SudarQuiz | `POST /api/alp/create/quiz` |
| SudarInteract | `POST /api/alp/create/interactive` |
| SudarCards | `POST /api/alp/create/flashcards` |
| SudarDraft | `POST /api/alp/create/from-document` |
| SudarMedia | `POST /api/alp/create/media` |
