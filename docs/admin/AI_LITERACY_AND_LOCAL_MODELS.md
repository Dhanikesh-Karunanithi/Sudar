# Understanding AI in Sudar — admin reference (printable)

This document mirrors the in-app course at **Studio → Understanding AI** (`/help/ai-at-sudar`). Use it for handouts, security reviews, or operators who prefer a single file.

---

## Lesson 1 — What Sudar uses AI for

Sudar uses AI to help your team create courses faster and to give each learner a helpful tutor named Sudar.

- **Sudar Studio:** outlines, module text, quizzes, scripts for audio/video-style content.
- **Sudar Learn:** the Sudar tutor answers questions about the course, explains ideas, and can run small workflows on pasted text (e.g. summarize).

You still choose what to publish; learners choose how they study.

---

## Lesson 2 — Cloud vs your own server

**Cloud (default):** Connect Sudar to a provider using API keys (**AI & API Keys**). The Sudar server sends the minimum text needed for each task.

**Private server (optional):** Run an open model (e.g. Google Gemma via Ollama) on hardware you control. When enabled in **Org settings → Where Sudar runs your AI**, chat and generation use that address.

Course search / embeddings may still use a separate provider unless configured otherwise.

---

## Lesson 3 — Gemma and local models

Gemma is a family of models from Google, distributed under terms you must accept for your use case. Smaller sizes are intended to run on common laptops with tools such as Ollama or LM Studio.

- Overview: [Run Gemma](https://ai.google.dev/gemma/docs/run)
- Terms: [Gemma terms of use](https://ai.google.dev/gemma/terms)

---

## Lesson 4 — Connecting a private server

1. Install **Ollama** or **LM Studio** (or another OpenAI-compatible server).
2. Download a model (e.g. `gemma3:4b` in Ollama).
3. Note the URL (often `http://127.0.0.1:11434` for Ollama on the same machine).
4. In **Org settings**, enable private server, paste the full URL, enter the **exact** model id.
5. IT sets the bearer token on the Sudar deployment (`LOCAL_LLM_BEARER_TOKEN` or `AI_CHAT_API_KEY`), not in the browser form.

---

## Lesson 5 — Org settings walkthrough

- **Org settings:** “Where Sudar runs your AI” controls private routing for your organisation.
- **AI & API Keys:** cloud keys and signup links.
- **Test connection:** saves draft settings then pings your private server with a tiny prompt.

---

## Lesson 6 — Troubleshooting

- AI app not running or wrong port.
- Sudar hosted in the cloud cannot reach a laptop on someone’s desk without VPN/tunnel—architecture must allow outbound access from Sudar to your server.
- Model name must match the server (e.g. `ollama list`).
- Firewalls blocking outbound HTTP/HTTPS from the Sudar host to your private IP.

---

## Lesson 7 — Governance and privacy

- **Governance** summarises org-level tutor safety and personalization flags.
- Repository **docs/trust/** contains the technical trust pack (data flows, subprocessors, threat model).
- Private AI reduces sending prompts to public cloud inference; you still need a full assessment for your jurisdiction.

---

## Operator checklist (deployment)

| Variable | Purpose |
|----------|---------|
| `ALLOW_ORG_PRIVATE_AI_SERVER` | Set to `true` to let org admins configure private AI in Org settings. Default off (SSRF risk if misused). |
| `LOCAL_LLM_BEARER_TOKEN` or `AI_CHAT_API_KEY` | Bearer token sent to the private OpenAI-compatible server (Ollama accepts any non-empty value). |
| `PRIVATE_AI_URL_HOST_ALLOWLIST` | Optional comma-separated hostnames; when set, only those hosts are allowed (otherwise private LAN IPs and localhost are allowed). |

**Sudar Intelligence (Python):** remains **environment-based** for chat in this version. If Intelligence must use the same private model, configure its env to point at your server or extend it in a follow-up.

**Cross-links:** [ENV_REFERENCE.md](../ENV_REFERENCE.md) (Local LLM and AI tables).

---

*Sudar — Learns with you, for you.*
