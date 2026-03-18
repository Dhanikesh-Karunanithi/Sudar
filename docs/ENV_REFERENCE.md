# Sudar — Environment Variables Reference

This is the single source of truth for all environment variables used across Sudar Studio, Sudar Learn, and Sudar Intelligence. The in-app **AI & API Keys** page (Studio → Settings → AI & API Keys) shows key status and "How to get this key" steps; the list is driven by `byteos-studio/src/lib/ai/providerConfig.ts`. **Keep in sync:** when adding a new provider or env var, update both this file and `providerConfig.ts` so the Keys page and this reference stay aligned.

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
| `BYTEOS_INTELLIGENCE_URL` | Studio, Learn | Sudar Intelligence API base URL (e.g. `http://localhost:8000`). |

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
| `AI_CHAT_BASE_URL` | Studio, Learn | For custom/local models (e.g. local LLM server). OpenAI-compatible `/v1/chat/completions` endpoint base. | — |
| `AI_CHAT_DEFAULT_MODEL` | Studio, Learn | Override default model (e.g. `openai/gpt-4o`, `anthropic/claude-3-5-sonnet`). Provider-specific. | — |

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
| `SARVAM_API_KEY` | Intelligence | [Sarvam AI](https://sarvam.ai/) — Indian English voices. Optional. | Sarvam AI console |
| `BYTEOS_INTELLIGENCE_URL` | Studio | When set, Studio can proxy TTS through Intelligence (Edge-TTS or Sarvam). | — |

---

## Media search (optional — Studio course editor)

| Variable | App | Description | Get key |
|----------|-----|-------------|---------|
| `GOOGLE_SEARCH_API_KEY` | Studio | Google Custom Search (images + web for research). | [Google Cloud Console](https://console.cloud.google.com/) → APIs → Custom Search API |
| `GOOGLE_SEARCH_ENGINE_ID` | Studio | Custom Search Engine ID (create at [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)). | Same |
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
| `ALP_EMBED_SECRET` | Learn | Signing secret for embed tokens. Defaults to ALP_API_KEY if not set. | — |
| `NEXT_PUBLIC_APP_URL` | Learn | Public URL of Learn app (certificates, embed). | — |

---

## Video & microservices

| Variable | App | Description |
|----------|-----|-------------|
| `REMOTION_SERVER_URL` | Studio, Intelligence | Remotion render server (e.g. `http://localhost:3040`). |
| `BYTEOS_VIDEO_SERVICE_URL` | Studio, Intelligence | Video generation microservice (e.g. `http://localhost:5001`). |

---

## Intelligence (Python) — summary

Same Supabase and AI provider keys as above. See `byteos-intelligence/.env.example`. Key vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `TOGETHER_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_CHAT_PROVIDER` (when implemented), `PORT`, `ENV`.\n+\n+Security hardening vars:\n+- `SUPABASE_JWT_SECRET` (Intelligence): validates Supabase JWTs from Learn/Studio.\n+- `INTELLIGENCE_SERVICE_SECRET` (Intelligence + Learn): optional shared secret used for ALP server-to-server proxy calls via `X-Intelligence-Service-Secret`.\n*** End Patch}

---

## Compliance & optional

| Variable | App | Description |
|----------|-----|-------------|
| `CRON_SECRET` | Studio | Secret for cron endpoints (e.g. compliance reminders). |
| `RESEND_API_KEY` | Studio | [Resend](https://resend.com) — email for reminders. |
| `RESEND_FROM` | Studio | From address (e.g. `Sudar <onboarding@resend.dev>`). |
| `LANGFUSE_*` | Studio | Optional observability (Langfuse). |

---

*This document is the canonical reference. Studio’s "AI & API Keys" page and in-app "How to get this key" steps are driven from the same provider list where possible.*
