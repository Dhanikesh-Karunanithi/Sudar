-- Run against Postgres (e.g. Supabase SQL editor) after migrations.
-- Lists tables in public that do NOT have row level security enabled.
select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_force
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not c.relrowsecurity
order by c.relname;

-- Storage: review bucket policies in Dashboard; short TTL signed URLs preferred for sensitive objects.
