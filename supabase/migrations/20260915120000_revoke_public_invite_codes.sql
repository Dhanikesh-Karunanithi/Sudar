-- Revoke invite codes that were committed in the public repo (or seeded by public ops scripts).
-- Issue replacement single-use codes out-of-band via Studio early-access admin; never re-seed live secrets.

UPDATE public.invite_codes
SET
  is_active = false,
  max_uses = COALESCE(max_uses, 0)
WHERE code IN (
  'EARLY_TALISMA',
  'CURSOR-HIRE-01',
  'CURSOR-HIRE-02',
  'CURSOR-HIRE-03'
);
