-- Post-wipe RLS tighten (Cavi clean schema).
-- Service-role (Studio/Learn BFFs) is unaffected. Authenticated client policies only.
-- Rollback: restore prior policies from docs/RLS_RAG_BEARER_SUBPLAN.md §2A snapshot (2026-09-15).

BEGIN;

-- ---------------------------------------------------------------------------
-- profiles: stop global directory SELECT
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read any profile" ON public.profiles;

CREATE POLICY "Users can read own or same-org profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
    )
    OR id IN (
      SELECT om.user_id
      FROM public.org_members om
      WHERE om.org_id IN (
        SELECT om2.org_id FROM public.org_members om2 WHERE om2.user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- courses / modules: no cross-tenant published catalog via client
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Org members can read org courses or published courses" ON public.courses;
DROP POLICY IF EXISTS "Org members can read their org courses" ON public.courses;

CREATE POLICY "Org members creators or enrollees can read courses"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
    )
    OR id IN (
      SELECT e.course_id FROM public.enrollments e WHERE e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Modules readable by org members or if course is published" ON public.modules;
DROP POLICY IF EXISTS "Modules readable by org members or published courses" ON public.modules;

CREATE POLICY "Modules readable via org membership creator or enrollment"
  ON public.modules
  FOR SELECT
  TO authenticated
  USING (
    course_id IN (
      SELECT c.id
      FROM public.courses c
      WHERE c.created_by = auth.uid()
         OR c.org_id IN (
           SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
         )
         OR c.id IN (
           SELECT e.course_id FROM public.enrollments e WHERE e.user_id = auth.uid()
         )
    )
  );

-- ---------------------------------------------------------------------------
-- org_members: no open self-join; invite/provisioning use service-role
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can join orgs" ON public.org_members;

-- ---------------------------------------------------------------------------
-- organisations: provisioning uses service-role (getOrCreateOrg)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create orgs" ON public.organisations;

-- ---------------------------------------------------------------------------
-- invite_codes / integration_api_keys: keep RLS on + 0 policies (service-role only)
-- ---------------------------------------------------------------------------
COMMENT ON TABLE public.invite_codes IS
  'Early-access invite secrets. RLS enabled with no authenticated policies — Studio/Learn must use service-role only.';
COMMENT ON TABLE public.integration_api_keys IS
  'Integration API secrets. RLS enabled with no authenticated policies — service-role only.';

-- ---------------------------------------------------------------------------
-- SudarSim: defense-in-depth for any future client reads (APIs use service-role today)
-- ---------------------------------------------------------------------------

-- Scenarios: org members read; creators/admins write
CREATE POLICY "Org members can read sim scenarios"
  ON public.sim_scenarios
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org editors can insert sim scenarios"
  ON public.sim_scenarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND org_id IN (
      SELECT om.org_id
      FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('ADMIN'::org_role, 'MANAGER'::org_role, 'CREATOR'::org_role)
    )
  );

CREATE POLICY "Org editors can update sim scenarios"
  ON public.sim_scenarios
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT om.org_id
      FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('ADMIN'::org_role, 'MANAGER'::org_role, 'CREATOR'::org_role)
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT om.org_id
      FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('ADMIN'::org_role, 'MANAGER'::org_role, 'CREATOR'::org_role)
    )
  );

CREATE POLICY "Org editors can delete sim scenarios"
  ON public.sim_scenarios
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT om.org_id
      FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('ADMIN'::org_role, 'MANAGER'::org_role, 'CREATOR'::org_role)
    )
  );

-- CRM skins follow scenario org
CREATE POLICY "Org members can read sim crm skins"
  ON public.sim_crm_skins
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org editors can write sim crm skins"
  ON public.sim_crm_skins
  FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT om.org_id
      FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('ADMIN'::org_role, 'MANAGER'::org_role, 'CREATOR'::org_role)
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT om.org_id
      FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('ADMIN'::org_role, 'MANAGER'::org_role, 'CREATOR'::org_role)
    )
  );

-- Sessions: learner owns own rows; org admins can read
CREATE POLICY "Learners can read own sim sessions"
  ON public.sim_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR org_id IN (
      SELECT om.org_id
      FROM public.org_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('ADMIN'::org_role, 'MANAGER'::org_role)
    )
  );

CREATE POLICY "Learners can insert own sim sessions"
  ON public.sim_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Learners can update own sim sessions"
  ON public.sim_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Transcripts / rubric via session ownership
CREATE POLICY "Learners can read own sim transcripts"
  ON public.sim_transcripts
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM public.sim_sessions s WHERE s.user_id = auth.uid()
    )
    OR session_id IN (
      SELECT s.id
      FROM public.sim_sessions s
      WHERE s.org_id IN (
        SELECT om.org_id
        FROM public.org_members om
        WHERE om.user_id = auth.uid()
          AND om.role IN ('ADMIN'::org_role, 'MANAGER'::org_role)
      )
    )
  );

CREATE POLICY "Learners can write own sim transcripts"
  ON public.sim_transcripts
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM public.sim_sessions s WHERE s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM public.sim_sessions s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Learners can read own sim rubric results"
  ON public.sim_rubric_results
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM public.sim_sessions s WHERE s.user_id = auth.uid()
    )
    OR session_id IN (
      SELECT s.id
      FROM public.sim_sessions s
      WHERE s.org_id IN (
        SELECT om.org_id
        FROM public.org_members om
        WHERE om.user_id = auth.uid()
          AND om.role IN ('ADMIN'::org_role, 'MANAGER'::org_role)
      )
    )
  );

CREATE POLICY "Learners can write own sim rubric results"
  ON public.sim_rubric_results
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT s.id FROM public.sim_sessions s WHERE s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM public.sim_sessions s WHERE s.user_id = auth.uid()
    )
  );

COMMIT;
