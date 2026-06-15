# Sudar Create API — LMS content generation services

**Purpose**: Org-scoped HTTP contract for AI content generation tools that external LMSs (Moodle, Canvas, Blackboard) can call without Sudar Studio. Mirrors the ALP pattern on **Sudar Learn** (`POST /api/alp/create/*`).

**Audience**: LMS connector implementers, LTI tool registrars, MCP integrators.

**See also**: [ALP_API.md](ALP_API.md) (learner intelligence), [ALP_CONNECTOR_DELIVERY.md](ALP_CONNECTOR_DELIVERY.md) (maturity ladder), [MCP_SERVERS.md](MCP_SERVERS.md).

---

## 1. Overview

Sudar Create exposes generation services (quiz, interactives, flashcards, outlines, document-to-course, media) to host LMSs:

- **Headless**: `POST /api/alp/create/*` with org-scoped `x-alp-api-key`.
- **Embedded UI**: `POST /api/alp/create/embed-token` → iframe at `/alp/create?token=...` (teacher workflow).
- **MCP**: `@sudar/mcp-server` tools `sudar_create_*` call the same endpoints.

Generated artifacts can be returned as **JSON**, **SCORM 1.2 ZIP** (single-SCO), or **embed URL** for iframe activities.

---

## 2. Authentication

Same as ALP ([ALP_API.md §2](ALP_API.md)):

| Method | Header |
|--------|--------|
| API key | `x-alp-api-key: <key>` or `Authorization: Bearer <key>` |
| Create embed token | `Authorization: Bearer <token>` from `/api/alp/create/embed-token` |

**Org-scoped keys required** for create routes (env-wide `ALP_API_KEY` without org binding returns `403`).

Optional body field **`creator_user_id`** (UUID): Sudar `profiles.id` of the teacher for AI usage metering. Must be a member of the key's organisation when provided.

---

## 3. Endpoints

### 3.1 `POST /api/alp/create/quiz`

Generate multiple-choice questions from source text.

**Request**:
```json
{
  "creator_user_id": "uuid (optional)",
  "content": "Module or lesson text…",
  "course_title": "Optional course name",
  "module_title": "Optional module name",
  "difficulty": "beginner | intermediate | advanced",
  "num_questions": 4,
  "export_format": "json | scorm12"
}
```

**Response** (`export_format: json`):
```json
{
  "success": true,
  "quiz": {
    "questions": [
      {
        "id": "q1",
        "question": "…?",
        "options": ["A", "B", "C", "D"],
        "correct": 0,
        "explanation": "…",
        "topic": "short tag"
      }
    ]
  }
}
```

**Response** (`export_format: scorm12`): same JSON plus `scorm_base64` (ZIP, base64-encoded single-SCO package).

---

### 3.2 `POST /api/alp/create/interactive`

Generate Genially-style interactive blocks (timeline, hotspot, matching, tabs, flipcard, quiz).

**Request**:
```json
{
  "creator_user_id": "uuid (optional)",
  "content": "Source text or topic description",
  "title": "Activity title",
  "component_types": ["timeline", "matching"],
  "image_url": "https://… (optional, for hotspot)",
  "export_format": "json | scorm12"
}
```

**Response**:
```json
{
  "success": true,
  "interactive_elements": [
    { "type": "timeline", "data": { "steps": [{ "title": "…", "description": "…" }] } }
  ],
  "scorm_base64": "… (when export_format is scorm12)"
}
```

---

### 3.3 `POST /api/alp/create/flashcards`

**Request**:
```json
{
  "creator_user_id": "uuid (optional)",
  "content": "Source text",
  "module_title": "Optional title",
  "export_format": "json | scorm12 | embed"
}
```

**Response**:
```json
{
  "success": true,
  "cards": [{ "front": "…", "back": "…" }],
  "embed_url": "https://learn.example.com/alp/create/preview/flashcards?… (when embed requested)"
}
```

---

### 3.4 `POST /api/alp/create/outline`

**Request**:
```json
{
  "creator_user_id": "uuid (optional)",
  "course_title": "Course name",
  "description": "Optional brief",
  "difficulty": "intermediate",
  "num_modules": 5
}
```

**Response**: `{ "success": true, "modules": ["Module 1", "Module 2", …] }`

---

### 3.5 `POST /api/alp/create/from-document` (async)

Starts document-to-course generation. Returns a job id.

