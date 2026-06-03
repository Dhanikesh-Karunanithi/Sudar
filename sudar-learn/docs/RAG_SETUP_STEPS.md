# RAG + Sudar setup — full steps

RAG powers catalog search (floating Sudar) and **in-course vector excerpts** for the tutor. Embeddings support **Together**, **OpenAI**, or **Hugging Face** (recommended for multilingual: `BAAI/bge-m3`).

---

## 1. Environment (sudar-learn)

In `sudar-learn/.env.local` set one embedding provider:

```env
# Option A — Together (default if key present)
TOGETHER_API_KEY=your_together_api_key_here

# Option B — Hugging Face (multilingual RAG)
# HUGGINGFACE_API_KEY=hf_...
# EMBED_PROVIDER=huggingface
# HF_EMBED_MODEL=BAAI/bge-m3
# RAG_RERANK_ENABLED=true
# HF_RERANK_MODEL=BAAI/bge-reranker-v2-m3

# Option C — OpenAI embeddings
# OPENAI_API_KEY=...
# EMBED_PROVIDER=openai

# Optional: self-hosted TEI/vLLM (OpenAI-compatible)
# HF_INFERENCE_BASE_URL=http://localhost:8080

# Optional: tutor / memory models (defaults in code)
# TOGETHER_TUTOR_MODEL=...
# TOGETHER_MEMORY_MODEL=...
```

- **RAG + tutor chat**: at least one chat key (`TOGETHER_API_KEY`, etc.) plus an embedding provider.
- **HF multilingual**: `EMBED_PROVIDER=huggingface` + `HF_EMBED_MODEL=BAAI/bge-m3` (1024 dims, matches pgvector).
- **After changing embed model**: re-run ingest for all published courses (vectors are not interchangeable).

---

## 2. Database (Supabase): pgvector + content_chunks

Apply the RAG migration so the `content_chunks` table and `match_content_chunks` RPC exist with **1024-dimensional** vectors (Together BGE large / OpenAI with dimensions=1024).

**Option A — Supabase Dashboard**

1. Open your project → **SQL Editor**.
2. Run the contents of `sudar-learn/supabase/migrations/20260101000000_content_chunks_rag.sql`.
3. Ensure the extension is enabled: `create extension if not exists vector with schema extensions;` (included in the migration).

**Option B — Supabase CLI**

From repo root (or `sudar-learn` if your config is there):

```bash
supabase db push
```

(or link the project and run the migration as per your Supabase workflow).

**If you previously had 1536-dimensional vectors (old OpenAI-only setup)**  
Drop and recreate the table/function with 1024, then re-ingest (see “Optional: migrating from 1536” below).

---

## 3. RAG ingest (index courses)

After the migration, index published courses so Sudar can search them:

**From the app (authenticated)**

- POST to your Learn app’s ingest API with an empty body to index all published courses, or with a single course:

```bash
# All published courses (replace origin with your Learn app URL)
curl -X POST "http://localhost:3001/api/rag/ingest" \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-auth-cookie>" \
  -d '{}'

# Single course
curl -X POST "http://localhost:3001/api/rag/ingest" \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-auth-cookie>" \
  -d '{"course_id":"<course-uuid>"}'
```

Or call the same endpoint from your frontend (e.g. after publishing a course) with the user’s session.

**Notes**

- Ingest uses the same embedding provider as the rest of the app (default: Together).
- If ingest returns “Embedding failed”, check `TOGETHER_API_KEY` (or `OPENAI_API_KEY` and `EMBED_PROVIDER=openai`).

---

## 4. Verify Sudar + RAG

1. Start Learn: `npm run dev` in `sudar-learn` (e.g. port 3001).
2. Log in and open the dashboard.
3. Open Sudar (floating chat) and ask something about courses (e.g. “What courses do you have?” / “What do you recommend?”).
4. Answers should use RAG when not in a course (catalog + your enrollments) and can return course cards with **Enroll / Continue / Review**.
5. From a course, ask course-specific questions; RAG for catalog is not used there.

---

## 5. Workflows (paste + summarize / extract)

- In Sudar, paste text and ask to “Summarize this” or “Extract key terms”.
- The app calls the workflow API (Together) and can show a workflow block and summary/terms.
- No extra env vars beyond `TOGETHER_API_KEY`.

---

## Optional: migrating from 1536 (old OpenAI-only RAG)

If you already ran the old RAG migration with **1536**-dimensional vectors, switch to **1024** and re-ingest:

1. In Supabase SQL Editor run:

```sql
drop index if exists public.content_chunks_embedding_idx;
drop table if exists public.content_chunks;

create table public.content_chunks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  chunk_index int not null default 0,
  chunk_type text not null default 'course',
  content text not null,
  embedding extensions.vector(1024),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index content_chunks_course_id_idx on public.content_chunks(course_id);
create index content_chunks_chunk_type_idx on public.content_chunks(chunk_type);
create index content_chunks_embedding_idx on public.content_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function public.match_content_chunks(
  query_embedding extensions.vector(1024),
  match_count int default 10,
  filter_course_id uuid default null,
  filter_chunk_type text default null
)
returns table (
  id uuid, course_id uuid, module_id uuid, chunk_index int, chunk_type text,
  content text, metadata jsonb, similarity float
)
language plpgsql as $$
begin
  return query
  select c.id, c.course_id, c.module_id, c.chunk_index, c.chunk_type, c.content, c.metadata,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.content_chunks c
  where (filter_course_id is null or c.course_id = filter_course_id)
    and (filter_chunk_type is null or c.chunk_type = filter_chunk_type)
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

2. Set `TOGETHER_API_KEY` (and optionally `EMBED_PROVIDER=together`) in `sudar-learn/.env.local`.
3. Run RAG ingest again (step 3 above).

---

## Summary checklist

| Step | Action |
|------|--------|
| 1 | Set `TOGETHER_API_KEY` in `sudar-learn/.env.local` (and optionally `EMBED_PROVIDER`, `OPENAI_API_KEY`) |
| 2 | Run RAG migration (pgvector + `content_chunks` 1024, `match_content_chunks`) in Supabase |
| 3 | POST `/api/rag/ingest` to index published courses |
| 4 | Use Sudar from dashboard/course and confirm course answers and actions |
| 5 | (Optional) Use paste + “Summarize” / “Extract key terms” for workflows |

Embeddings are **Together by default**; you can switch to OpenAI per deployment with `EMBED_PROVIDER=openai` and `OPENAI_API_KEY` for future per-user/provider options.
