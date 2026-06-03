# Knowledge bases — setup and operations

Org-scoped **knowledge bases** let Sudar index uploaded documents (PDF, DOCX, PPTX, images, audio, and more) for **RAG** in the AI tutor. Conversion uses **[MarkItDown](MARKITDOWN_INTEGRATION.md)** on Sudar Intelligence; chunking and embeddings run in **Sudar Learn**.

---

## Prerequisites

1. Apply migration `supabase/migrations/20260603000000_knowledge_bases.sql` (also in `sudar-learn/supabase/migrations/`).
2. RAG embeddings configured in Learn (`TOGETHER_API_KEY` or `EMBED_PROVIDER=huggingface`, etc.) — see [sudar-learn/docs/RAG_SETUP_STEPS.md](../sudar-learn/docs/RAG_SETUP_STEPS.md).
3. **Sudar Intelligence** running with `markitdown[all]` installed and reachable from Learn (`SUDAR_INTELLIGENCE_URL`, `INTELLIGENCE_SERVICE_SECRET`).
4. **Vercel cron** (or manual trigger): `POST /api/cron/process-kb-uploads` with `CRON_SECRET` — scheduled every 10 minutes in `sudar-learn/vercel.json`.

---

## Studio (admins / creators)

1. Open **Settings → Knowledge bases** (`/settings/knowledge-bases`).
2. **Create** a knowledge base (org-wide, subject, or course-scoped).
3. **Upload** a document — it is stored in Supabase Storage (`course-media` bucket, path `{orgId}/kb/{kbId}/…`) and queued in `kb_ingest_queue`.
4. Poll status until `completed` (UI polls `/api/kb/queue-status`). Failed jobs can be **retried** via `POST /api/kb/retry`.

---

## Learn (learners, when enabled)

Set in org `organisations.settings`:

```json
{
  "knowledge_bases": {
    "allow_learner_uploads": true
  }
}
```

Learners use **Settings → Knowledge** (`/settings/knowledge`) with the same queue + cron pipeline.

---

## Tutor RAG

When a learner asks Sudar (in or out of a course), Learn resolves KB ids for the org (`resolveOrgKbIdsForRag`) and retrieves chunks with `chunk_type: 'kb'` via `match_content_chunks` (`filter_kb_ids`). Course chunks and KB chunks are both injected into the tutor prompt.

---

## APIs

| Surface | Route | Purpose |
|---------|-------|---------|
| Studio | `GET/POST /api/kb` | List / create knowledge bases |
| Studio | `POST /api/kb/upload` | Queue file for ingest |
| Studio | `GET /api/kb/queue-status` | Job progress |
| Studio | `POST /api/kb/retry` | Re-queue failed job |
| Learn | `GET/POST /api/knowledge-base` | List / create (learner when allowed) |
| Learn | `POST /api/knowledge-base/upload` | Queue upload |
| Learn | `GET /api/knowledge-base/queue-status` | Job progress |
| Learn | `POST /api/cron/process-kb-uploads` | Worker (cron) |
| Intelligence | `POST /api/kb/convert-markdown` | MarkItDown conversion |

---

## Env (optional)

| Variable | App | Description |
|----------|-----|-------------|
| `KB_PROCESSING_MAX_CONCURRENCY` | Learn | Max pending jobs per cron run (default `5`) |
| `MARKITDOWN_ENABLE_PLUGINS` | Intelligence | Enable MarkItDown plugins (`true`/`false`) |
| `MARKITDOWN_LLM_MODEL` | Intelligence | Model for optional OCR / image description |

See [ENV_REFERENCE.md](ENV_REFERENCE.md).
