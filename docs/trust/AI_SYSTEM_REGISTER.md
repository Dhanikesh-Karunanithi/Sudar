# AI system register (summary)

High-level transparency for major features. Refine per your legal review.

## Sudar Learn — AI tutor

- **Purpose:** Answer questions about course content and platform navigation; recommend actions within enrolled catalog.
- **Inputs:** Learner message, optional pasted/selected text, course/module text context, learner memory summary.
- **Outputs:** Natural language, optional structured `ACTIONS` (whitelisted open_course / open_path).
- **Human oversight:** Learner chooses to send messages; admins configure org safety toggles.
- **Limitations:** Heuristic PII blocking is not exhaustive; models may hallucinate.

## Sudar Learn — SudarNotes (conversational learning)

- **Purpose:** Teach via dialogue and a living notebook (accept/edit suggested notes); soft conversational checks; optional claim mastery when Teaching OS claims are linked.
- **Inputs:** Learner messages, SudarNotes session state, Twin summary, optional domain/claim context.
- **Outputs:** Chat Markdown, `SUDAR_NOTES` note ops / checks, optional structured blocks; events `ai_tutor_query` / `claim_check` as configured.
- **Human oversight:** Learner accepts or dismisses notebook cards; org AI compliance and tutor memory cadence apply.
- **Limitations:** Same model hallucination risks as the course tutor; open-world teaching should stay grounded when org policy requires claims.
- **Docs:** [SUDAR_2_0_VISION.md](../SUDAR_2_0_VISION.md), [TEACHING_OS.md](../TEACHING_OS.md).

## Sudar Studio — admin agent

- **Purpose:** Navigate and operate Studio via natural language and whitelisted actions.
- **Inputs:** Admin message, org-scoped IDs from server-built context.
- **Outputs:** Text + validated JSON actions (assign, open, export) enforced server-side.

## Content generation (Studio / Intelligence)

- **Purpose:** Generate course structure, media scripts, etc.
- **Inputs:** Author prompts and source documents (RAG).
- **Outputs:** Structured content for review before publish (customer responsibility).
