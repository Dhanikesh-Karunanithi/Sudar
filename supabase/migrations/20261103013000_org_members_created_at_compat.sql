-- Compat column: Studio getActiveOrgId historically selected org_members.created_at,
-- but the table only had joined_at. Missing column made membership queries fail, so
-- Bearer/MCP sessions rejected a valid active_org_id and then crashed creating a
-- duplicate personal workspace (empty HTTP 500).
alter table public.org_members
  add column if not exists created_at timestamptz not null default now();

update public.org_members
set created_at = joined_at::timestamptz
where created_at is distinct from joined_at::timestamptz;

comment on column public.org_members.created_at is
  'Compat alias of joined_at for Studio getActiveOrgId selects; prefer joined_at in new code.';