**Request**:
```json
{
  "creator_user_id": "uuid (required for async jobs)",
  "text": "Pasted document text (optional if url set)",
  "url": "https://… (optional)",
  "course_title": "Optional override",
  "difficulty": "intermediate",
  "webhook_url": "https://lms.example.com/hooks/sudar (optional)",
  "export_format": "json | scorm12"
}
```

**Response**: `{ "success": true, "job_id": "uuid", "status": "queued" }`

Poll: `GET /api/alp/create/jobs/{job_id}`

---

### 3.6 `POST /api/alp/create/media` (async)

**Request**:
```json
{
  "creator_user_id": "uuid (required)",
  "content": "Module text for script",
  "title": "Activity title",
  "media_type": "podcast | video",
  "webhook_url": "https://… (optional)"
}
```

**Response**: `{ "success": true, "job_id": "uuid", "status": "queued" }`

---

### 3.7 `GET /api/alp/create/jobs/{job_id}`

**Response** (running):
```json
{ "success": true, "job_id": "uuid", "status": "queued | running | completed | failed", "progress": 0.4 }
```

**Response** (completed):
```json
{
  "success": true,
  "status": "completed",
  "result": { "outline": ["…"], "scorm_base64": "…" },
  "error": null
}
```

---

### 3.8 `POST /api/alp/create/embed-token`

Short-lived token for the `/alp/create` teacher UI.

**Request**:
```json
{
  "creator_user_id": "uuid",
  "tool": "quiz | interact | cards | draft | media | outline (optional default picker)"
}
```

**Response**:
```json
{
  "token": "…",
  "embed_url": "https://learn.example.com/alp/create?token=…",
  "expires_in": 3600
}
```

Requires org-scoped ALP key. `creator_user_id` must belong to the org.

---

## 4. Export formats

| Format | Use case |
|--------|----------|
| `json` | LMS ingests structured data natively |
| `scorm12` | Universal upload to Moodle/Canvas/Blackboard SCORM activity |
| `embed` | iframe URL for HTML activity / page resource |

Implementation: [shared/content-generation/scorm/buildSingleScoZip.ts](../shared/content-generation/scorm/buildSingleScoZip.ts)

---

## 5. xAPI statements (outbound audit)

When `emit_xapi: true` is set on create requests, Sudar Learn may POST statements to a configured LRS (org setting `create_lrs_endpoint`) or return them in the response `xapi_statements` array:

```json
{
  "actor": { "mbox": "mailto:creator@org.com", "name": "Creator UUID" },
  "verb": { "id": "http://adlnet.gov/expapi/verbs/created", "display": { "en-US": "created" } },
  "object": { "id": "https://sudar.app/create/quiz/{request_id}", "definition": { "type": "http://adlnet.gov/expapi/activities/assessment" } },
  "result": { "extensions": { "https://sudar.app/xapi/export_format": "scorm12" } }
}
```

Verbs: `created`, `downloaded`, `imported` (when LMS confirms insert via webhook callback).

---

## 6. Rate limits

- Sync create routes: 30 requests/minute per org key (aligned with Intelligence content limits).
- Async jobs: 10 concurrent queued jobs per org.

---

## 7. Plugin mapping

| Sudar plugin | Create endpoint | LMS integration |
|--------------|-----------------|-----------------|
| SudarQuiz | `/api/alp/create/quiz` | LTI + SCORM download |
| SudarInteract | `/api/alp/create/interactive` | LTI + SCORM |
| SudarCards | `/api/alp/create/flashcards` | LTI embed |
| SudarDraft | `/api/alp/create/from-document` | Async + SCORM |
| SudarMedia | `/api/alp/create/media` | Async + webhook |
| SudarChat | `/api/alp/tutor/query` | Existing ALP |
| SudarMemory | `/api/alp/events` | Existing ALP |

Moodle starter: [integrations/moodle/local_sudaralp/create.php](../integrations/moodle/local_sudaralp/create.php)  
Canvas LTI: [integrations/canvas/README.md](../integrations/canvas/README.md)

---

## 8. Maturity

**Pilot** when: org-scoped keys, embed UI, quiz/interactive/flashcards sync routes, single-SCO SCORM export, and Moodle create launcher link are documented and tested in CI golden contracts.

**Production** when: partner sign-off, webhook HMAC verification, and optional LTI Deep Linking return are hardened per [ALP_CONNECTOR_DELIVERY.md](ALP_CONNECTOR_DELIVERY.md).
