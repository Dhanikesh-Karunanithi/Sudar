-- Immutable admin audit trail — written via Studio service-role API routes only.
-- Service role bypasses RLS; policies below constrain direct PostgREST access from authenticated JWTs.

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organisations (id) on delete set null,
  actor_user_id uuid not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_org_created_idx on public.audit_events (org_id, created_at desc);
create index if not exists audit_events_actor_created_idx on public.audit_events (actor_user_id, created_at desc);

comment on table public.audit_events is 'Security-sensitive actions (purge, exports, role changes). No PII or secrets in payload.';

alter table public.audit_events enable row level security;

create policy audit_events_super_admin_select
  on public.audit_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'SUPER_ADMIN'::public.role
    )
  );

create policy audit_events_org_admin_select
  on public.audit_events
  for select
  to authenticated
  using (
    org_id is not null
    and exists (
      select 1 from public.org_members om
      where om.org_id = audit_events.org_id
        and om.user_id = auth.uid()
        and om.role in ('ADMIN'::public.org_role, 'MANAGER'::public.org_role)
    )
  );

-- No INSERT/UPDATE/DELETE policies for JWT roles; app uses service-role server-side only.
