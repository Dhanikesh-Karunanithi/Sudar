# ALP — Adaptive Learning Layer API

**Purpose**: Single source of truth for the API surface that ALP plugins (e.g. Moodle SudarMemory, SudarChat, SudarRecommend) use to integrate with Sudar Intelligence. External LMSs send events and call these endpoints; the Intelligence service and Supabase hold the Digital Learner Twin and content.

**Audience**: ALP connector implementers (Moodle, Canvas, Blackboard), and anyone extending the plugin layer.

**Admin UI**: In **Sudar Studio**, open **Integrations** (Organization section) to see the Learn base URL for ALP, API key setup, and embed pointers.

**Reference implementation**: `byteos-intelligence/` (Python FastAPI). See also [ECOSYSTEM.md](ECOSYSTEM.md) §5 (schema) and §6 (Learn → Intelligence contracts).

---

## 1. Overview

ALP sits between a host LMS (Moodle, Canvas, Blackboard) and Sudar Intelligence. The host LMS:

- **Sends events** (completions, quiz attempts, time-on-task, tutor exchanges) so ALP can maintain the Digital Learner Twin.
- **Calls Intelligence** for tutor Q&A, next-best-action, and (optionally) modality recommendations.

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

### 2.2 Mapping from xAPI / SCORM

- **xAPI**: Map `actor.account.name` or similar to Sudar `user_id`; map `verb.id` to one of the `event_type` values above; put `result`, `object`, and extra data in `payload`; derive `duration_secs` from `result.duration` or timestamps.
- **SCORM**: Map `cmi.core.lesson_status` / `cmi.completion_status` to `module_complete`; put raw score and completion in `payload`; map SCO/course identifiers to `module_id`/`course_id` if they exist in Sudar.

**Ingestion endpoint (implemented)**: `POST /api/alp/events` on the **Learn** app (e.g. `https://learn.example.com/api/alp/events`). Accepts a batch of events; performs mapping and insert into `learning_events`; runs the same side-effects as the internal events API (enrollment progress, quiz struggles). Implementation: [byteos-learn/src/app/api/alp/events/route.ts](../byteos-learn/src/app/api/alp/events/route.ts).

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

**Endpoint**: `POST /api/learner/profile`  
**Implementation**: [byteos-intelligence/src/api/routes/learner.py](../byteos-intelligence/src/api/routes/learner.py)

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

## 4. Next-best action (SudarRecommend)

**Endpoint**: `POST /api/learner/next-action`  
**Implementation**: [byteos-intelligence/src/api/routes/learner.py](../byteos-intelligence/src/api/routes/learner.py)

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

**ALP proxy (implemented)**: For external LMSs, use `POST /api/alp/next-action` on the **Learn** app. Same request body; auth: `x-alp-api-key` or `Authorization: Bearer <ALP_API_KEY>`. Implementation: [byteos-learn/src/app/api/alp/next-action/route.ts](../byteos-learn/src/app/api/alp/next-action/route.ts).

---

## 5. AI tutor (SudarChat)

### 5.1 Tutor Q&A

**Endpoint**: `POST /api/tutor/query`  
**Implementation**: [byteos-intelligence/src/api/routes/tutor.py](../byteos-intelligence/src/api/routes/tutor.py)

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

**ALP proxy (implemented)**: For external LMSs, use `POST /api/alp/tutor/query` on the **Learn** app. Body: `{ user_id, message, context_text?, course_id?, module_id? }`. Auth: `x-alp-api-key` or `Authorization: Bearer <ALP_API_KEY>`. Learn forwards to Intelligence and logs to `ai_interactions`. Implementation: [byteos-learn/src/app/api/alp/tutor/query/route.ts](../byteos-learn/src/app/api/alp/tutor/query/route.ts).

### 5.2 Proactive nudge

**Endpoint**: `POST /api/tutor/nudge`  
**Implementation**: [byteos-intelligence/src/api/routes/tutor.py](../byteos-intelligence/src/api/routes/tutor.py)

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

**Response** (NudgeResponse): `message`, `action_type`, `suggested_modality` (optional).

---

## 6. Modality recommendation (optional)

**Endpoint**: `POST /api/modality/recommend`  
**Implementation**: [byteos-intelligence/src/api/routes/modality.py](../byteos-intelligence/src/api/routes/modality.py)

**Request**: `user_id`, `module_id`, `current_modality`.  
**Response**: `recommended_modality`, `confidence`, `reason`.

Used when the LMS wants to suggest a modality switch (e.g. “Try video for this module”) based on the learner’s Twin.

---

## 7. Summary table (ALP-facing endpoints)

| Purpose           | Method + path                    | Used by        |
|-------------------|----------------------------------|----------------|
| Update Twin from events | `POST /api/learner/profile`   | SudarMemory    |
| Next-best action | `POST /api/learner/next-action` or `POST /api/alp/next-action` (Learn) | SudarRecommend |
| Tutor Q&A         | `POST /api/tutor/query` or `POST /api/alp/tutor/query` (Learn)          | SudarChat      |
| Proactive nudge   | `POST /api/tutor/nudge`          | SudarChat / LMS |
| Modality recommend | `POST /api/modality/recommend` | Optional       |
| Ingest LMS events | `POST /api/alp/events` (Learn app; see §2.2) | SudarMemory    |
| (Future) Read Twin | `GET /api/learner/{id}/twin` (TBD) | SudarChat, SudarRecommend |
| Embed token | `POST /api/alp/embed-token` (Learn) | Get short-lived token for iframe /alp/embed |

Base URL for Intelligence: e.g. `http://localhost:8000` (development) or the deployed Intelligence URL. CORS is configured for Studio and Learn origins; ALP connectors calling from an LMS backend may need to be added to allowed origins or call via a same-origin proxy.

**Embed (iframe):** Call `POST /api/alp/embed-token` on the Learn app with ALP key and body `{ user_id, course_id?, module_id? }`. Response: `{ token, embed_url, expires_in }`. Use `embed_url` as the `src` of an iframe; the page at `/alp/embed` shows the Sudar chat and sends the token with each request. Tokens expire in 1 hour. Set `ALP_EMBED_SECRET` (or `ALP_API_KEY`) and optionally `NEXT_PUBLIC_APP_URL` in Learn so the embed URL is correct.

---

## 8. SCORM and xAPI positioning

- **SCORM**: Remains the dominant standard for completion and score reporting. ALP accepts SCORM-style outcomes (completion, score, time) and maps them to `learning_events` so the Twin still benefits from basic LMS activity.
- **xAPI / LRS**: Richer, more granular statements (e.g. “answered question X”, “paused at 02:30”) support finer adaptivity and better next-best-action. ALP is designed to consume xAPI or LRS-style streams where available; when the host LMS only provides SCORM, ALP still works with the coarser event set.
- **ALP as intelligence layer**: ALP does not replace the LMS or the LRS; it consumes their events and exposes the Digital Learner Twin and tutor/next-action APIs so that any LMS can become “adaptive and memory-aware” without replacing its existing content or gradebook.
