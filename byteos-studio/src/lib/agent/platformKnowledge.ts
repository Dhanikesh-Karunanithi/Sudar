/**
 * Sudar Studio — Platform Knowledge Base
 * Single source of truth for the Studio agent. Derived from docs/STUDIO_USER_GUIDE.md,
 * Help page, ALP_API.md, INTEGRATION_GUIDE.md, and ECOSYSTEM.md.
 * Update when those docs change so Sudar's answers stay consistent.
 */

export const SUDAR_STUDIO_PLATFORM_KNOWLEDGE = `
## Sudar Studio — Platform Knowledge (use ONLY this when answering "how do I..." questions)

### Architecture
- **Sudar** is the product name. **Sudar Studio** (SudarLab, port 3000) is the admin/creator app where you build courses, manage users, and configure integrations. **Sudar Learn** (port 3001) is where learners take courses. Both share the same Supabase project. **Sudar Intelligence** (Python FastAPI, port 8000) handles AI computation. Studio creates content and manages org; Learn delivers it to learners.

### Sidebar navigation (exact labels and paths)
**Content** (all roles):
- Dashboard — / (overview, quick access to courses and paths)
- Courses — /courses (create, edit, publish courses; also /courses/new, /courses/[id])
- Learning Paths — /paths (build ordered sequences, assign to learners; /paths/new, /paths/[id])
- Analytics — /analytics (completions, skill gaps, drop-off, time per section)
- Compliance — /compliance (overdue, at-risk, on-track, completed path assignments)

**Organization** (only Admin and Manager see this section):
- Users — /users (manage org members, roles; user detail /users/[id])
- Integrations — /integrations (API keys, embed Sudar, event ingestion)
- AI & API Keys — /settings/keys (OpenRouter, Together, OpenAI, Anthropic, embeddings, TTS, media)
- Org settings — /settings (organisation-wide configuration: performance_config, KPIs, terms, scale, ai_models, SSO)
- Help & Guides — /help (getting started, API keys, provisioning checklist, enterprise scaling)

### Getting started (first-time setup order)
1. Create Supabase project; set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
2. Set NEXTAUTH_URL and NEXTAUTH_SECRET for session auth.
3. Add at least one AI key in Sidebar → Organization → AI & API Keys (OpenRouter, Together, or OpenAI).
4. Optional: configure Integrations (ALP keys, embed URL, SSO) in Sidebar → Organization → Integrations.

### Integrations (ALP & external systems)
**Path**: Sidebar → Organization → Integrations.

- **Learn app base URL**: Set via NEXT_PUBLIC_LEARN_APP_URL. All ALP endpoints live on the Learn app (e.g. https://your-learn-app.com/api/alp/...).
- **Create API key**: Integrations → Create key → enter name (e.g. "Moodle production") → Create key. Raw key shown once in modal; copy and store securely.
- **Use the key**: In requests use header \`x-alp-api-key: <key>\` or \`Authorization: Bearer <key>\`.
- **Embed Sudar (iframe)**: Integrations → Embed Sudar → Generate embed link. Provide: User ID (Sudar learner UUID), API key, optional Course ID, optional Module ID. Click Get embed URL. Use URL as iframe src. Link expires in 1 hour; request new one when learner opens embed (e.g. backend calls Learn POST /api/alp/embed-token).
- **Event ingestion**: To send LMS events into Sudar (SudarMemory), POST to <Learn base URL>/api/alp/events with body: { "user_id": "uuid", "events": [ { "event_type": "module_complete", "course_id": "uuid", "module_id": "uuid", "payload": {}, "modality": "text", "duration_secs": 120 } ] }. Auth: x-alp-api-key or Bearer. event_type values: module_start, module_complete, quiz_attempt, video_play, section_heartbeat, ai_tutor_query, modality_switch, drop_off, streak_broken. Full list in docs/ALP_API.md.
- **Next-action widget**: POST <Learn base URL>/api/alp/next-action with user_id; returns "what to do next" recommendation.
- **Tutor from outside Learn**: Either call POST .../api/alp/tutor/query with API key and user_id (build your own chat UI), or use the embed iframe flow above.

### ALP endpoints summary (all on Learn app base URL)
- POST /api/alp/events — event ingestion (batch); auth: x-alp-api-key or Bearer.
- POST /api/alp/tutor/query — tutor Q&A; body: user_id, message, optional course_id, module_id, context_text.
- POST /api/alp/next-action — next-best-action for dashboard; body: user_id.
- Embed token: generate in Studio (Integrations → Embed Sudar); token in URL for iframe; expires 1 hour.

### Compliance and reminders
- **Compliance page**: Sidebar → Compliance. Shows path assignments with due date, progress, status (Overdue / At risk / On track / Completed).
- **Email reminders**: POST <Studio base URL>/api/cron/compliance-reminders. Auth: Authorization: Bearer <CRON_SECRET> or ?secret=<CRON_SECRET>. Set CRON_SECRET, RESEND_API_KEY, RESEND_FROM in env. Call on a schedule (e.g. daily). Learners with at-risk or overdue path assignments receive one email.

### Users
- **List/manage**: Sidebar → Organization → Users (/users). Admin/Manager only.
- **User detail**: /users/[id] — view profile, enrollments, performance records; assign path, add performance record, reset password.
- **Add user**: Users page: invite flow or bulk import (CSV: email, name, role). Provisioning API: POST to org provisioning endpoint with users array (see integration guide).

### Org settings
- **Path**: Sidebar → Organization → Org settings (/settings). Contains: performance_config (institution_type, kpis, terms, scale), ai_models (default TTS, content generation), sso_config. Admin/Manager can view and update.

### Quick reference — Where to do what
| Goal | Where in Studio |
|------|------------------|
| Give external LMS access to ALP | Integrations → Create key, share base URL + key |
| Embed Sudar chat in your site | Integrations → Embed Sudar → Generate embed link |
| Send LMS events into Sudar | Integrations → Event ingestion; implement POST .../api/alp/events in your LMS |
| Configure AI providers | Sidebar → AI & API Keys (/settings/keys) |
| See analytics | Sidebar → Analytics (/analytics) |
| Assign a path to a learner | Users → click user → assign path (or path detail page) |
| Compliance reminders | Call POST .../api/cron/compliance-reminders with CRON_SECRET |

### Integration blocks (Lego-style)
- **SudarMemory**: Sends events → POST /api/alp/events.
- **SudarChat**: Tutor Q&A → POST /api/alp/tutor/query or Embed iframe.
- **SudarRecommend**: Next-action → POST /api/alp/next-action.
- **Embed**: Pre-built chat in iframe; generate URL in Integrations → Embed Sudar.
Minimum: SudarMemory + (SudarChat or Embed). Optional: SudarRecommend.

### Provisioning checklist (enterprise)
1. Identity: SSO (SAML/OIDC) in Supabase Auth → Providers.
2. Directory: Use provisioning API or cron to sync users from HRIS/SIS.
3. LMS/LTI: ALP API keys from Integrations; embed tutor or next-action via LTI or embed URL.
4. AI keys: Configure in AI & API Keys.
5. Data: Send learning events to ALP events endpoint; batch jobs can POST from data lake.

### Enterprise by segment
- K-12: Google Workspace SSO; Clever/ClassLink or roster sync; ALP + LTI. AI: Together or OpenRouter.
- Higher ed: University SAML/OIDC; SIS sync via provisioning API; LTI 1.3 for Canvas/Blackboard/Moodle; SCORM. AI: OpenRouter or OpenAI.
- Corporate: Azure AD/Okta SSO; Workday/BambooHR/Rippling sync; ALP for intranet; xAPI for data lake. AI: OpenAI/Claude or OpenRouter.

CRITICAL: When the user asks how to do something, use ONLY the steps and paths above. Do NOT invent menu names, URLs, or endpoints that are not listed here. If something is not in this knowledge base, say you don't have that detail and point them to the relevant doc (e.g. docs/ALP_API.md, docs/INTEGRATION_GUIDE.md) or the Help page (/help).
`.trim()
