# Sudar Chat and Tutor QA Checklist

## Purpose
Regression checklist for Sudar chat/tutor response completeness, action rendering, and telemetry parity across Learn, course tutor, and ALP embed.

## Core scenarios
- Ask in global chat: `What should I learn next from my enrolled courses?`
  - Expect a complete response text (no trailing `json`, no `ACTIONS:` leak).
  - Expect at least one visible action button (for example, continue/review/open).
- Ask in course tutor with selected text context:
  - Highlight content and send `Explain this in simpler terms`.
  - Expect response acknowledges selection and renders normally.
- Trigger quiz flow:
  - Send `Quiz me`.
  - Expect quiz block with options, answer feedback, and `Try another`.
- **Structured blocks** (when the model returns `BLOCKS: [...]`):
  - Ask for multiple ways to continue; expect `choice_group` buttons; tap one → follow-up message sends; `learning_events` has `tutor_choice_selected` (and ALP: `source: alp_embed` when using embed + `/api/alp/tutor/choice`).
- **Web enrichment** (org allows + `TUTOR_WEB_ENRICHMENT_ENABLED` + `GOOGLE_SEARCH_*` set):
  - Ask for an “image of …” or “source on …”; expect `media_card` block(s) with attribution; facts should still match course RAG.
- `GET /api/tutor/resources?q=...` (auth): returns web + image lists when enrichment is enabled (generic AI rate bucket).
- Force malformed action output (dev/mock):
  - Expect readable fallback text and no raw JSON shown in bubble.
  - Malformed `BLOCKS:` JSON: no crash; user-visible note when `BLOCKS:` was present.

## Proactive and fallback scenarios
- Idle nudge API fallback (`/api/tutor/proactive-nudge`):
  - Simulate provider error.
  - Expect fallback nudge message + choices with 200 response.
- Tutor API malformed payload to client:
  - Simulate non-conforming JSON response.
  - Expect client shows safe fallback error instead of crashing.

## ALP embed parity
- Send tutor query from ALP embed.
  - Expect markdown response rendering in chat.
  - If actions exist, expect action buttons rendered.
  - Verify `learning_events` includes `ai_tutor_query` with `source: alp_embed`.

## Telemetry checks
- On tutor query (course and global), verify `learning_events` includes `ai_tutor_query`.
- On action click, verify `learning_events` includes `tutor_action_taken`.
- On **inline choice** (choice_group) click, verify `learning_events` includes `tutor_choice_selected` with `block_id` / `choice_id` in payload.
- On proactive chip use, verify `ai_interactions`/`learning_events` records are created.

