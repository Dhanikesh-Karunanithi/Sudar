-- Course banner + org-scoped master tags (groups, tags, course assignments)

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS banner_url text;

-- ---------------------------------------------------------------------------
-- Tag groups (per organisation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tag_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tag_groups_org_id_idx ON public.tag_groups(org_id);

-- ---------------------------------------------------------------------------
-- Master tags (per organisation; optional group)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.tag_groups(id) ON DELETE SET NULL,
  slug text NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_tags_org_slug_unique UNIQUE (org_id, slug)
);

CREATE INDEX IF NOT EXISTS org_tags_org_id_idx ON public.org_tags(org_id);
CREATE INDEX IF NOT EXISTS org_tags_group_id_idx ON public.org_tags(group_id);

-- ---------------------------------------------------------------------------
-- Course ↔ org_tag (many-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_org_tags (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  org_tag_id uuid NOT NULL REFERENCES public.org_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, org_tag_id)
);

CREATE INDEX IF NOT EXISTS course_org_tags_org_tag_id_idx ON public.course_org_tags(org_tag_id);

-- ---------------------------------------------------------------------------
-- RLS: backend uses service role; block direct anon access
-- ---------------------------------------------------------------------------
ALTER TABLE public.tag_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_org_tags ENABLE ROW LEVEL SECURITY;

-- No policies: authenticated clients use Studio/Learn API with service role only.

COMMENT ON TABLE public.tag_groups IS 'Org-scoped tag categories for course master tags';
COMMENT ON TABLE public.org_tags IS 'Org-scoped master tags; courses.tags is denormalized from assignments';
COMMENT ON TABLE public.course_org_tags IS 'Course assignments to org_tags';
