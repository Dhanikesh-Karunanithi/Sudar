# Sudar Studio — Instruction Guide

**Audience**: L&D managers, content creators, and org admins who use Sudar Studio to build courses, manage learning paths, and connect external systems (LMSs, intranets) to Sudar.

**Purpose**: Single reference for using Studio, including the Integrations layer (API keys, embed Sudar, event ingestion) and how it ties into the ALP (Adaptive Learning Layer).

---

## 1. What is Sudar Studio?

Sudar Studio (SudarLab) is the **admin and creator** app for Sudar. It runs on **port 3000** and is separate from Sudar Learn (port 3001), where learners take courses.

**You use Studio to:**

- Create and edit courses and learning paths
- Manage organisation users and settings
- **Manage integrations**: generate API keys for external LMSs, create embed links for the Sudar tutor, and understand how to send learning events into Sudar (SudarMemory)

Studio and Learn share the same Supabase project, so content and learner data stay in one place.

---

## 2. Getting started

### 2.1 Run Studio

From the `byteos-studio` folder:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with your organisation account.

### 2.2 Environment variables

Copy `.env.example` to `.env` and set at least:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or equivalent)
- **Integrations**: `NEXT_PUBLIC_LEARN_APP_URL` — base URL of your Sudar Learn app (e.g. `https://learn.yourorg.com`). Required for Integrations to show correct ALP endpoints and for generating embed URLs.

See `byteos-studio/.env.example` for the full list.

---

## 3. Navigation

The sidebar has two groups.

### Content


| Item               | Purpose                                                   |
| ------------------ | --------------------------------------------------------- |
| **Dashboard**      | Overview, quick access to courses and paths               |
| **Courses**        | Create, edit, and publish courses                         |
| **Learning Paths** | Build ordered sequences of courses and assign to learners |
| **Analytics**      | Completions, skill gaps, drop-off                         |
| **Compliance**     | Overdue, at-risk, on-track views                          |


### Organization


| Item             | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| **Users**        | Manage organisation members and roles                      |
| **Integrations** | **API keys, embed Sudar, event ingestion** — see Section 4 |
| **Org settings** | Organisation-wide configuration                            |


Only users with **Admin** or **Manager** org roles see the Organization section.

---

## 4. Integrations (ALP & external systems)

**Path**: Sidebar → **Organization** → **Integrations**.

Integrations is where you configure how external systems (Moodle, Canvas, your intranet, partner portals) connect to Sudar’s intelligence: send events, use the tutor, and show “next best action” without replacing your existing LMS.

---

### 4.1 ALP & API access

**Learn app base URL**

- Shown at the top of this section. It must be set via `NEXT_PUBLIC_LEARN_APP_URL` in Studio’s environment.
- All ALP endpoints live on the **Learn** app (e.g. `https://your-learn-app.com/api/alp/...`). External systems call this URL with an API key.

**Integration API keys**

- **Create a key**: Enter a name (e.g. “Moodle production”) and click **Create key**. The **raw key is shown once** in a modal — copy and store it securely; it cannot be viewed again.
- **Use the key**: Send it in requests as:
  - Header: `x-alp-api-key: <your-key>`, or
  - Header: `Authorization: Bearer <your-key>`
- **List keys**: You see key name, prefix (e.g. `alp_…`), and last used date. You can **Revoke** (trash icon) to invalidate a key immediately.
- **Learn app**: Learn can also use a single shared key via the `ALP_API_KEY` environment variable; org-level keys in the list are an alternative so you can have one key per LMS or partner.

**Full API reference**

- Link: **ALP API documentation** (opens `docs/ALP_API.md` in the repo). It defines event ingestion, tutor, next-action, embed token, and request/response shapes.

---

### 4.2 Embed Sudar in other platforms

You can embed the Sudar tutor (chat) in another LMS (e.g. as a Moodle block or LTI tool), your intranet, or a partner portal.

**Ways to use the tutor from outside Learn**

1. **Call the API from your backend**: Your server sends the learner’s message to `POST …/api/alp/tutor/query` with the API key and `user_id`; you build your own chat UI (sidebar, modal, etc.).
2. **Embed the pre-built chat in an iframe**: Use the “Generate embed link” flow below; the link loads the Sudar chat page and passes a short-lived token so the iframe can talk to the tutor API.

**Generate embed link (iframe)**

1. **User ID**: Sudar learner UUID (must match a user in your Supabase `profiles`; map from your LMS user if needed).
2. **API key**: An integration API key from Section 4.1 (or your `ALP_API_KEY`).
3. **Course ID** (optional): Restrict tutor context to a course.
4. **Module ID** (optional): Restrict to a module.

Click **Get embed URL**. Copy the URL and use it as the `src` of an iframe. **The link expires in 1 hour**; your LMS or portal should request a new one when the learner opens the embed (e.g. via your backend calling Learn’s `POST /api/alp/embed-token`).

**Other ALP endpoints you can call**

- **Next-action widget**: `POST …/api/alp/next-action` — returns a “what to do next” recommendation for your dashboard.
- See `docs/ALP_API.md` for request bodies and auth.

---

### 4.3 Event ingestion (SudarMemory)

So that Sudar has a full picture of the learner (Digital Learner Twin), your LMS should send learning events to the Learn app. One endpoint accepts batches of events.

**Endpoint**

```
POST <Learn base URL>/api/alp/events
```

**Auth**: Same as above — `x-alp-api-key` or `Authorization: Bearer <key>`.

**Body (summary)**

```json
{
  "user_id": "uuid (Sudar profiles.id)",
  "events": [
    {
      "event_type": "module_complete",
      "course_id": "uuid (optional)",
      "module_id": "uuid (optional)",
      "payload": {},
      "modality": "text",
      "duration_secs": 120
    }
  ]
}
```

**Important**

- Map your LMS user to Sudar’s `user_id` (e.g. via LTI or your directory sync).
- `event_type` values align with Learn telemetry: e.g. `module_start`, `module_complete`, `quiz_attempt`, `video_play`, `section_heartbeat`, `ai_tutor_query`, `modality_switch`, `drop_off`, `streak_broken`. Full list and payload shapes: **ALP API documentation** (`docs/ALP_API.md`).

Events are written to `learning_events` and drive the same side-effects as internal Learn activity (enrollment progress, quiz struggles, Twin updates).

---

## 5. Quick reference


| What you want to do                              | Where in Studio                                                               | More detail                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------- |
| Give an external LMS access to ALP               | Integrations → Create key, share base URL + key                               | `docs/ALP_API.md`                 |
| Embed Sudar chat in your site                    | Integrations → Embed Sudar → Generate embed link                              | §4.2, ALP_API.md §7 (embed token) |
| Send LMS events into Sudar                       | Integrations → Event ingestion; implement `POST …/api/alp/events` in your LMS | §4.3, ALP_API.md §2               |
| See exact request/response for all ALP endpoints | Integrations → “ALP API documentation” link                                   | `docs/ALP_API.md`                 |


---

## 6. Related docs

- **ECOSYSTEM.md** — Architecture, schema, and how Studio, Learn, and Intelligence fit together.
- **ALP_API.md** — Full ALP API: event ingestion, learner Twin, next-action, tutor, embed token, SCORM/xAPI.
- **LAMP_BUILD_PLAN.md** / **LAMP_BUILD_TRACKER.md** — Build-first plan and task status for LAMP/ALP work.

---

*Sudar Studio — Instruction guide. Last updated to include Integrations (API keys, embed URL, event ingestion) and ALP references.*