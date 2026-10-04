-- Human review status + persisted quality assessment per module (content quality gate).
-- Existing modules default to 'approved' so already-published courses are not blocked retroactively;
-- newly AI-generated modules are written as 'draft' or 'needs_review' by the Studio pipeline.

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS quality jsonb,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'modules_review_status_check'
  ) THEN
    ALTER TABLE public.modules
      ADD CONSTRAINT modules_review_status_check
      CHECK (review_status IN ('draft', 'needs_review', 'approved'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS modules_course_review_status_idx
  ON public.modules (course_id, review_status);

COMMENT ON COLUMN public.modules.review_status IS 'draft | needs_review | approved — publish is blocked while any module has unresolved critical quality issues.';
COMMENT ON COLUMN public.modules.quality IS 'StoredModuleQuality (shared/content-generation/quality.ts): rubric scores, issues, gate attempts, moderation, citations.';
