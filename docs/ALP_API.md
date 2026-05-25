# ALP — Adaptive Learning Layer API

**Purpose**: Single source of truth for the **HTTP contract** external LMS connectors use with Sudar. **Event ingestion, embed tokens, ALP-proxied tutor, and next-best-action are implemented on Sudar Learn** (`sudar-learn`, e.g. `POST /api/alp/*`). Sudar Intelligence (Python FastAPI) handles heavy AI (tutor generation, TTS, etc.) when Learn forwards requests; the Digital Learner Twin lives in **Supabase** (`learner_profiles`, `learning_events`). **Vendor-specific installable plugins** (Moodle mod, Canvas LTI app, etc.) are packaging and deployment work on top of this reference API.

**Audience**: ALP connector implementers (Moodle, Canvas, Blackboard), and anyone extending the plugin layer.

**Admin UI**: In **Sudar Studio**, open **Integrations** (Organization section) to see the Learn base URL for ALP, API key setup, and embed pointers.

**See also**: [ECOSYSTEM.md](ECOSYSTEM.md) §5 (schema) and §6 (Learn → Intelligence contracts); `sudar-intelligence/` for AI routes Learn calls. For **MCP (Model Context Protocol)** clients (Cursor, Claude, partner agents), see [MCP_SERVERS.md](MCP_SERVERS.md) — same ALP endpoints via `@sudar/mcp-server`.

---

## 1. Overview

ALP sits between a host LMS (Moodle, Canvas, Blackboard) and Sudar (Learn APIs + Supabase + Intelligence). The host LMS:

- **Sends events** (completions, quiz attempts, time-on-task, tutor exchanges) so ALP can maintain the Digital Learner Twin.
- **Calls Sudar Learn** (with org integration key or signed embed token) for event ingestion, tutor Q&A, and next-best-action; Learn may forward to Intelligence for model calls.

SCORM and xAPI standardise how LMSs report activity; ALP consumes those events (or equivalent webhooks) and maps them into `learning_events` and `learner_profiles`. For fine-grained adaptivity (paragraph-level time, replay counts, modality switches), xAPI and LRS-style streams are preferred over basic SCORM completion/score. ALP can act as an **intelligence layer on top of an LRS** or as a **specialised LRS for tutoring and adaptation**.

---

## 2. Event ingestion (→ Digital Learner Twin)

ALP plugins (e.g. **SudarMemory**) receive learning events from the host LMS and must write them into Sudar’s store. Events can come from:

- **SCORM**: `cmi.completion_status`, `cmi.success_status`, `cmi.core.lesson_status`, suspend data, score, time.
- **xAPI**: statements with `actor`, `verb`, `object`, `result`, `context` (and optional `timestamp`).
- **LMS-specific webhooks**: e.g. Moodle `mod_assign_submitted`, `quiz_attempt_submitted`, `course_module_completion_updated`.

### 2.1 Target schema: `learning_events`

Canonical table (see [ECOSYSTEM.md](ECOSYSTEM.md) §5):

| Field           | Type      | Description |
|----------------|-----------|-------------|
| `user_id`      | uuid      | References `profiles`. ALP must map LMS user to Sudar `user_id` (e.g. via LTI `user_id` or org directory). |
| `course_id`    | uuid      | Optional; references `courses` if the activity is tied to a Sudar course. |
| `module_id`    | uuid      | Optional; references `modules` if applicable. |
| `event_type`   | text      | See allowed values below. |
| `payload`      | jsonb     | Event-specific data. |
| `modality`     | text      | Which modality was active (e.g. `text`, `video`, `quiz`). |
| `duration_secs`| integer   | Time spent if applicable. |
| `created_at`   | timestamptz | Default `now()`. |

**Allowed `event_type` values** (align with existing Learn telemetry):

- `module_start` | `module_complete`
- `quiz_attempt` (payload: e.g. `score`, `max_score`, `passed`, `question_count`)
- `video_play` | `video_pause` | `video_replay`
- `section_heartbeat` (payload: `active_secs`, `total_secs`)
- `ai_tutor_open` | `ai_tutor_query`
- `modality_switch`
- `drop_off` | `streak_broken` | `streak_maintained`
- `session_end` — learner closed or navigated away from the lesson surface (Sudar Learn uses `pagehide`). Payload often includes `active_secs`, `reason` (e.g. `pagehide`).

### 2.1a Payload shapes (reference)

