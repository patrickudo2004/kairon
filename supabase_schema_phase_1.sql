-- 1. Create Profiles Table (Extends Supabase Auth)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Organizations Table
CREATE TABLE public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    theme_colors JSONB DEFAULT '{"primary": "#6366f1", "secondary": "#4f46e5"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Create Organization Members Table (Role-Based Access)
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'operator');

CREATE TABLE public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'manager',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- 4. Update Programs Table
ALTER TABLE public.programs ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.programs ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Profiles: Users can only read/write their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations: Only members can view, only admins/creators can update
CREATE POLICY "Members can view organization" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = public.organizations.id AND user_id = auth.uid()
        )
    );

-- Organization Members: Members can see their teammates
CREATE POLICY "Members can view teammates" ON public.organization_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members AS self
            WHERE self.organization_id = public.organization_members.organization_id AND self.user_id = auth.uid()
        )
    );

-- Programs: Only organization members can see/edit programs
CREATE POLICY "Org members can view programs" ON public.programs
    FOR SELECT USING (
        organization_id IS NULL OR -- Keep legacy public programs visible if needed
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = public.programs.organization_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Org members can insert programs" ON public.programs
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = public.programs.organization_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Org members can update programs" ON public.programs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE organization_id = public.programs.organization_id AND user_id = auth.uid()
        )
    );

-- 7. Trigger for Profile creation on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
