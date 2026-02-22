-- KAIRON 2.0 - SECURITY STRIKE & MIGRATION
-- This script adopts "orphan" programs into the user's primary organization
-- and enforces stricter RLS to prevent unauthorized access.

-- 1. ADOPT ORPHANS
-- This updates any program with a NULL organization_id to the creator's first organization.
UPDATE public.programs p
SET organization_id = (
  SELECT organization_id 
  FROM public.organization_members om 
  WHERE om.user_id = p.created_by 
  ORDER BY joined_at ASC 
  LIMIT 1
)
WHERE organization_id IS NULL;

-- 2. ENFORCE NOT NULL (Optional but recommended after cleaning data)
-- ALTER TABLE public.programs ALTER COLUMN organization_id SET NOT NULL;

-- 3. REFINED RLS POLICIES
-- Only allow access to programs belonging to an organization the user is a member of.

-- Drop old flexible policies
DROP POLICY IF EXISTS "Programs are viewable by organization members" ON public.programs;
DROP POLICY IF EXISTS "Programs can be inserted by organization members" ON public.programs;
DROP POLICY IF EXISTS "Programs can be updated by organization members" ON public.programs;
DROP POLICY IF EXISTS "Programs can be deleted by organization members" ON public.programs;

-- Policies for Organizations (ensure they exist first)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see organizations they are members of
CREATE POLICY "Organizations are viewable by members" ON public.organizations
FOR SELECT USING (
  public.is_org_member(id, auth.uid()) OR created_by = auth.uid()
);

-- Policies for Programs
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- SELECT: Member of the organization
CREATE POLICY "Programs are viewable by organization members" ON public.programs
FOR SELECT USING (
  public.is_org_member(organization_id, auth.uid())
);

-- INSERT: Member of the organization
CREATE POLICY "Programs can be inserted by organization members" ON public.programs
FOR INSERT WITH CHECK (
  public.is_org_member(organization_id, auth.uid())
);

-- UPDATE: Member of the organization
CREATE POLICY "Programs can be updated by organization members" ON public.programs
FOR UPDATE USING (
  public.is_org_member(organization_id, auth.uid())
) WITH CHECK (
  public.is_org_member(organization_id, auth.uid())
);

-- DELETE: Member of the organization
CREATE POLICY "Programs can be deleted by organization members" ON public.programs
FOR DELETE USING (
  public.is_org_member(organization_id, auth.uid())
);

-- Ensure public access still works for public programs (view only)
CREATE POLICY "Public programs are viewable by everyone" ON public.programs
FOR SELECT USING (
  is_public = true
);
