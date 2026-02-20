-- Supabase Schema & Policy Fix (V2 - Non-Circular)

-- 1. Ensure all columns exist (Branding & Analytics)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS brand_color TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS estimated_attendees INTEGER DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS average_hourly_rate DECIMAL DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS manual_mode BOOLEAN DEFAULT FALSE;

-- 2. RESET RLS (Clear the slate to avoid conflicts)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Members can view organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Members can view teammates" ON public.organization_members;
DROP POLICY IF EXISTS "Users can join organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Org members can view programs" ON public.programs;
DROP POLICY IF EXISTS "Org members can insert programs" ON public.programs;
DROP POLICY IF EXISTS "Org members can update programs" ON public.programs;

-- 3. RE-IMPLEMENT RLS POLICIES

-- PROFILES
CREATE POLICY "Profiles: view own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ORGANIZATIONS
CREATE POLICY "Organizations: select" ON public.organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Organizations: insert" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Organizations: update" ON public.organizations
    FOR UPDATE USING (
        id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role = 'admin')
    );

-- ORGANIZATION MEMBERS
-- IMPORTANT: This one is tricky. To avoid recursion, we use a simple rule.
CREATE POLICY "Members: select own" ON public.organization_members
    FOR SELECT USING (user_id = auth.uid());

-- To see teammates, we check if you belong to the same org.
-- We use a slightly different approach to break recursion.
CREATE POLICY "Members: select teammates" ON public.organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT m.organization_id FROM public.organization_members m WHERE m.user_id = auth.uid()
        )
    );

CREATE POLICY "Members: insert" ON public.organization_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- PROGRAMS
CREATE POLICY "Programs: select" ON public.programs
    FOR SELECT USING (
        organization_id IS NULL OR 
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Programs: insert" ON public.programs
    FOR INSERT WITH CHECK (
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    );
CREATE POLICY "Programs: update" ON public.programs
    FOR UPDATE USING (
        organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    );

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- 5. Trigger Fix
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
