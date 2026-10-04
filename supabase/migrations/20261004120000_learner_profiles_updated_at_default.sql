-- learner_profiles predates supabase/migrations (Prisma @updatedAt had no DB default), so app inserts that
-- omitted updated_at failed silently and most learners never got a Digital Learner Twin row.
alter table public.learner_profiles alter column updated_at set default now();

insert into public.learner_profiles (user_id, updated_at)
select p.id, now()
from public.profiles p
where not exists (select 1 from public.learner_profiles lp where lp.user_id = p.id);
