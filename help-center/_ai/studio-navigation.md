## Sudar Studio, Platform Knowledge (use ONLY this when answering "how do I..." questions)

### Architecture
- **Sudar** is the product name. **Sudar Studio** (SudarLab, port 3000) is the admin/creator app where you build courses, manage users, and configure integrations. **Sudar Learn** (port 3001) is where learners take courses. Both share the same Supabase project. **Sudar Intelligence** (Python FastAPI; often **8001** in local dev when SudarVid uses 8000) handles heavy AI computation. Studio creates content and manages org; Learn delivers it to learners.

### Sidebar navigation (exact labels and paths)
**Content** (all roles):
- Dashboard, / (overview, quick access to courses and paths)
- Courses, /courses (create, edit, publish courses; also /courses/new, /courses/[id])
- Learning Paths, /paths (build ordered sequences, assign to learners; /paths/new, /paths/[id])
- Analytics, /analytics (completions, skill gaps, drop-off, time per section)
- Training compliance, /compliance (overdue, at-risk, on-track, completed path assignments)

**Organization** (only Admin and Manager see this section):
- Users, /users (manage org members, roles; user detail /users/[id])
- Governance, /governance (trust overview, subprocessors links, organisation protection toggles from Org settings)
- Integrations, /integrations (API keys, embed Sudar, event ingestion)
- AI & API Keys, /settings/keys (OpenRouter, Together, OpenAI, Anthropic, embeddings, TTS, media)
- Org settings, /settings (organisation-wide configuration: performance_config, KPIs, terms, scale, ai_models, SSO)
- Help & Guides, /help (Sudar Help Center: guides, search, and links to deeper docs)
- **Sudar Agents**: **/agents** (Admin and Manager): observability table of recent bounded automation runs (path/cohort snapshots, learner week-plan style jobs recorded as `agent_runs`). Not a separate chat product, the tutor "Sudar" is different.

### Sudar Agents (product feature)
- **What they are**: Short, **task-style** runs with a fixed tool set and an **audit row** in Postgres (`agent_runs`), e.g. **cohort path health** (`path_health`) for admins, learner **week-plan** sketches on Learn when enabled. Same Intelligence gateway (`/api/agents/*`), different teams (admin vs learner). See repo **docs/AGENTS_PLATFORM.md** for architecture and LMS integrators.
- **Studio page**: Sidebar → Organization → **Sudar Agents** → **/agents**. Use **Simple** vs **Advanced** on the page; **Documentation** links to AGENTS_PLATFORM.
- **Run cohort pulse**: Button on /agents triggers an admin-team `path_health` run (path rollups + org risk snippets). **Requires Sudar Intelligence to be configured and reachable**: set `SUDAR_INTELLIGENCE_URL` or `BYTEOS_INTELLIGENCE_URL` on Studio. **Intelligence must have `SUPABASE_JWT_SECRET`** (same value as Supabase Project Settings → API → JWT Secret) in `sudar-intelligence/.env.local` or `.env`, those files load automatically when Intelligence starts. If you see `JWT validation not configured`, that variable is missing on Intelligence.
- **Org toggles**: Sidebar → Organization → **Org settings** → section **Sudar Agents** (`organisations.settings.sudar_agents`): master **enabled**, per-feature toggles (**cohort pulse**, learner week-plan / API, spacing nudge cron). If cohort pulse is off, the button is disabled and API returns 403.
- **Empty table after a "success" message**: Confirm Postgres has the `agent_runs` table (Supabase migration); without it persistence may be missing. Otherwise: Intelligence unreachable, run failed upstream, sparse path/analytics data, or page not refreshed yet.

### Getting started (first-time setup order)
1. Create Supabase project; set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
2. Set NEXTAUTH_URL and NEXTAUTH_SECRET for session auth.
3. Add at least one AI key in Sidebar → Organization → AI & API Keys (OpenRouter, Together, or OpenAI).
4. Optional: configure Integrations (ALP keys, embed URL, SSO) in Sidebar → Organization → Integrations.

### Integrations (ALP & external systems)
**Path**: Sidebar → Organization → Integrations.

