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
- Force malformed action output (dev/mock):
  - Expect readable fallback text and no raw JSON shown in bubble.

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
- On proactive chip use, verify `ai_interactions`/`learning_events` records are created.

