-- HISTORICAL: seeded EARLY_TALISMA into public.invite_codes (unlimited).
-- That code was revoked by 20260915120000_revoke_public_invite_codes.sql.
-- Do not re-activate; issue new single-use codes via Studio early-access admin.
-- Kept for migration history only (already applied on Sudar project).

INSERT INTO public.invite_codes (code, type, grants_tier, max_uses, is_active, bonus_credits)
VALUES ('EARLY_TALISMA', 'early_access', 'early_access', NULL, true, 0)
ON CONFLICT (code) DO UPDATE SET
  grants_tier = 'early_access',
  type = 'early_access';
  -- Do not set is_active = true on conflict (would undo revoke if re-applied).
  max_uses = EXCLUDED.max_uses;
