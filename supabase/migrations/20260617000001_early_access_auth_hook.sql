-- Email signup invite validation + hardened profile creation

CREATE OR REPLACE FUNCTION public.validate_invite_code_internal(raw_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_invite record;
BEGIN
  IF raw_code IS NULL OR length(trim(raw_code)) < 4 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invite code is required.');
  END IF;

  v_code := upper(trim(raw_code));
  SELECT * INTO v_invite
  FROM public.invite_codes
  WHERE code = v_code AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired invite code.');
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invite code has expired.');
  END IF;

  IF v_invite.max_uses IS NOT NULL AND v_invite.uses_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invite code has reached its usage limit.');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_invite.code,
    'type', v_invite.type,
    'grants_tier', v_invite.grants_tier,
    'bonus_credits', v_invite.bonus_credits,
    'referrer_id', v_invite.owner_user_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_invite_code_internal(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invite_code_internal(text) TO supabase_auth_admin;

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
BEGIN
  provider := coalesce(event->'user'->'app_metadata'->>'provider', '');

  -- OAuth signups: invite verified post-auth via httpOnly cookie + callback
  IF provider IN ('google', 'apple', 'github', 'azure', 'facebook', 'linkedin_oidc') THEN
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_tier text;
  v_signup_code text;
  v_invite_raw text;
  validation jsonb;
BEGIN
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_invite_raw := new.raw_user_meta_data->>'invite_code';

  v_tier := 'default';
  v_signup_code := null;

  IF v_invite_raw IS NOT NULL AND length(trim(v_invite_raw)) >= 4 THEN
    validation := public.validate_invite_code_internal(v_invite_raw);
    IF coalesce((validation->>'valid')::boolean, false) THEN
      v_tier := coalesce(validation->>'grants_tier', 'early_access');
      v_signup_code := validation->>'code';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, access_tier, signup_code_used, role)
  VALUES (new.id, v_full_name, new.raw_user_meta_data->>'avatar_url', v_tier, v_signup_code, 'LEARNER')
  ON CONFLICT (id) DO UPDATE SET
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    access_tier = CASE
      WHEN public.profiles.signup_code_used IS NOT NULL THEN public.profiles.access_tier
      ELSE excluded.access_tier
    END,
    signup_code_used = coalesce(public.profiles.signup_code_used, excluded.signup_code_used);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

REVOKE SELECT ON public.invite_codes FROM anon, authenticated;
