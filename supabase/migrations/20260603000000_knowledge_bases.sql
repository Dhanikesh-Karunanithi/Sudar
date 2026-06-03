-- Knowledge bases: org-scoped document collections for RAG (MarkItDown ingest pipeline).

CREATE TABLE IF NOT EXISTS public.knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  scope text NOT NULL DEFAULT 'org' CHECK (scope IN ('org', 'subject', 'course')),
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_bases_org_id_idx ON public.knowledge_bases (org_id);
CREATE INDEX IF NOT EXISTS knowledge_bases_org_scope_idx ON public.knowledge_bases (org_id, scope);
CREATE INDEX IF NOT EXISTS knowledge_bases_course_id_idx ON public.knowledge_bases (course_id) WHERE course_id IS NOT NULL;

COMMENT ON TABLE public.knowledge_bases IS 'Org knowledge bases for document RAG (sales, handbook, subject libraries).';

CREATE TABLE IF NOT EXISTS public.kb_ingest_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id uuid NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_filename text NOT NULL,
  file_storage_path text NOT NULL,
  file_size_bytes bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL DEFAULT 'pdf',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress_pct int NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  converted_markdown_preview text,
  chunk_count int,
  error_message text,
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kb_ingest_queue_status_created_idx
  ON public.kb_ingest_queue (status, created_at);
CREATE INDEX IF NOT EXISTS kb_ingest_queue_kb_status_idx
  ON public.kb_ingest_queue (kb_id, status);

COMMENT ON TABLE public.kb_ingest_queue IS 'Async MarkItDown → chunk → embed jobs for knowledge base uploads.';

-- Extend content_chunks for KB-linked vectors
ALTER TABLE public.content_chunks
  ADD COLUMN IF NOT EXISTS kb_id uuid REFERENCES public.knowledge_bases(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS content_chunks_kb_id_idx ON public.content_chunks (kb_id) WHERE kb_id IS NOT NULL;

-- Similarity search with optional KB filter
CREATE OR REPLACE FUNCTION public.match_content_chunks(
  query_embedding extensions.vector(1024),
  match_count int DEFAULT 10,
  filter_course_id uuid DEFAULT NULL,
  filter_chunk_type text DEFAULT NULL,
  filter_kb_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  course_id uuid,
  module_id uuid,
  chunk_index int,
  chunk_type text,
  content text,
  metadata jsonb,
  kb_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.course_id,
    c.module_id,
    c.chunk_index,
    c.chunk_type,
    c.content,
    c.metadata,
    c.kb_id,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.content_chunks c
  WHERE (filter_course_id IS NULL OR c.course_id = filter_course_id)
    AND (filter_chunk_type IS NULL OR c.chunk_type = filter_chunk_type)
    AND (filter_kb_ids IS NULL OR c.kb_id = ANY(filter_kb_ids))
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_ingest_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_bases_org_member_select
  ON public.knowledge_bases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = knowledge_bases.org_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY knowledge_bases_org_admin_insert
  ON public.knowledge_bases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = knowledge_bases.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('ADMIN', 'MANAGER', 'CREATOR')
    )
  );

CREATE POLICY knowledge_bases_org_admin_update
  ON public.knowledge_bases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = knowledge_bases.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('ADMIN', 'MANAGER', 'CREATOR')
    )
  );

CREATE POLICY knowledge_bases_org_admin_delete
  ON public.knowledge_bases
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = knowledge_bases.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('ADMIN', 'MANAGER')
    )
  );

CREATE POLICY kb_ingest_queue_org_member_select
  ON public.kb_ingest_queue
  FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = kb_ingest_queue.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('ADMIN', 'MANAGER', 'CREATOR')
    )
  );

CREATE POLICY kb_ingest_queue_org_editor_insert
  ON public.kb_ingest_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.org_id = kb_ingest_queue.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('ADMIN', 'MANAGER', 'CREATOR', 'LEARNER')
    )
  );
