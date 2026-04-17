-- Enable pgvector extension (run in Supabase SQL Editor if not already enabled)
create extension if not exists vector with schema extensions;

-- Content chunks for RAG (course-level and optionally module-level)
-- Embedding dimension 1024: Together BAAI/bge-large-en-v1.5 (default); OpenAI text-embedding-3-small with dimensions=1024
create table if not exists public.content_chunks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  chunk_index int not null default 0,
  chunk_type text not null default 'course', -- 'course' | 'module'
  content text not null,
  embedding extensions.vector(1024),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists content_chunks_course_id_idx on public.content_chunks(course_id);
create index if not exists content_chunks_chunk_type_idx on public.content_chunks(chunk_type);
create index if not exists content_chunks_embedding_idx on public.content_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RPC for similarity search (used by Learn API)
create or replace function public.match_content_chunks(
  query_embedding extensions.vector(1024),
  match_count int default 10,
  filter_course_id uuid default null,
  filter_chunk_type text default null
)
returns table (
  id uuid,
  course_id uuid,
  module_id uuid,
  chunk_index int,
  chunk_type text,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.course_id,
    c.module_id,
    c.chunk_index,
    c.chunk_type,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.content_chunks c
  where (filter_course_id is null or c.course_id = filter_course_id)
    and (filter_chunk_type is null or c.chunk_type = filter_chunk_type)
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;
