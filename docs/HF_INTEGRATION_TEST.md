# Hugging Face integration — test checklist (~15 min)

Use this after deploying the Sudar × Hugging Face upgrade (multilingual RAG, Intelligence HF providers).

## 1. Environment

**Sudar Learn** (`sudar-learn/.env.local`):

```env
HUGGINGFACE_API_KEY=hf_...
EMBED_PROVIDER=huggingface
HF_EMBED_MODEL=BAAI/bge-m3
RAG_RERANK_ENABLED=true
HF_RERANK_MODEL=BAAI/bge-reranker-v2-m3
```

**Sudar Intelligence** (`sudar-intelligence/.env.local`):

```env
HUGGINGFACE_API_KEY=hf_...
AI_CHAT_PROVIDER=huggingface
HF_CHAT_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct
IMAGE_PROVIDER=huggingface
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
```

Optional self-hosted TEI/vLLM (both apps):

```env
HF_INFERENCE_BASE_URL=http://localhost:8080
```

## 2. Database

Apply [`sudar-learn/supabase/migrations/20260101000000_content_chunks_rag.sql`](../sudar-learn/supabase/migrations/20260101000000_content_chunks_rag.sql) if not already applied (pgvector 1024).

## 3. Smoke scripts (repo root)

```bash
node scripts/hf/embed-smoke.mjs
node scripts/hf/rerank-smoke.mjs
node scripts/hf/multilingual-rag-eval.mjs
node scripts/hf/rag-retrieval-smoke.mjs "security training"
```

## 4. Ingest one course

1. Start Learn: `cd sudar-learn && npm run dev`
2. Sign in as admin/creator with a **published** course that has module body text.
3. `POST /api/rag/ingest` with JSON `{ "course_id": "<uuid>" }` (session cookie or API client).
4. Confirm response includes `module_chunks` > 0.

## 5. Tutor — catalog (floating Sudar)

1. Open dashboard (no course open).
2. Ask: “Do you have courses about [topic matching your catalog]?”
3. Expect relevant course recommendations (RAG + catalog).

## 6. Tutor — in-course (vector excerpts)

1. Open a published course in Learn.
2. Ask a question in **French** (or your course language) about module content.
3. Sudar should use **Relevant course excerpts** from vector retrieval (see server logs / improved answers vs pre-ingest).

## 7. Intelligence HF chat

```bash
curl http://localhost:8001/api/health/hf-chat
```

Expect `{ "ok": true, "preview": "..." }` when `AI_CHAT_PROVIDER=huggingface`.

## 8. Studio course cover (HF image)

1. Set Intelligence `IMAGE_PROVIDER=huggingface`.
2. In Studio, create or edit a course with AI cover generation enabled.
3. Confirm cover image is returned (may take 30–90s on cold start).

## 9. Re-ingest after model change

Whenever you change `HF_EMBED_MODEL` or `EMBED_PROVIDER`, re-run ingest for all published courses:

```bash
POST /api/rag/ingest
# body: {}  → all published courses
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Empty embeddings | Check `HUGGINGFACE_API_KEY`; run `embed-smoke.mjs` |
| RPC / no chunks | Apply migration; run ingest |
| Rerank skipped | Set `RAG_RERANK_ENABLED=true` |
| HF chat 503 | `AI_CHAT_PROVIDER=huggingface` + key on Intelligence |
| Image 502 | Try `IMAGE_PROVIDER=together` as fallback; verify model id on HF |

See also [sudar-learn/docs/RAG_SETUP_STEPS.md](../sudar-learn/docs/RAG_SETUP_STEPS.md) and [ENV_REFERENCE.md](ENV_REFERENCE.md).
