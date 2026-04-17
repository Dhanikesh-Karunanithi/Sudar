-- Sudar Analytics Engine v1 rollups
-- Hybrid architecture: raw telemetry in learning_events, derived daily rollups for Studio/Learn APIs.

CREATE TABLE IF NOT EXISTS public.analytics_daily_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  active_learning_secs integer NOT NULL DEFAULT 0,
  idle_secs integer NOT NULL DEFAULT 0,
  total_secs integer NOT NULL DEFAULT 0,
  focus_ratio numeric(5,4) NOT NULL DEFAULT 0,
  sessions_count integer NOT NULL DEFAULT 0,
  modules_started integer NOT NULL DEFAULT 0,
  modules_completed integer NOT NULL DEFAULT 0,
  quiz_attempts integer NOT NULL DEFAULT 0,
  avg_quiz_score numeric(5,2),
  modality_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  engagement_score numeric(5,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id, event_date)
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_course (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  learners_active integer NOT NULL DEFAULT 0,
  active_learning_secs integer NOT NULL DEFAULT 0,
  idle_secs integer NOT NULL DEFAULT 0,
  total_secs integer NOT NULL DEFAULT 0,
  sessions_count integer NOT NULL DEFAULT 0,
  module_starts integer NOT NULL DEFAULT 0,
  module_completes integer NOT NULL DEFAULT 0,
  drop_off_count integer NOT NULL DEFAULT 0,
  quiz_attempts integer NOT NULL DEFAULT 0,
  avg_quiz_score numeric(5,2),
  engagement_score numeric(5,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, course_id, event_date)
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_module (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  learners_active integer NOT NULL DEFAULT 0,
  active_learning_secs integer NOT NULL DEFAULT 0,
  idle_secs integer NOT NULL DEFAULT 0,
  total_secs integer NOT NULL DEFAULT 0,
  module_completes integer NOT NULL DEFAULT 0,
  drop_off_count integer NOT NULL DEFAULT 0,
  avg_time_to_complete_secs integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, course_id, module_id, event_date)
);

CREATE TABLE IF NOT EXISTS public.analytics_org_rollup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  active_learners integer NOT NULL DEFAULT 0,
  active_learning_secs integer NOT NULL DEFAULT 0,
  idle_secs integer NOT NULL DEFAULT 0,
  total_secs integer NOT NULL DEFAULT 0,
  completion_count integer NOT NULL DEFAULT 0,
  drop_off_count integer NOT NULL DEFAULT 0,
  avg_engagement_score numeric(5,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, event_date)
);

CREATE TABLE IF NOT EXISTS public.analytics_risk_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  computed_at timestamptz NOT NULL DEFAULT now(),
  as_of_date date NOT NULL DEFAULT current_date,
  risk_score numeric(5,4) NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  focus_ratio_7d numeric(5,4),
  completion_velocity_7d numeric(8,4),
  drop_off_count_7d integer NOT NULL DEFAULT 0,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id, as_of_date)
);

