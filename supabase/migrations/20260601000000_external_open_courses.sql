-- External open courses (Discover): link-out and embed support on courses table

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_external boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_provider text,
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS embed_url text;

COMMENT ON COLUMN public.courses.is_external IS 'When true, content is hosted on an external provider; Learn uses ExternalCourseViewer.';
COMMENT ON COLUMN public.courses.external_provider IS 'youtube | khan_academy | mit_ocw | custom';
COMMENT ON COLUMN public.courses.external_url IS 'Canonical URL to open on the provider site.';
COMMENT ON COLUMN public.courses.embed_url IS 'Optional iframe embed URL (e.g. YouTube playlist embed).';

CREATE INDEX IF NOT EXISTS courses_is_external_idx ON public.courses (is_external) WHERE is_external = true;

-- Seed global discover courses when at least one org and profile exist (idempotent by fixed UUIDs)
DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_course_id uuid;
  v_module_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM public.organisations ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO v_user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;

  IF v_org_id IS NULL OR v_user_id IS NULL THEN
    RAISE NOTICE 'external_open_courses: skip seed — no organisation or profile yet';
    RETURN;
  END IF;

  -- 1. CS50 (YouTube playlist — embed + link)
  v_course_id := 'a1000001-0001-4001-8001-000000000001'::uuid;
  INSERT INTO public.courses (
    id, org_id, created_by, title, description, status, difficulty,
    estimated_duration_mins, tags, is_external, external_provider, external_url, embed_url,
    published_at, is_adaptive, created_at, updated_at
  ) VALUES (
    v_course_id,
    v_org_id,
    v_user_id,
    'Introduction to Computer Science (CS50)',
    'Harvard CS50 full lecture series on YouTube. A rigorous introduction to computer science and programming.',
    'published',
    'beginner',
    1800,
    ARRAY['computer-science', 'programming', 'cs50', 'open-course'],
    true,
    'youtube',
    'https://www.youtube.com/playlist?list=PLhQjrBD40T2Hg_BzE89uBFX9viZnn7dV',
    'https://www.youtube.com/embed/videoseries?list=PLhQjrBD40T2Hg_BzE89uBFX9viZnn7dV',
    now(),
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    is_external = true,
    external_provider = EXCLUDED.external_provider,
    external_url = EXCLUDED.external_url,
    embed_url = EXCLUDED.embed_url,
    status = 'published',
    published_at = COALESCE(public.courses.published_at, EXCLUDED.published_at),
    updated_at = now();

  v_module_id := 'b1000001-0001-4001-8001-000000000001'::uuid;
  INSERT INTO public.modules (id, course_id, title, content, order_index)
  VALUES (
    v_module_id,
    v_course_id,
    'CS50 lecture playlist',
    '{"blocks":[{"type":"paragraph","text":"Watch the playlist on YouTube or mark complete when finished."}]}'::jsonb,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Khan Academy — Algorithms
  v_course_id := 'a1000001-0001-4001-8001-000000000002'::uuid;
  INSERT INTO public.courses (
    id, org_id, created_by, title, description, status, difficulty,
    estimated_duration_mins, tags, is_external, external_provider, external_url,
    published_at, is_adaptive, created_at, updated_at
  ) VALUES (
    v_course_id,
    v_org_id,
    v_user_id,
    'Algorithms & Data Structures',
    'Khan Academy computer science: algorithms, complexity, and core data structures. Free and self-paced.',
    'published',
    'intermediate',
    600,
    ARRAY['algorithms', 'data-structures', 'computer-science', 'open-course'],
    true,
    'khan_academy',
    'https://www.khanacademy.org/computing/computer-science/algorithms',
    now(),
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    is_external = true,
    external_provider = EXCLUDED.external_provider,
    external_url = EXCLUDED.external_url,
    status = 'published',
    updated_at = now();

  v_module_id := 'b1000001-0001-4001-8001-000000000002'::uuid;
  INSERT INTO public.modules (id, course_id, title, content, order_index)
  VALUES (
    v_module_id,
    v_course_id,
    'Algorithms on Khan Academy',
    '{"blocks":[{"type":"paragraph","text":"Study on Khan Academy, then mark complete in Sudar."}]}'::jsonb,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  -- 3. MIT OCW — 6.006
  v_course_id := 'a1000001-0001-4001-8001-000000000003'::uuid;
  INSERT INTO public.courses (
    id, org_id, created_by, title, description, status, difficulty,
    estimated_duration_mins, tags, is_external, external_provider, external_url,
    published_at, is_adaptive, created_at, updated_at
  ) VALUES (
    v_course_id,
    v_org_id,
    v_user_id,
    'Introduction to Algorithms (MIT 6.006)',
    'MIT OpenCourseWare: rigorous treatment of algorithms with lecture notes, assignments, and exams.',
    'published',
    'advanced',
    1200,
    ARRAY['algorithms', 'mit', 'open-course', 'mathematics'],
    true,
    'mit_ocw',
    'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
    now(),
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    is_external = true,
    external_provider = EXCLUDED.external_provider,
    external_url = EXCLUDED.external_url,
    status = 'published',
    updated_at = now();

  v_module_id := 'b1000001-0001-4001-8001-000000000003'::uuid;
  INSERT INTO public.modules (id, course_id, title, content, order_index)
  VALUES (
    v_module_id,
    v_course_id,
    'MIT OCW 6.006 materials',
    '{"blocks":[{"type":"paragraph","text":"Work through MIT OCW materials, then mark complete in Sudar."}]}'::jsonb,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  -- 4. Python for Everybody (PY4E)
  v_course_id := 'a1000001-0001-4001-8001-000000000004'::uuid;
  INSERT INTO public.courses (
    id, org_id, created_by, title, description, status, difficulty,
    estimated_duration_mins, tags, is_external, external_provider, external_url,
    published_at, is_adaptive, created_at, updated_at
  ) VALUES (
    v_course_id,
    v_org_id,
    v_user_id,
    'Python for Everybody (PY4E)',
    'Dr. Chuck''s popular free Python course — from basics through data handling and web services.',
    'published',
    'beginner',
    900,
    ARRAY['python', 'programming', 'open-course'],
    true,
    'custom',
    'https://www.py4e.com/',
    now(),
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    is_external = true,
    external_provider = EXCLUDED.external_provider,
    external_url = EXCLUDED.external_url,
    status = 'published',
    updated_at = now();

  v_module_id := 'b1000001-0001-4001-8001-000000000004'::uuid;
  INSERT INTO public.modules (id, course_id, title, content, order_index)
  VALUES (
    v_module_id,
    v_course_id,
    'PY4E course track',
    '{"blocks":[{"type":"paragraph","text":"Complete lessons on py4e.com, then mark complete in Sudar."}]}'::jsonb,
    0
  )
  ON CONFLICT (id) DO NOTHING;
END $$;
