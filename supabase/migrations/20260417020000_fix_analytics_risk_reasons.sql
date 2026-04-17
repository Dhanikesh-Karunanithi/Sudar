-- Fix analytics_risk_signals.reasons NOT NULL violations during refresh.
-- Ensure we always persist a non-null JSON array of reason codes.

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
    COALESCE(
      to_jsonb(
        array_remove(
          ARRAY[
            CASE WHEN SUM(CASE WHEN le.event_type = 'drop_off' THEN 1 ELSE 0 END) > 2 THEN 'high_drop_off' END,
            CASE WHEN SUM(COALESCE((le.payload->>'active_secs')::int, le.duration_secs, 0))::numeric
                      / GREATEST(SUM(COALESCE(le.duration_secs, 0))::numeric, 1) < 0.55 THEN 'low_focus_ratio' END,
            CASE WHEN SUM(CASE WHEN le.event_type = 'module_complete' THEN 1 ELSE 0 END) = 0 THEN 'no_recent_completions' END
          ]::text[],
          NULL
        )
      ),
      '[]'::jsonb
    ) AS reasons,
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
