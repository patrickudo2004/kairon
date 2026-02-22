-- KAIRON PHASE 9: ENTERPRISE SECURITY MIGRATION
-- This script secures the database by ensuring every program belongs to a strict organization context.

-- 1. DATA ADOPTION (Migrate legacy null-org programs)
-- We find the 'First' organization for every user and move their orphans there.
DO $$ 
DECLARE 
    u_id UUID;
    org_id UUID;
BEGIN
    FOR u_id, org_id IN (
        SELECT user_id, organization_id 
        FROM public.organization_members 
        GROUP BY user_id, organization_id
        HAVING organization_id IS NOT NULL
    ) LOOP
        UPDATE public.programs 
        SET organization_id = org_id 
        WHERE created_by = u_id AND organization_id IS NULL;
    END LOOP;
END $$;

-- 2. TIGHTEN THE BOLTS (Strict RLS Policies)
-- We remove the 'NULL check' which allowed legacy data to float around.

-- Reset RLS (using our existing definer functions)
DROP POLICY IF EXISTS "program_select" ON public.programs;
DROP POLICY IF EXISTS "program_insert" ON public.programs;
DROP POLICY IF EXISTS "program_update" ON public.programs;

-- NEW STRICT POLICIES
-- SELECT: Only if public OR you are a member of the SPECIFIC org.
CREATE POLICY "program_select" ON public.programs FOR SELECT USING (
    is_public = true OR 
    (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
);

-- INSERT: Must have a valid organization you belong to.
CREATE POLICY "program_insert" ON public.programs FOR INSERT WITH CHECK (
    organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())
);

-- UPDATE: Must be a member of the org.
CREATE POLICY "program_update" ON public.programs FOR UPDATE USING (
    organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())
);

-- DELETE: Must be a member of the org.
CREATE POLICY "program_delete" ON public.programs FOR DELETE USING (
    organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())
);

-- 3. VALIDATION
-- Ensure 'organization_id' is NOT NULL for future rows (Optional, let's keep it flexible for now but enforced by RLS)
-- ALTER TABLE public.programs ALTER COLUMN organization_id SET NOT NULL; -- Un-comment this if you want strict DB-level enforcement.
