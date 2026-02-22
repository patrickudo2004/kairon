-- KAIRON 2.0 - DEFINITIVE SCHEMA & RLS FIX
-- This script consolidates all phases and resolves 500 Internal Server Errors caused by RLS recursion.

-- 1. EXTENSIONS & FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to check organization membership WITHOUT triggering RLS recursion
-- SECURITY DEFINER runs with the privileges of the creator (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = _org_id AND user_id = _user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check organization role
CREATE OR REPLACE FUNCTION public.get_org_role(_org_id UUID, _user_id UUID)
RETURNS public.user_role AS $$
BEGIN
    RETURN (
        SELECT role FROM public.organization_members
        WHERE organization_id = _org_id AND user_id = _user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENSURE TABLES & COLUMNS (PHASES 1-8)

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (id UUID DEFAULT gen_random_uuid() PRIMARY KEY);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS brand_color TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS theme_colors JSONB DEFAULT '{"primary": "#6366f1", "secondary": "#4f46e5"}'::jsonb;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Members
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'operator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.organization_members (id UUID DEFAULT gen_random_uuid() PRIMARY KEY);
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'manager';
ALTER TABLE public.organization_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
DO $$ BEGIN
    ALTER TABLE public.organization_members ADD CONSTRAINT UNQ_org_user UNIQUE(organization_id, user_id);
EXCEPTION
    WHEN duplicate_table THEN null; -- "duplicate_table" is the error code for existing constraint in some cases
    WHEN others THEN 
        IF SQLSTATE = '42P07' THEN null; -- relation already exists
        ELSE RAISE;
        END IF;
END $$;

-- Programs (Consolidated)
CREATE TABLE IF NOT EXISTS public.programs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY);
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS manual_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS is_on_hold BOOLEAN DEFAULT FALSE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS hold_message TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS current_slot_index INTEGER DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS is_timer_active BOOLEAN DEFAULT FALSE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS seconds_elapsed INTEGER DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS timer_start_timestamp BIGINT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS estimated_attendees INTEGER DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS average_hourly_rate DECIMAL DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Slots
CREATE TABLE IF NOT EXISTS public.slots (id UUID DEFAULT gen_random_uuid() PRIMARY KEY);
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS speaker TEXT;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'session';
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS actual_duration INTEGER;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_programs_slug ON programs(slug);
CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);

-- 3. RLS POLICIES (THE FIX)

-- Reset all RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE 
    pol text;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol, 'public', (SELECT tablename FROM pg_policies WHERE policyname = pol AND schemaname = 'public' LIMIT 1));
    END LOOP;
END $$;

-- Profiles: Own entry only
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations:
-- SELECT if member OR creator
CREATE POLICY "org_select_member" ON public.organizations FOR SELECT USING (public.is_org_member(id, auth.uid()) OR created_by = auth.uid());
-- INSERT if authenticated
CREATE POLICY "org_insert_auth" ON public.organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- UPDATE if admin OR creator
CREATE POLICY "org_update_admin" ON public.organizations FOR UPDATE USING (public.get_org_role(id, auth.uid()) = 'admin' OR created_by = auth.uid());

-- Members:
-- SELECT own or teammates (no recursion because function is security definer)
CREATE POLICY "member_select_org" ON public.organization_members FOR SELECT USING (public.is_org_member(organization_id, auth.uid()) OR user_id = auth.uid());
-- INSERT if auth (we validate creator/self in logic, but for RLS, allowing insert if authenticated is often necessary for the initial member)
CREATE POLICY "member_insert_auth" ON public.organization_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Programs:
-- SELECT if in org OR PUBLIC (Phase 7)
CREATE POLICY "program_select" ON public.programs FOR SELECT USING (
    is_public = true OR 
    (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())) OR
    (organization_id IS NULL AND auth.uid() IS NOT NULL)
);
-- INSERT if in org
CREATE POLICY "program_insert" ON public.programs FOR INSERT WITH CHECK (
    (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())) OR
    (organization_id IS NULL AND auth.uid() IS NOT NULL)
);
-- UPDATE if in org
CREATE POLICY "program_update" ON public.programs FOR UPDATE USING (
    (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid())) OR
    (organization_id IS NULL AND auth.uid() IS NOT NULL)
);
-- DELETE if in org
CREATE POLICY "program_delete" ON public.programs FOR DELETE USING (
    (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()))
);

-- Slots: Inherit from program access
CREATE POLICY "slot_select" ON public.slots FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.programs p WHERE p.id = slots.program_id)
);
CREATE POLICY "slot_all" ON public.slots FOR ALL USING (
    EXISTS (SELECT 1 FROM public.programs p WHERE p.id = slots.program_id)
);

-- 4. Auth Trigger (Ensure safe creation)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-setup trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