- **Learn app base URL**: Set via NEXT_PUBLIC_LEARN_APP_URL. All ALP endpoints live on the Learn app (e.g. https://your-learn-app.com/api/alp/...).
- **Create API key**: Integrations → Create key → enter name (e.g. "Moodle production") → Create key. Raw key shown once in modal; copy and store securely.
- **Use the key**: In requests use header `x-alp-api-key: <key>` or `Authorization: Bearer <key>`.
- **Embed Sudar (iframe)**: Integrations → Embed Sudar → Generate embed link. Provide: User ID (Sudar learner UUID), API key, optional Course ID, optional Module ID. Click Get embed URL. Use URL as iframe src. Link expires in 1 hour; request new one when learner opens embed (e.g. backend calls Learn POST /api/alp/embed-token).
- **Event ingestion**: To send LMS events into Sudar (SudarMemory), POST to <Learn base URL>/api/alp/events with body: { "user_id": "uuid", "events": [ { "event_type": "module_complete", "course_id": "uuid", "module_id": "uuid", "payload": {}, "modality": "text", "duration_secs": 120 } ] }. Auth: x-alp-api-key or Bearer. event_type values: module_start, module_complete, quiz_attempt, video_play, section_heartbeat, ai_tutor_query, modality_switch, drop_off, streak_broken. Full list in docs/ALP_API.md.
- **Next-action widget**: POST <Learn base URL>/api/alp/next-action with user_id; returns "what to do next" recommendation.
- **Tutor from outside Learn**: Either call POST .../api/alp/tutor/query with API key and user_id (build your own chat UI), or use the embed iframe flow above.

### ALP endpoints summary (all on Learn app base URL)
- POST /api/alp/events, event ingestion (batch); auth: x-alp-api-key or Bearer.
- POST /api/alp/tutor/query, tutor Q&A; body: user_id, message, optional course_id, module_id, context_text.
- POST /api/alp/next-action, next-best-action for dashboard; body: user_id.
- Embed token: generate in Studio (Integrations → Embed Sudar); token in URL for iframe; expires 1 hour.

### Compliance and reminders
- **Training compliance page**: Sidebar → Training compliance. Shows path assignments with due date, progress, status (Overdue / At risk / On track / Completed).
- **Email reminders**: POST <Studio base URL>/api/cron/compliance-reminders. Auth: Authorization: Bearer <CRON_SECRET> or ?secret=<CRON_SECRET>. Set CRON_SECRET, RESEND_API_KEY, RESEND_FROM in env. Call on a schedule (e.g. daily). Learners with at-risk or overdue path assignments receive one email.

### Users
- **List/manage**: Sidebar → Organization → Users (/users). Admin/Manager only.
- **User detail**: /users/[id], view profile, enrollments, performance records; assign path, add performance record, reset password.
- **Add user**: Users page: invite flow or bulk import (CSV: email, name, role). Provisioning API: POST to org provisioning endpoint with users array (see integration guide).

### Org settings
- **Path**: Sidebar → Organization → Org settings (/settings). Contains: performance_config (institution_type, kpis, terms, scale), ai_models (default TTS, content generation), sso_config. Admin/Manager can view and update.

### Quick reference, Where to do what
| Goal | Where in Studio |
|------|------------------|
| Give external LMS access to ALP | Integrations → Create key, share base URL + key |
| Embed Sudar chat in your site | Integrations → Embed Sudar → Generate embed link |
| Send LMS events into Sudar | Integrations → Event ingestion; implement POST .../api/alp/events in your LMS |
| Configure AI providers | Sidebar → AI & API Keys (/settings/keys) |
| See analytics | Sidebar → Analytics (/analytics) |
| Assign a path to a learner | Users → click user → assign path (or path detail page) |
| Training compliance reminders | Call POST .../api/cron/compliance-reminders with CRON_SECRET |
| Sudar Agents (runs table, cohort pulse) | Sidebar → Sudar Agents **/agents**; configure Org settings → Sudar Agents |
| Troubleshoot cohort pulse failing | Confirm `SUDAR_INTELLIGENCE_URL`; Intelligence healthy; Org settings enable Agents + cohort pulse, see docs/AGENTS_PLATFORM.md |

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

CRITICAL: When the user asks how to do something, use ONLY the steps and paths above. Do NOT invent menu names, URLs, or endpoints that are not listed here. For **Sudar Agents**, use this section plus **docs/AGENTS_PLATFORM.md** in the repo when they need wiring detail. Otherwise if something is not in this knowledge base, say you don't have that detail and point them to the relevant doc or the Sudar Help Center (/help).
