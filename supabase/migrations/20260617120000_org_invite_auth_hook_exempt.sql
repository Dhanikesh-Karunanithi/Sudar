-- Allow org email invites (inviteUserByEmail) to bypass early-access signup hook

CREATE OR REPLACE FUNCTION public.hook_before_user_created(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_code text;
  validation jsonb;
  provider text;
  org_invite text;
BEGIN
  provider := coalesce(event->'user'->'app_metadata'->>'provider', '');

  -- OAuth signups: invite verified post-auth via httpOnly cookie + callback
  IF provider IN ('google', 'apple', 'github', 'azure', 'facebook', 'linkedin_oidc') THEN
    RETURN '{}'::jsonb;
  END IF;

  org_invite := nullif(trim(coalesce(event->'user'->'raw_user_meta_data'->>'org_invite', '')), '');
  IF org_invite IN ('true', '1', 'yes') THEN
    RETURN '{}'::jsonb;
  END IF;

  invite_code := nullif(trim(coalesce(event->'user'->'raw_user_meta_data'->>'invite_code', '')), '');
  IF invite_code IS NULL THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'An invite code is required to sign up.',
        'http_code', 403
      )
    );
  END IF;

  validation := public.validate_invite_code_internal(invite_code);
  IF NOT coalesce((validation->>'valid')::boolean, false) THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'message', coalesce(validation->>'error', 'Invalid invite code.'),
        'http_code', 403
      )
    );
  END IF;

  RETURN '{}'::jsonb;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.hook_before_user_created(jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hook_before_user_created(jsonb) TO supabase_auth_admin;