CREATE TABLE IF NOT EXISTS public.analytics_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome text NOT NULL CHECK (outcome IN ('accepted', 'dismissed', 'later')),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_events_user_course_created_idx
  ON public.learning_events (user_id, course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learning_events_course_module_created_idx
  ON public.learning_events (course_id, module_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learning_events_type_created_idx
  ON public.learning_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_daily_user_org_date_idx
  ON public.analytics_daily_user (org_id, event_date DESC, user_id);
CREATE INDEX IF NOT EXISTS analytics_daily_course_org_date_idx
  ON public.analytics_daily_course (org_id, event_date DESC, course_id);
CREATE INDEX IF NOT EXISTS analytics_daily_module_org_date_idx
  ON public.analytics_daily_module (org_id, event_date DESC, course_id, module_id);
CREATE INDEX IF NOT EXISTS analytics_org_rollup_org_date_idx
  ON public.analytics_org_rollup (org_id, event_date DESC);
CREATE INDEX IF NOT EXISTS analytics_risk_signals_org_date_idx
  ON public.analytics_risk_signals (org_id, as_of_date DESC, risk_score DESC);

CREATE OR REPLACE FUNCTION public.refresh_analytics_rollups(p_date date DEFAULT current_date)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.analytics_daily_user WHERE event_date = p_date;
  DELETE FROM public.analytics_daily_course WHERE event_date = p_date;
  DELETE FROM public.analytics_daily_module WHERE event_date = p_date;
  DELETE FROM public.analytics_org_rollup WHERE event_date = p_date;

  INSERT INTO public.analytics_daily_user (
    org_id, user_id, event_date, active_learning_secs, idle_secs, total_secs,
    focus_ratio, sessions_count, modules_started, modules_completed, quiz_attempts,
    avg_quiz_score, modality_breakdown, engagement_score
  )
  SELECT
    c.org_id,
    le.user_id,
    p_date,
    SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::int AS active_learning_secs,
    GREATEST(SUM(COALESCE(le.duration_secs, 0)) - SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0)), 0)::int AS idle_secs,
    SUM(COALESCE(le.duration_secs, 0))::int AS total_secs,
    CASE
      WHEN SUM(COALESCE(le.duration_secs, 0)) > 0
      THEN ROUND((SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::numeric / SUM(COALESCE(le.duration_secs, 0))::numeric), 4)
      ELSE 0
    END AS focus_ratio,
    COUNT(*) FILTER (WHERE le.event_type = 'session_end')::int AS sessions_count,
    COUNT(*) FILTER (WHERE le.event_type = 'module_start')::int AS modules_started,
    COUNT(*) FILTER (WHERE le.event_type = 'module_complete')::int AS modules_completed,
    COUNT(*) FILTER (WHERE le.event_type = 'quiz_attempt')::int AS quiz_attempts,
    AVG(NULLIF((le.payload->>'score')::numeric, NULL)) FILTER (WHERE le.event_type = 'quiz_attempt') AS avg_quiz_score,
    jsonb_object_agg(COALESCE(le.modality, 'text'), modality_secs) AS modality_breakdown,
    LEAST(1, GREATEST(0,
      (
        (COUNT(*) FILTER (WHERE le.event_type = 'module_complete')::numeric / GREATEST(COUNT(*) FILTER (WHERE le.event_type = 'module_start'), 1)) * 0.45
        + CASE WHEN SUM(COALESCE(le.duration_secs, 0)) > 0
               THEN (SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::numeric / SUM(COALESCE(le.duration_secs, 0))::numeric) * 0.35
               ELSE 0 END
        + LEAST(COUNT(*) FILTER (WHERE le.event_type = 'quiz_attempt')::numeric / 4, 1) * 0.20
      )
    ))::numeric(5,4) AS engagement_score
  FROM public.learning_events le
  JOIN public.courses c ON c.id = le.course_id
  JOIN LATERAL (
    SELECT
      COALESCE(le.modality, 'text') AS modality_key,
      SUM(COALESCE(le.duration_secs, 0)) OVER (PARTITION BY le.user_id, COALESCE(le.modality, 'text'))::int AS modality_secs
  ) modal ON true
  WHERE (le.created_at AT TIME ZONE 'UTC')::date = p_date
    AND le.course_id IS NOT NULL
  GROUP BY c.org_id, le.user_id;

  INSERT INTO public.analytics_daily_course (
    org_id, course_id, event_date, learners_active, active_learning_secs, idle_secs,
    total_secs, sessions_count, module_starts, module_completes, drop_off_count,
    quiz_attempts, avg_quiz_score, engagement_score
  )
  SELECT
    c.org_id,
    le.course_id,
    p_date,
    COUNT(DISTINCT le.user_id)::int,
    SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::int,
    GREATEST(SUM(COALESCE(le.duration_secs, 0)) - SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0)), 0)::int,
    SUM(COALESCE(le.duration_secs, 0))::int,
    COUNT(*) FILTER (WHERE le.event_type = 'session_end')::int,
    COUNT(*) FILTER (WHERE le.event_type = 'module_start')::int,
    COUNT(*) FILTER (WHERE le.event_type = 'module_complete')::int,
    COUNT(*) FILTER (WHERE le.event_type = 'drop_off')::int,
    COUNT(*) FILTER (WHERE le.event_type = 'quiz_attempt')::int,
    AVG(NULLIF((le.payload->>'score')::numeric, NULL)) FILTER (WHERE le.event_type = 'quiz_attempt'),
    LEAST(1, GREATEST(0,
      (
        (COUNT(*) FILTER (WHERE le.event_type = 'module_complete')::numeric / GREATEST(COUNT(*) FILTER (WHERE le.event_type = 'module_start'), 1)) * 0.55
        + CASE WHEN SUM(COALESCE(le.duration_secs, 0)) > 0
               THEN (SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::numeric / SUM(COALESCE(le.duration_secs, 0))::numeric) * 0.45
               ELSE 0 END
      )
    ))::numeric(5,4)
  FROM public.learning_events le
  JOIN public.courses c ON c.id = le.course_id
  WHERE (le.created_at AT TIME ZONE 'UTC')::date = p_date
    AND le.course_id IS NOT NULL
  GROUP BY c.org_id, le.course_id;

  INSERT INTO public.analytics_daily_module (
    org_id, course_id, module_id, event_date, learners_active, active_learning_secs,
    idle_secs, total_secs, module_completes, drop_off_count, avg_time_to_complete_secs
  )
  SELECT
    c.org_id,
    le.course_id,
    le.module_id,
    p_date,
    COUNT(DISTINCT le.user_id)::int,
    SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::int,
    GREATEST(SUM(COALESCE(le.duration_secs, 0)) - SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0)), 0)::int,
    SUM(COALESCE(le.duration_secs, 0))::int,
    COUNT(*) FILTER (WHERE le.event_type = 'module_complete')::int,
    COUNT(*) FILTER (WHERE le.event_type = 'drop_off')::int,
    AVG(COALESCE((le.payload->>'active_secs')::int, le.duration_secs)) FILTER (WHERE le.event_type = 'module_complete')::int
  FROM public.learning_events le
  JOIN public.courses c ON c.id = le.course_id
  WHERE (le.created_at AT TIME ZONE 'UTC')::date = p_date
    AND le.course_id IS NOT NULL
    AND le.module_id IS NOT NULL
  GROUP BY c.org_id, le.course_id, le.module_id;

  INSERT INTO public.analytics_org_rollup (
    org_id, event_date, active_learners, active_learning_secs, idle_secs, total_secs,
    completion_count, drop_off_count, avg_engagement_score
  )
  SELECT
    adu.org_id,
    p_date,
    COUNT(DISTINCT adu.user_id)::int,
    SUM(adu.active_learning_secs)::int,
    SUM(adu.idle_secs)::int,
    SUM(adu.total_secs)::int,
    SUM(adu.modules_completed)::int,
    (
      SELECT COALESCE(SUM(adc.drop_off_count), 0)::int
      FROM public.analytics_daily_course adc
      WHERE adc.org_id = adu.org_id AND adc.event_date = p_date
    ) AS drop_off_count,
    AVG(adu.engagement_score)::numeric(5,4)
  FROM public.analytics_daily_user adu
  WHERE adu.event_date = p_date
  GROUP BY adu.org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_analytics_risk_signals(p_date date DEFAULT current_date)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.analytics_risk_signals WHERE as_of_date = p_date;

  INSERT INTO public.analytics_risk_signals (
    org_id, user_id, as_of_date, risk_score, risk_level, reasons,
    focus_ratio_7d, completion_velocity_7d, drop_off_count_7d, last_active_at
  )
  SELECT
    c.org_id,
    le.user_id,
    p_date,
    LEAST(1, GREATEST(0,
      (CASE WHEN SUM(CASE WHEN le.event_type = 'drop_off' THEN 1 ELSE 0 END) > 2 THEN 0.35 ELSE 0 END)
      + (CASE WHEN SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::numeric
                    / GREATEST(SUM(COALESCE(le.duration_secs, 0))::numeric, 1) < 0.55 THEN 0.35 ELSE 0 END)
      + (CASE WHEN SUM(CASE WHEN le.event_type = 'module_complete' THEN 1 ELSE 0 END) = 0 THEN 0.30 ELSE 0 END)
    ))::numeric(5,4) AS risk_score,
    CASE
      WHEN LEAST(1, GREATEST(0,
        (CASE WHEN SUM(CASE WHEN le.event_type = 'drop_off' THEN 1 ELSE 0 END) > 2 THEN 0.35 ELSE 0 END)
        + (CASE WHEN SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::numeric
                      / GREATEST(SUM(COALESCE(le.duration_secs, 0))::numeric, 1) < 0.55 THEN 0.35 ELSE 0 END)
        + (CASE WHEN SUM(CASE WHEN le.event_type = 'module_complete' THEN 1 ELSE 0 END) = 0 THEN 0.30 ELSE 0 END)
      )) >= 0.75 THEN 'high'
      WHEN LEAST(1, GREATEST(0,
        (CASE WHEN SUM(CASE WHEN le.event_type = 'drop_off' THEN 1 ELSE 0 END) > 2 THEN 0.35 ELSE 0 END)
        + (CASE WHEN SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::numeric
                      / GREATEST(SUM(COALESCE(le.duration_secs, 0))::numeric, 1) < 0.55 THEN 0.35 ELSE 0 END)
        + (CASE WHEN SUM(CASE WHEN le.event_type = 'module_complete' THEN 1 ELSE 0 END) = 0 THEN 0.30 ELSE 0 END)
      )) >= 0.45 THEN 'medium'
      ELSE 'low'
    END AS risk_level,
    jsonb_build_array(
      CASE WHEN SUM(CASE WHEN le.event_type = 'drop_off' THEN 1 ELSE 0 END) > 2 THEN 'high_drop_off' END,
      CASE WHEN SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::numeric
                / GREATEST(SUM(COALESCE(le.duration_secs, 0))::numeric, 1) < 0.55 THEN 'low_focus_ratio' END,
      CASE WHEN SUM(CASE WHEN le.event_type = 'module_complete' THEN 1 ELSE 0 END) = 0 THEN 'no_recent_completions' END
    ) - NULL,
    ROUND((
      SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::numeric
      / GREATEST(SUM(COALESCE(le.duration_secs, 0))::numeric, 1)
    ), 4)::numeric(5,4) AS focus_ratio_7d,
    ROUND((SUM(CASE WHEN le.event_type = 'module_complete' THEN 1 ELSE 0 END)::numeric / 7), 4)::numeric(8,4),
    SUM(CASE WHEN le.event_type = 'drop_off' THEN 1 ELSE 0 END)::int,
    MAX(le.created_at)
  FROM public.learning_events le
  JOIN public.courses c ON c.id = le.course_id
  WHERE (le.created_at AT TIME ZONE 'UTC')::date BETWEEN (p_date - interval '6 days')::date AND p_date
    AND le.course_id IS NOT NULL
  GROUP BY c.org_id, le.user_id;
END;
$$;