| `event_type` | Suggested `modality` | `payload` |
|--------------|----------------------|-----------|
| `modality_switch` | Destination modality (e.g. `video`) | `{ "from_modality": "text", "to_modality": "video" }` |
| `video_play` | `video` | `{ "scene_index": number, "scene_count": number }` |
| `video_pause` | `video` | `{ "scene_index": number, "scene_count": number }` |
| `video_replay` | `video` | `{ "scene_from": number, "scene_to": number }` |
| `session_end` | Active modality | `{ "active_secs": number, "reason": "pagehide" }` |
| `drop_off` | Active modality | `{ "active_secs": number, "completed": false }` — emit when the learner spent material time on a module but left without completing (product-defined threshold). |

### 2.2 Mapping from xAPI / SCORM

- **xAPI**: Map `actor.account.name` or similar to Sudar `user_id`; map `verb.id` to one of the `event_type` values above; put `result`, `object`, and extra data in `payload`; derive `duration_secs` from `result.duration` or timestamps.
- **SCORM**: Map `cmi.core.lesson_status` / `cmi.completion_status` to `module_complete`; put raw score and completion in `payload`; map SCO/course identifiers to `module_id`/`course_id` if they exist in Sudar.

**Ingestion endpoint (implemented)**: `POST /api/alp/events` on the **Learn** app (e.g. `https://learn.example.com/api/alp/events`). Accepts a batch of events; performs mapping and insert into `learning_events`; runs the same side-effects as the internal events API (enrollment progress, quiz struggles). Implementation: [sudar-learn/src/app/api/alp/events/route.ts](../sudar-learn/src/app/api/alp/events/route.ts).

**Auth**: Header `x-alp-api-key: <ALP_API_KEY>` or `Authorization: Bearer <ALP_API_KEY>`. Set `ALP_API_KEY` in the Learn app environment; the LMS connector must send this key.

**Request body**:
```json
{
  "user_id": "uuid (Sudar profiles.id)",
  "events": [
    { "event_type": "module_complete", "course_id": "uuid", "module_id": "uuid", "payload": {}, "modality": "text", "duration_secs": 120 }
  ]
}
```

---

## 3. Learner model (Digital Learner Twin)

The Digital Learner Twin is stored in `learner_profiles` (see [ECOSYSTEM.md](ECOSYSTEM.md) §5). ALP plugins **read** the Twin (for tutor context and next-action) and **update** it indirectly via event ingestion and the profile-update endpoint.

### 3.1 Read Twin (for SudarChat, SudarRecommend)

- **Source of truth**: Supabase `learner_profiles` (row keyed by `user_id`).
- **Fields relevant to ALP**: `modality_scores`, `ai_tutor_context` (goals, struggles, preferences, interaction summary), `next_best_action`, `streak_days`, `overall_engagement_score`, `preferences` (if present in `ai_tutor_context`).
- **How ALP gets it**: Learn and Studio today read from Supabase. For an external LMS, ALP can either:
  - Call an Intelligence endpoint that returns a summary (e.g. `GET /api/learner/{user_id}/twin` — to be added), or
  - Use a shared Supabase project with RLS so the LMS backend (with service role or a dedicated ALP key) reads `learner_profiles` directly.

This doc assumes ALP connectors that call Intelligence use a **REST API** for the Twin so the LMS does not need direct DB access. A future endpoint: `GET /api/learner/{user_id}/twin` returning `{ modality_scores, ai_tutor_context, next_best_action, ... }`.

### 3.2 Update Twin from session events

**Endpoint**: `POST /api/learner/profile` (Intelligence)  
**Implementation**: [sudar-intelligence/src/api/routes/learner.py](../sudar-intelligence/src/api/routes/learner.py) — **may be a stub or partial**; production Twin updates flow through **`POST /api/alp/events`** on Learn and Learn-side rollups. Prefer event ingestion for ALP connectors until this route is fully consolidated.

**Request body** (ProfileUpdateRequest):

```json
{
  "user_id": "uuid",
  "session_events": [ { "event_type": "...", "payload": {}, "modality": "...", "duration_secs": 0 } ]
}
```

**Response** (ProfileUpdateResponse): `modality_scores_updated`, `engagement_score`, `streak_days`.

**Semantics**: Intelligence processes `session_events` (e.g. completion, quiz, time-on-task), updates `learner_profiles` (modality scores, engagement, streak), and may update `ai_tutor_context` from tutor-related events. ALP plugins (SudarMemory) can batch recent LMS events and call this at end of session or on a schedule.

---

## 3.5 LMS → Sudar identity (required for correct ALP)

`user_id` in every ALP Learn call must be **`profiles.id` (UUID)** in the same Supabase project, not the LMS internal numeric id.

