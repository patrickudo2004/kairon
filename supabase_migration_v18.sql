-- Phase 18: Advanced Cues Migration
-- Adds internal production notes/cues to the slots table

ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS production_notes TEXT;

-- Update RLS (though existing policies for slots should cover this if they select *)
-- Just to be safe, ensures members can update their own slot notes
DROP POLICY IF EXISTS "Org members can update slots" ON public.slots;
CREATE POLICY "Org members can update slots" ON public.slots
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.programs
            JOIN public.organization_members ON public.programs.organization_id = public.organization_members.organization_id
            WHERE public.programs.id = public.slots.program_id 
            AND public.organization_members.user_id = auth.uid()
        )
    );
