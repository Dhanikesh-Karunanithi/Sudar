-- Security advisor (2026-09-29): SECURITY DEFINER RPCs were executable by anon/authenticated.
-- increment_usage_* let any caller burn another user's daily AI quota; rollup refreshes are
-- cron-only. All app callers use the service-role client, so JWT roles lose EXECUTE.
-- handle_new_user / rls_auto_enable are trigger functions; triggers don't need caller EXECUTE.

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'increment_usage_request_count',
        'increment_usage_token_count',
        'refresh_ai_usage_rollups',
        'refresh_analytics_rollups',
        'refresh_analytics_risk_signals',
        'rls_auto_enable',
        'handle_new_user'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;

  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('match_content_chunks', 'refresh_analytics_rollups', 'refresh_analytics_risk_signals')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions, pg_temp', fn.sig);
  END LOOP;
END $$;
