# Sudar — Environment Variables Reference

This is the single source of truth for all environment variables used across Sudar Studio, Sudar Learn, and Sudar Intelligence. The in-app **AI & API Keys** page (Studio → Settings → AI & API Keys) shows key status and "How to get this key" steps; the list is driven by `sudar-studio/src/lib/ai/providerConfig.ts`. **Keep in sync:** when adding a new provider or env var, update both this file and `providerConfig.ts` so the Keys page and this reference stay aligned.

**Where to set these**: Add to `.env.local` (local) or your host's environment (Vercel, Railway, Render). See Studio → AI & API Keys → "Where to set these" for copy-paste and host-specific instructions.

---

## Required (all deployments)

| Variable | App | Description |
|----------|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Studio, Learn | Supabase project URL. [Get from](https://supabase.com/dashboard/project/_/settings/api) Project Settings → API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Studio, Learn | Supabase anon (public) key. Same dashboard as above. |
| `SUPABASE_SERVICE_ROLE_KEY` | Studio, Learn | Supabase service role key (server-only). Same dashboard. |
| `NEXTAUTH_URL` | Studio, Learn | Base URL of the app (e.g. `http://localhost:3000` for Studio, `http://localhost:3001` for Learn). |
| `NEXTAUTH_SECRET` | Studio, Learn | Random 32+ character string for session signing. Generate with `openssl rand -base64 32`. |
| `SUDAR_INTELLIGENCE_URL` | Studio, Learn | Preferred: Sudar Intelligence API base URL. With `scripts/dev-with-sudarvid.mjs`, default is `http://localhost:8001` (SudarVid uses **8000**). |
| `BYTEOS_INTELLIGENCE_URL` | Studio, Learn | Legacy alias for Intelligence URL; same semantics as `SUDAR_INTELLIGENCE_URL`. |

---

## AI — Chat / LLM (at least one provider required)

Set **one** of the following API keys (or use `AI_CHAT_PROVIDER` to choose explicitly). Fallback order when unset: OpenRouter → Together → OpenAI → Anthropic.

| Variable | App | Description | Get key |
|----------|-----|-------------|---------|
| `AI_CHAT_PROVIDER` | Studio, Learn | Preferred provider: `openrouter` \| `together` \| `openai` \| `anthropic` \| `custom`. If unset, first available key is used. | — |
| `OPENROUTER_API_KEY` | Studio, Learn | [OpenRouter](https://openrouter.ai/) — single key for many models (OpenAI, Anthropic, etc.). | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `TOGETHER_API_KEY` | Studio, Learn, Intelligence | [Together AI](https://www.together.ai/) — cost-effective open models. | [api.together.xyz](https://api.together.xyz/) → Settings → API Keys |
| `OPENAI_API_KEY` | Studio, Learn, Intelligence | [OpenAI](https://platform.openai.com/) — GPT-4, etc. | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | Studio, Learn, Intelligence | [Anthropic](https://www.anthropic.com/) — Claude models. | [console.anthropic.com](https://console.anthropic.com/) → API Keys |
| `AI_CHAT_BASE_URL` | Studio, Learn, Intelligence | For custom/local models. **Host only** (no `/v1` path): Sudar appends `/v1/chat/completions`. Example: `http://127.0.0.1:11434` (Ollama), `http://127.0.0.1:1234` (LM Studio). | — |
| `AI_CHAT_API_KEY` | Studio, Learn, Intelligence | Bearer token for the custom server. Ollama ignores the value but still expects a header — use e.g. `ollama`. LM Studio may use a key from its server settings. | — |
| `AI_CHAT_DEFAULT_MODEL` | Studio, Learn, Intelligence | Required for local servers: must match the model id loaded in Ollama/LM Studio (e.g. `gemma3:4b`, `gemma3:12b`). Cloud defaults do not apply. | — |

### Local LLM (Gemma, Llama, etc.) — OpenAI-compatible servers

Sudar chat uses an **OpenAI-compatible** HTTP API. You can point it at a **local** inference stack instead of a cloud API.

1. **Install a local runner** (pick one):
   - **[Ollama](https://ollama.com/)** — `ollama pull gemma3:4b` (or `gemma3:12b`, etc.). See [Google’s Ollama + Gemma guide](https://ai.google.dev/gemma/docs/integrations/ollama).
   - **[LM Studio](https://lmstudio.ai/)** — download a Gemma GGUF, start the **Local Server** tab. See [LM Studio + Gemma](https://ai.google.dev/gemma/docs/integrations/lmstudio).
   - **vLLM / llama.cpp server** — production-style serving; still exposes `/v1/chat/completions` when configured for OpenAI compatibility.

2. **Gemma overview** — Open **weights** (usage under [Gemma terms](https://ai.google.dev/gemma/terms)); model list and frameworks: [Run Gemma](https://ai.google.dev/gemma/docs/run). For **on-device / edge** (phone, NPU), Google documents [LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM), [MediaPipe LLM Inference](https://ai.google.dev/edge/mediapipe/solutions/genai/llm_inference), and **MLX** (Apple Silicon).

3. **Wire Sudar** — in `.env.local` (Studio, Learn) and Intelligence’s env:

   ```env
   AI_CHAT_PROVIDER=custom
   AI_CHAT_BASE_URL=http://127.0.0.1:11434
   AI_CHAT_API_KEY=ollama
   AI_CHAT_DEFAULT_MODEL=gemma3:4b
   ```

   Use the **model name exactly** as shown by `ollama list` or LM Studio. **Embeddings** for RAG still use `EMBED_PROVIDER` (Together / OpenAI / Hugging Face) unless you add a separate local embedding service — local chat does not replace embeddings by itself.

4. **Docker / remote LAN** — use the machine’s IP instead of `127.0.0.1` if Learn runs in a container and Ollama on the host (ensure the server binds to `0.0.0.0` where appropriate).

Studio **Settings → AI & API Keys** includes a **Local / OpenAI-compatible LLM** card with the same steps.

### Organisation private AI (Studio + Learn)

When `ALLOW_ORG_PRIVATE_AI_SERVER=true`, org **Admins/Managers** can set a private OpenAI-compatible URL and model in **Org settings → Where Sudar runs your AI** (stored in `organisations.settings.ai_inference`). The bearer token is **not** stored in the database.

| Variable | App | Description |
|----------|-----|-------------|
| `ALLOW_ORG_PRIVATE_AI_SERVER` | Studio, Learn | Must be `true` to allow org-level private server settings. Default off (mitigates SSRF if untrusted admins exist). |
| `LOCAL_LLM_BEARER_TOKEN` | Studio, Learn | Preferred bearer for org private server; falls back to `AI_CHAT_API_KEY`. |
| `PRIVATE_AI_URL_HOST_ALLOWLIST` | Studio, Learn | Optional comma-separated hostnames; when set, only those hosts are accepted (otherwise private IPv4 + localhost). |

Admin-facing walkthrough: **Studio → Understanding AI** (`/help/ai-at-sudar`). Printable mirror: [docs/admin/AI_LITERACY_AND_LOCAL_MODELS.md](admin/AI_LITERACY_AND_LOCAL_MODELS.md).

**Sudar Intelligence** does not read `organisations.settings` yet; configure `AI_CHAT_*` env on the Intelligence host for the same effect, or extend in a follow-up.

---

## AI — Embeddings (RAG / tutor context)

Used by Sudar Learn for RAG (course search) and optionally by Studio if document-based generation uses embeddings.

| Variable | App | Description | Get key |
|----------|-----|-------------|---------|
| `EMBED_PROVIDER` | Learn | `together` \| `openai` \| `huggingface`. Default: first available (Together, then OpenAI, then Hugging Face). | — |
| `TOGETHER_API_KEY` | Learn | Used for Together embeddings (e.g. BAAI/bge-large-en-v1.5). | Same as Chat. |
| `OPENAI_API_KEY` | Learn | Used for OpenAI embeddings (text-embedding-3-small, 1024 dims). | Same as Chat. |
| `HUGGINGFACE_API_KEY` | Learn | [Hugging Face](https://huggingface.co/) — for embeddings via Inference API (e.g. BAAI/bge-large-en-v1.5, 1024 dims). | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `EMBED_MODEL` | Learn | Override embedding model (e.g. `BAAI/bge-large-en-v1.5` for Together/HF). | — |
| `EMBED_DIM` | Learn | Vector dimension (default 1024 for RAG; must match pgvector). | — |

---

## AI — TTS (text-to-speech)

| Variable | App | Description | Get key |
|----------|-----|-------------|---------|
| `OPENAI_API_KEY` | Studio | OpenAI TTS (audio/speech) for Listen modality and video narration. | Same as Chat. |
| `SARVAM_API_KEY` | Intelligence, Studio, Learn | [Sarvam AI](https://sarvam.ai/) provider status indicator in voice settings. Optional in this phase (status only; no live library fetch). | Sarvam AI console |
| `ELEVENLABS_API_KEY` | Studio, Learn | ElevenLabs provider status indicator in voice settings. Optional in this phase (status only; no live library fetch). | [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys) |
| `BYTEOS_INTELLIGENCE_URL` | Studio, Learn | When set, apps can proxy TTS through Intelligence (Edge-TTS first; optional provider fallback paths). | — |
| `INTELLIGENCE_SERVICE_SECRET` | Studio, Learn, Intelligence | Optional shared secret for Studio/Learn/Intelligence server-to-server TTS calls (`X-Intelligence-Service-Secret`). | — |

---

## Media search (optional — Studio course editor; also Learn tutor web/image cards when enabled)

| Variable | App | Description | Get key |
|----------|-----|-------------|---------|
| `GOOGLE_SEARCH_API_KEY` | Studio, Learn | Google Custom Search (images + web for research; Learn uses same keys for optional tutor `media_card` enrichment). | [Google Cloud Console](https://console.cloud.google.com/) → APIs → Custom Search API |
| `GOOGLE_SEARCH_ENGINE_ID` | Studio, Learn | Custom Search Engine ID (create at [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)). | Same |
| `TUTOR_WEB_ENRICHMENT_ENABLED` | Learn | When `true`, enables server-side web/image search helper for course tutor when the org also allows it (`settings.ai_compliance.tutor_web_enrichment_enabled` not `false`). Default off if unset. | — |
| `PEXELS_API_KEY` | Studio | [Pexels](https://www.pexels.com/api/) — stock photos/videos. | pexels.com/api |
| `UNSPLASH_ACCESS_KEY` | Studio | [Unsplash](https://unsplash.com/developers) — stock photos. | unsplash.com/developers |
| `GIPHY_API_KEY` | Studio | [Giphy](https://developers.giphy.com/) — animated GIFs. | developers.giphy.com |
| `FREESOUND_API_KEY` | Studio | [Freesound](https://freesound.org/apiv2/apply/) — CC0 audio. | freesound.org/apiv2/apply/ |

---

## Integrations & ALP

| Variable | App | Description | Get key |
|----------|-----|-------------|---------|
| `NEXT_PUBLIC_LEARN_APP_URL` | Studio | Learn app base URL (for Integrations page, embed URL builder). e.g. `http://localhost:3001`. | — |
| `ALP_API_KEY` | Learn | Optional. If set, POST /api/alp/events requires this key (or keys from Studio → Integrations). | Create in Studio → Integrations |
| `ALP_EMBED_SIGNING_SECRET` | Learn | Dedicated signing secret for embed tokens. Required for `/api/alp/embed-token`; do not reuse `ALP_API_KEY`. | Generate a random secret |
| `ALP_EMBED_SECRET` | Learn | Legacy alias for `ALP_EMBED_SIGNING_SECRET`. Prefer the dedicated variable above. | — |
| `ALP_LTI_TOOL_JWKS_JSON` | Learn | JSON JWKS document `{ "keys": [ ... ] }` exposed at `GET /api/alp/lti/jwks` for LTI 1.3 tool registration in the LMS. | Generate an RSA keypair and publish the public JWK set |
| `NEXT_PUBLIC_APP_URL` | Learn | Public URL of Learn app (certificates, embed). | — |
| `NOTIFICATION_UNSUBSCRIBE_SECRET` | Learn, Studio | Dedicated HMAC secret for unsubscribe tokens. Required anywhere notification emails are sent. | Generate a random secret |
| `NOTIFICATION_LINK_SIGNING_SECRET` | Learn | Dedicated HMAC secret for notification tracking links. | Generate a random secret |

---

## Video & microservices

| Variable | App | Description |
|----------|-----|-------------|
| `SUDARVID_URL` | Learn, Studio (optional), Intelligence (optional) | SudarVid microservice base URL for the Watch modality (e.g. `http://localhost:8000`). Code and docs use this name only; run the service from repo folder `sudar_vid`. |
| `SUDARVID_ENGINE_MODE` | Learn | Default Watch generation engine mode for contract requests (`classic` default, optional `premium`). |
| `SUDARVID_HTTP_FALLBACK_ENABLED` | Learn | Contract fallback switch. When `true`, premium start failures retry once with classic mode. Defaults to `false` (strict HTTP contract mode). |
| `REMOTION_SERVER_URL` | Studio, Intelligence | Remotion render server (e.g. `http://localhost:3040`). |

---

## Intelligence (Python) — summary

Same Supabase and AI provider keys as above. See `sudar-intelligence/.env.example`. Key vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `AI_CHAT_PROVIDER`, `TOGETHER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_CHAT_BASE_URL`, `AI_CHAT_API_KEY`, `AI_CHAT_DEFAULT_MODEL`, `PORT`, `ENV`.

Security hardening vars:

- `CORS_ORIGINS` (Intelligence): comma-separated browser origins allowed to call Intelligence (e.g. `http://localhost:3001,http://localhost:3000`). **Required in production:** if `ENV`/`ENVIRONMENT` is `production` and this is unset/empty, the Intelligence process exits at startup.
- `SUPABASE_JWT_SECRET` (Intelligence): validates Supabase JWTs from Learn/Studio.
- `INTELLIGENCE_SERVICE_SECRET` (Intelligence + Learn + Studio): optional shared secret used for ALP, Studio TTS server-to-server proxy calls, Sudar Agents **internal** Learn helpers (`POST /api/internal/agent-tools/*`), and similar paths via `X-Intelligence-Service-Secret`. **Must match** on Intelligence and Learn when those routes are enabled.
- `LEARN_INTERNAL_URL` (Intelligence): base URL of the **Sudar Learn** deployment (server-only). Used by the agents orchestrator when calling **`/api/internal/agent-tools/next-best-action`** so Intelligence reuses Learn’s canonical next-best-action implementation. Omit in local setups that do not wire agents → NBA tooling.

Sudar Agents org-level behaviour is stored in Postgres (`organisations.settings.sudar_agents`), not env vars — see **[docs/AGENTS_PLATFORM.md](AGENTS_PLATFORM.md)**.

---

## Compliance & optional

| Variable | App | Description |
|----------|-----|-------------|
| `CRON_SECRET` | Studio, Learn | Required secret for cron endpoints; cron routes fail closed when this is missing. |
| `RESEND_API_KEY` | Studio | [Resend](https://resend.com) — email for reminders. |
| `RESEND_FROM` | Studio | From address (e.g. `Sudar <onboarding@resend.dev>`). |
| `DOCUMENT_URL_HOST_ALLOWLIST` | Studio | Optional comma-separated host allowlist for document URL ingestion; local/private network targets are blocked even when unset. |
| `ENABLE_DANGEROUS_ADMIN_TOOLS` | Studio | Must be `true` before destructive local-only admin tools like purge-users are reachable. Leave unset in production. |
| `PURGE_KEEP_EMAIL` | Studio | Required keeper email when the dangerous purge-users tool is explicitly enabled. |
| `ENABLE_ANALYTICS_ENGINE` | Studio, Learn | Set `true` to enable analytics engine APIs; set `false` to disable analytics endpoints during staged rollout. |
| `LANGFUSE_*` | Studio | Optional observability (Langfuse). |

---

*This document is the canonical reference. Studio’s "AI & API Keys" page and in-app "How to get this key" steps are driven from the same provider list where possible.*