**Provisioning (bulk / admin)** — Studio, org-scoped integration key:

- `POST /api/org/provisioning/lms-identity-links` — body `{ "links": [ { "external_user_id": "<moodle user id string>", "sudar_user_id": "<uuid>", "provider": "moodle" } ] }`. Same auth headers as the user provisioning API (`x-alp-api-key` / `Bearer`).
- `DELETE /api/org/provisioning/lms-identity-links` — body `{ "external_user_id": "...", "provider": "moodle" }` revokes the active mapping (`revoked_at`).

**Runtime resolve (thin LMS connector)** — Learn, **org-scoped key only** (returns 403 if the env-wide `ALP_API_KEY` is used without org binding):

- `POST /api/alp/identity/resolve` — body `{ "provider": "moodle", "external_user_id": "<string>" }` → `{ "sudar_user_id": "<uuid>", "provider": "moodle" }` or `404`.

**LTI 1.3 (subject → Sudar user)**:

- Register the platform deployment: `POST /api/org/provisioning/lti-deployments` with `{ "issuer", "client_id", "deployment_id", "platform_jwks_uri" }` (from the LMS LTI tool registration).
- Tool JWKS URL for the LMS: `GET /api/alp/lti/jwks` on Learn (requires `ALP_LTI_TOOL_JWKS_JSON` env: JSON `{ "keys": [ ... ] }`).
- Launch URL (content selection / resource link): `POST /api/alp/lti/launch` on Learn — Moodle POSTs `id_token` here; Sudar verifies JWT, then uses optional IMS LTI custom claim `sudar_user_id` (UUID) and/or an `lms_identity_links` row with `provider: "lti"` and `external_user_id` = LTI `sub`, then redirects to `/alp/embed` with a signed embed token.

Schema: `lms_identity_links`, `lti_platform_deployments` in [ECOSYSTEM.md](ECOSYSTEM.md) §5.

---

## 4. Next-best action (SudarRecommend)

**Canonical next-best-action (Sudar Learn)**: `POST /api/intelligence/next-action` (authenticated learner) — see [sudar-learn/src/app/api/intelligence/next-action/route.ts](../sudar-learn/src/app/api/intelligence/next-action/route.ts).

**Intelligence route (legacy / optional)**: `POST /api/learner/next-action` — [sudar-intelligence/src/api/routes/learner.py](../sudar-intelligence/src/api/routes/learner.py) may not match Learn behaviour; **ALP must use** `POST /api/alp/next-action` on Learn (documented below).

**Request body** (NextActionRequest):

```json
{
  "user_id": "uuid",
  "current_enrollment_ids": [ "enrollment_uuid_1", "enrollment_uuid_2" ]
}
```

**Response** (NextActionResponse):

```json
{
  "action_type": "continue_course | start_new | try_modality | review_skill",
  "target_id": "course_id or module_id or path_id",
  "reason": "Human-readable explanation",
  "confidence": 0.0
}
```

**Usage**: SudarRecommend dashboard block calls this with the learner’s `user_id` and current enrollments; renders the returned recommendation card.

**ALP proxy (implemented)**: For external LMSs, use `POST /api/alp/next-action` on the **Learn** app. Same request body; auth: `x-alp-api-key` or `Authorization: Bearer <ALP_API_KEY>`. Implementation: [sudar-learn/src/app/api/alp/next-action/route.ts](../sudar-learn/src/app/api/alp/next-action/route.ts).

---

## 5. AI tutor (SudarChat)

### 5.1 Tutor Q&A

**Endpoint**: `POST /api/tutor/query`  
**Implementation**: [sudar-intelligence/src/api/routes/tutor.py](../sudar-intelligence/src/api/routes/tutor.py)

**Request body** (TutorQueryRequest):

```json
{
  "user_id": "uuid",
  "module_id": "uuid",
  "course_id": "uuid",
  "message": "Learner's question text",
  "context_text": "Module content for RAG",
  "session_history": [ { "user_message": "...", "ai_response": "..." } ]
}
```

**Response** (TutorQueryResponse): `response`, `confidence`, `sources_used`, `suggested_modality_switch` (optional).

**Usage**: SudarChat in the LMS sends the learner’s message and the current module/course context; Intelligence uses RAG and longitudinal memory (from `ai_tutor_context` / `ai_interactions`) to produce a reply. The LMS is responsible for passing `context_text` (e.g. from the current page or from a pre-indexed course chunk).

