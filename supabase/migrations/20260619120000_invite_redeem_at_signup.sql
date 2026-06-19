-- Count invite use once at email signup (handle_new_user), not on every login.

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

      UPDATE public.invite_codes
      SET uses_count = uses_count + 1
      WHERE code = v_signup_code
        AND is_active = true
        AND (max_uses IS NULL OR uses_count < max_uses);
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
