# AI system register (summary)

High-level transparency for major features. Refine per your legal review.

## Sudar Learn — AI tutor

- **Purpose:** Answer questions about course content and platform navigation; recommend actions within enrolled catalog.
- **Inputs:** Learner message, optional pasted/selected text, course/module text context, learner memory summary.
- **Outputs:** Natural language, optional structured `ACTIONS` (whitelisted open_course / open_path).
- **Human oversight:** Learner chooses to send messages; admins configure org safety toggles.
- **Limitations:** Heuristic PII blocking is not exhaustive; models may hallucinate.

## Sudar Studio — admin agent

- **Purpose:** Navigate and operate Studio via natural language and whitelisted actions.
- **Inputs:** Admin message, org-scoped IDs from server-built context.
- **Outputs:** Text + validated JSON actions (assign, open, export) enforced server-side.

## Content generation (Studio / Intelligence)

- **Purpose:** Generate course structure, media scripts, etc.
- **Inputs:** Author prompts and source documents (RAG).
- **Outputs:** Structured content for review before publish (customer responsibility).