**ALP proxy (implemented)**: For external LMSs, use `POST /api/alp/tutor/query` on the **Learn** app. Body: `{ user_id, message, context_text?, course_id?, module_id? }`. Auth: `x-alp-api-key` or `Authorization: Bearer <ALP_API_KEY>`. Learn forwards to Intelligence and logs to `ai_interactions`. Implementation: [sudar-learn/src/app/api/alp/tutor/query/route.ts](../sudar-learn/src/app/api/alp/tutor/query/route.ts).

**Inline tutor choices (embed)**: When the tutor response includes a `choice_group` block and the learner taps an option, call `POST /api/alp/tutor/choice` with the same auth as tutor query. Body: `{ user_id, block_id, choice_id, label?, course_id?, module_id? }`. Logs `tutor_choice_selected` to `learning_events` with `payload.source: alp_embed`. Implementation: [sudar-learn/src/app/api/alp/tutor/choice/route.ts](../sudar-learn/src/app/api/alp/tutor/choice/route.ts).

### 5.2 Proactive nudge

**Endpoint**: `POST /api/tutor/nudge`  
**Implementation**: [sudar-intelligence/src/api/routes/tutor.py](../sudar-intelligence/src/api/routes/tutor.py)

**Request body** (NudgeRequest):

```json
{
  "user_id": "uuid",
  "module_id": "uuid",
  "course_id": "uuid",
  "trigger": "inactivity | quiz_fail | low_engagement",
  "context_text": "...",
  "failed_quiz_question": "optional"
}
```

**Response** (NudgeResponse):

| Field | Type | Description |
|--------|------|-------------|
| `message` | string | Short proactive line Sudar shows to the learner (e.g. offer help). |
| `action_type` | string | Hint for the client, e.g. `explain_differently`, `suggest_modality`, `encourage`. |
| `suggested_modality` | string (optional) | When relevant, a modality the learner might switch to. |
| `choices` | array (optional) | **Tap-to-reply** options so the LMS can render buttons instead of free text. |

When `choices` is present, each item uses this shape (`NudgeChoice`):

```json
{
  "id": "hint",
  "label": "Give me a hint",
  "follow_up_message": "Give me a short hint on this section."
}
```

- **`id`**: Stable id for analytics (e.g. log with `tutor_action_taken` or your LMS equivalent).
- **`label`**: Short button text.
- **`follow_up_message`**: Optional. When non-empty, the client should send this string as the learner’s next message to **`POST /api/tutor/query`** (same as typing the question). When empty or omitted, the chip is a dismiss/low-friction action only.

**Usage**: External LMSs can show `message` plus `choices` as a compact banner or sheet; on chip tap, either forward `follow_up_message` to tutor query or record a dismiss. Sudar Learn implements the same pattern (idle nudge on the course, session/navigation prompts on the dashboard) via its own routes that log to `ai_interactions` / `learning_events`; ALP connectors calling Intelligence directly should use **`POST /api/tutor/nudge`** and **`POST /api/tutor/query`** as above for parity.

---

## 6. Modality recommendation (optional)

**Endpoint**: `POST /api/modality/recommend` (Intelligence)  
**Implementation**: [sudar-intelligence/src/api/routes/modality.py](../sudar-intelligence/src/api/routes/modality.py) — **requires** JWT or `X-Intelligence-Service-Secret` and matching `user_id`. Currently returns **501 Not Implemented**; use Sudar Learn for modality-aware UX until this route is wired to learner signals.

---

## 6A. Sudar Agents (integrators — reference surface on Intelligence)

Sudar exposes a **SudarAgents** gateway on **Sudar Intelligence**, separate from ALP `/api/alp/*` on Learn:

| Descriptor | Purpose |
|------------|---------|
| `GET /api/agents/alp-openapi.json` | Minimal OpenAPI-style sketch for LMS backends that orchestrate learner or admin missions (week plan, cohort path health). |
| `GET /api/agents/skills` | Logical catalogue of bounded tools backing those runs. |

**Auth nuance**: In-product flows use **Supabase JWT** from Learn or Studio BFFs. Partner LMS delegation may mirror **ALP patterns** (`x-alp-api-key`) on Learn proxies in future releases; until then prefer server-to-server calls that forward a valid learner JWT or use deployment-specific service auth only where Intelligence explicitly accepts `X-Intelligence-Service-Secret`.

Full architecture, persistence (`agent_runs`), cron, and organisation toggles: **[docs/AGENTS_PLATFORM.md](AGENTS_PLATFORM.md)**.

---

## 7. Summary table (ALP-facing endpoints)

