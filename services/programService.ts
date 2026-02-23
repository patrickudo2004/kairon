// Program Service for Kairon
import { supabase } from './supabaseClient';
import { Program, Slot } from '../types';

export const getPrograms = async (): Promise<Program[]> => {
    const { data, error } = await supabase
        .from('programs')
        .select(`
      *,
      slots (*)
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Supabase Error [getPrograms]:", error.message, error.details, error.hint);
        throw error;
    }

    // Transform data
    // (e.g. converting snake_case DB columns to camelCase if they differed, but I tried to keep them similar.
    // Wait, my SQL used snake_case for some fields (duration_minutes, start_time) but TS uses camelCase.
    // I must map them.)

    return (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        date: p.date,
        startTime: p.start_time,
        endTime: p.end_time,
        currentSlotIndex: p.current_slot_index,
        isTimerActive: p.is_timer_active,
        timerStartTimestamp: p.timer_start_timestamp,
        secondsElapsed: p.seconds_elapsed,
        isManualMode: p.manual_mode,
        isOnHold: p.is_on_hold,
        holdMessage: p.hold_message,
        status: p.status,
        slug: p.slug,
        isPublic: p.is_public,
        slots: (p.slots || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            speaker: s.speaker,
            durationMinutes: s.duration_minutes,
            type: s.type,
            details: s.details,
            actualDuration: s.actual_duration,
            order: s.order
        })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    }));
};

export const getProgramById = async (id: string): Promise<Program | null> => {
    const { data, error } = await supabase
        .from('programs')
        .select(`
      *,
      slots (*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error fetching program:", error);
        return null;
    }

    if (!data) return null;

    const p = data;
    return {
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        date: p.date,
        startTime: p.start_time,
        endTime: p.end_time,
        currentSlotIndex: p.current_slot_index,
        isTimerActive: p.is_timer_active,
        timerStartTimestamp: p.timer_start_timestamp,
        secondsElapsed: p.seconds_elapsed,
        isManualMode: p.manual_mode,
        isOnHold: p.is_on_hold,
        holdMessage: p.hold_message,
        status: p.status,
        slug: p.slug,
        isPublic: p.is_public,
        slots: (p.slots || []).map((s: any) => ({
            id: s.id,
            title: s.title,
            speaker: s.speaker,
            durationMinutes: s.duration_minutes,
            type: s.type,
            details: s.details,
            actualDuration: s.actual_duration,
            order: s.order
        })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    };
};

export const createProgram = async (program: Program): Promise<Program> => {
    if (!program.organizationId) {
        throw new Error("Organization ID is mandatory for program creation.");
    }
    // 1. Insert Program
    const { data: pData, error: pError } = await supabase
        .from('programs')
        .insert({
            id: program.id,
            title: program.title,
            subtitle: program.subtitle,
            date: program.date,
            start_time: program.startTime,
            end_time: program.endTime,
            organization_id: program.organizationId,
            estimated_attendees: program.estimatedAttendees,
            average_hourly_rate: program.averageHourlyRate,
            slug: program.slug,
            is_public: program.isPublic,
            status: program.status
        })
        .select()
        .single();

    if (pError) throw pError;

    // 2. Insert Slots if any
    if (program.slots.length > 0) {
        const slotsToInsert = program.slots.map((s, index) => ({
            id: s.id,
            program_id: program.id,
            title: s.title,
            speaker: s.speaker,
            duration_minutes: s.durationMinutes,
            type: s.type,
            details: s.details,
            actual_duration: s.actualDuration,
            "order": index // We need to persist order!
        }));

        const { error: sError } = await supabase
            .from('slots')
            .insert(slotsToInsert);

        if (sError) throw sError;
    }

    return program;
};

export const updateProgram = async (program: Program): Promise<void> => {
    // 1. Update Program Details
    const { error: pError } = await supabase
        .from('programs')
        .update({
            title: program.title,
            subtitle: program.subtitle,
            date: program.date,
            start_time: program.startTime,
            end_time: program.endTime,
            manual_mode: program.isManualMode,
            is_on_hold: program.isOnHold,
            hold_message: program.holdMessage,
            slug: program.slug,
            is_public: program.isPublic,
            status: program.status,
            estimated_attendees: program.estimatedAttendees,
            average_hourly_rate: program.averageHourlyRate,
            updated_at: new Date().toISOString()
        })
        .eq('id', program.id);

    if (pError) throw pError;

    // 2. Sync Slots (Full Replace Strategy for prototype simplicity)
    // Delete all existing slots for this program
    const { error: dError } = await supabase
        .from('slots')
        .delete()
        .eq('program_id', program.id);

    if (dError) throw dError;

    // Insert new slots
    if (program.slots.length > 0) {
        const slotsToInsert = program.slots.map((s, index) => ({
            id: s.id,
            program_id: program.id,
            title: s.title,
            speaker: s.speaker,
            duration_minutes: s.durationMinutes,
            type: s.type,
            details: s.details,
            actual_duration: s.actualDuration,
            "order": index
        }));

        const { error: sError } = await supabase
            .from('slots')
            .insert(slotsToInsert);

        if (sError) throw sError;
    }
};

export const deleteProgram = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const updateTimerState = async (programId: string, state: {
    currentSlotIndex: number;
    isTimerActive: boolean;
    secondsElapsed: number;
    timerStartTimestamp: number | null;
    isOnHold?: boolean;
    holdMessage?: string;
}): Promise<void> => {
    const { error } = await supabase
        .from('programs')
        .update({
            current_slot_index: state.currentSlotIndex,
            is_timer_active: state.isTimerActive,
            seconds_elapsed: state.secondsElapsed,
            timer_start_timestamp: state.timerStartTimestamp,
            is_on_hold: state.isOnHold,
            hold_message: state.holdMessage,
            updated_at: new Date().toISOString()
        })
        .eq('id', programId);

    if (error) throw error;
};

export const getPublicProgram = async (slugOrId: string): Promise<Program | null> => {
    console.log("Searching for public program:", slugOrId);

    // 1. Try slug first
    const { data: slugData, error: slugError } = await supabase
        .from('programs')
        .select(`*, slots (*)`)
        .eq('slug', slugOrId)
        .eq('is_public', true)
        .maybeSingle();

    if (slugData) {
        console.log("Found program by slug:", slugData.title);
        return transformProgram(slugData);
    }

    // 2. Try ID fallback (only if slugOrId is a valid UUID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    if (isUuid) {
        const { data: idData, error: idError } = await supabase
            .from('programs')
            .select(`*, slots (*)`)
            .eq('id', slugOrId)
            .eq('is_public', true)
            .maybeSingle();

        if (idData) {
            console.log("Found program by ID:", idData.title);
            return transformProgram(idData);
        }
        if (idError) console.error("ID Lookup Error:", idError);
    } else {
        console.log("Not a UUID, skipping ID lookup.");
    }

    if (slugError) console.error("Slug Lookup Error:", slugError);

    console.warn("No public program found for:", slugOrId);
    return null;
};

// Helper to transform snake_case to camelCase
const transformProgram = (p: any): Program => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    date: p.date,
    startTime: p.start_time,
    endTime: p.end_time,
    currentSlotIndex: p.current_slot_index,
    isTimerActive: p.is_timer_active,
    timerStartTimestamp: p.timer_start_timestamp,
    secondsElapsed: p.seconds_elapsed,
    isManualMode: p.manual_mode,
    isOnHold: p.is_on_hold,
    holdMessage: p.hold_message,
    status: p.status,
    slug: p.slug,
    isPublic: p.is_public,
    slots: (p.slots || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        speaker: s.speaker,
        durationMinutes: s.duration_minutes,
        type: s.type,
        details: s.details,
        actualDuration: s.actual_duration
    })).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
});