| Purpose           | Method + path                    | Used by        |
|-------------------|----------------------------------|----------------|
| Update Twin from events | `POST /api/alp/events` (Learn) primary; `POST /api/learner/profile` (Intelligence) optional/legacy | SudarMemory    |
| Next-best action | `POST /api/learner/next-action` or `POST /api/alp/next-action` (Learn) | SudarRecommend |
| Tutor Q&A         | `POST /api/tutor/query` or `POST /api/alp/tutor/query` (Learn)          | SudarChat      |
| Proactive nudge   | `POST /api/tutor/nudge`          | SudarChat / LMS |
| Modality recommend | `POST /api/modality/recommend` | Optional       |
| Ingest LMS events | `POST /api/alp/events` (Learn app; see §2.2) | SudarMemory    |
| (Future) Read Twin | `GET /api/learner/{id}/twin` (TBD) | SudarChat, SudarRecommend |
| Embed token | `POST /api/alp/embed-token` (Learn) | Get short-lived token for iframe /alp/embed |

Base URL for Intelligence: e.g. `http://localhost:8001` when using `scripts/dev-with-sudarvid.mjs` (SudarVid uses **8000**), or your deployed Intelligence URL. **ALP HTTP endpoints** use the **Learn** base URL (e.g. `https://learn.example.com/api/alp/...`). CORS on Intelligence is configured for Studio and Learn origins; LMS backends should call Learn server-to-server (no browser CORS) or proxy through their own origin.

**Embed (iframe):** Call `POST /api/alp/embed-token` on the Learn app with ALP key and body `{ user_id, course_id?, module_id? }`. Response: `{ token, embed_url, expires_in }`. Use `embed_url` as the `src` of an iframe; the page at `/alp/embed` shows the Sudar chat and sends the token with each request. Tokens expire in 1 hour. Set `ALP_EMBED_SIGNING_SECRET` (or legacy `ALP_EMBED_SECRET`) and optionally `NEXT_PUBLIC_APP_URL` in Learn so the embed URL is correct. Do not reuse `ALP_API_KEY` as an embed signing secret.

---

## 8. SCORM and xAPI positioning

- **SCORM**: Remains the dominant standard for completion and score reporting. ALP accepts SCORM-style outcomes (completion, score, time) and maps them to `learning_events` so the Twin still benefits from basic LMS activity.
- **xAPI / LRS**: Richer, more granular statements (e.g. “answered question X”, “paused at 02:30”) support finer adaptivity and better next-best-action. ALP is designed to consume xAPI or LRS-style streams where available; when the host LMS only provides SCORM, ALP still works with the coarser event set.
- **ALP as intelligence layer**: ALP does not replace the LMS or the LRS; it consumes their events and exposes the Digital Learner Twin and tutor/next-action APIs so that any LMS can become “adaptive and memory-aware” without replacing its existing content or gradebook.

---

## 9. Connector implementation assets (new)

- TypeScript client starter: `integrations/alp-sdk/` (for Node/LTI middleware and custom LMS glue).
- Moodle plugin starter: `integrations/moodle/local_sudaralp/`:
  - Event forwarding queue (`db/events.php`, `classes/task/push_queue.php`) -> `POST /api/alp/events`
  - Tutor embed-token launcher (`tutor.php`) -> `POST /api/alp/embed-token`
  - Next-action surface (`nextaction.php`) -> `POST /api/alp/next-action`
- Delivery roadmap and production hardening steps: `docs/ALP_CONNECTOR_DELIVERY.md`

These assets are intentionally starter-level but executable in-repo, so ALP “existing LMS add-on” claims map to concrete code.

## 10. Analytics engine endpoints (v1)

Hybrid analytics delivery for Sudar:
- **Rollups in Supabase** (derived from `learning_events`)
- **Recommendations in Sudar Intelligence**
- **Presentation via Studio/Learn API routes**

### Studio API (admin reporting)
- `GET /api/analytics/overview` — org metrics snapshot (active vs idle time, focus ratio, engagement, completions, drop-offs)
- `GET /api/analytics/courses/:id` — course-level daily and module rollups
- `GET /api/analytics/learner-risk` — at-risk learners with score, reasons, and recency
- `GET /api/analytics/export?scope=overview|risk|course&course_id=<uuid>` — CSV export

### Learn API (learner insights)
- `GET /api/insights/me` — personal engagement, focus ratio, completion velocity, current NBA
- `GET /api/insights/time` — time timeline and next session duration recommendation
- `POST /api/insights/feedback` — learner feedback on suggested actions (`accepted|dismissed|later`)

### Intelligence API (recommendation helper)
- `POST /api/learner/next-action-analytics` — rule+score recommendation from aggregated features (`focus_ratio`, drop-off and completion signals)
