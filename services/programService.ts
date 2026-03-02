// Program Service for Kairon (Convex Implementation)
import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { Program, Slot } from '../types';

export const getPrograms = async (organizationId?: string): Promise<Program[]> => {
    if (!organizationId) return [];

    const data = await convex.query(api.programs.getPrograms, {
        organizationId: organizationId as any
    });

    return (data || []).map(transformProgram);
};

export const getProgramById = async (id: string): Promise<Program | null> => {
    const data = await convex.query(api.programs.getProgramById, { id: id as any });
    if (!data) return null;
    return transformProgram(data);
};

export const createProgram = async (program: Program): Promise<Program> => {
    if (!program.organizationId) {
        throw new Error("Organization ID is mandatory for program creation.");
    }

    const id = await convex.mutation(api.programs.createProgram, {
        title: program.title,
        subtitle: program.subtitle,
        date: program.date,
        startTime: program.startTime,
        organizationId: program.organizationId as any,
        slots: program.slots,
        uuid: program.id
    });

    return { ...program, id: id as string };
};

export const updateProgram = async (program: Program): Promise<void> => {
    await convex.mutation(api.programs.updateProgram, {
        id: program.id as any,
        patch: {
            title: program.title,
            subtitle: program.subtitle,
            date: program.date,
            startTime: program.startTime,
            endTime: program.endTime,
            isManualMode: program.isManualMode,
            isOnHold: program.isOnHold,
            holdMessage: program.holdMessage,
            slug: program.slug,
            isPublic: program.isPublic,
            status: program.status,
            estimatedAttendees: program.estimatedAttendees,
            averageHourlyRate: program.averageHourlyRate,
            slots: program.slots
        }
    });
};

export const deleteProgram = async (id: string): Promise<void> => {
    await convex.mutation(api.programs.deleteProgram, { id: id as any });
};

export const updateTimerState = async (programId: string, state: {
    currentSlotIndex: number;
    isTimerActive: boolean;
    secondsElapsed: number;
    timerStartTimestamp: number | null;
    isOnHold?: boolean;
    holdMessage?: string;
}): Promise<void> => {
    await convex.mutation(api.programs.updateTimerState, {
        id: programId as any,
        timerState: {
            currentSlotIndex: state.currentSlotIndex,
            isTimerActive: state.isTimerActive,
            secondsElapsed: state.secondsElapsed,
            timerStartTimestamp: state.timerStartTimestamp,
            isOnHold: state.isOnHold,
            holdMessage: state.holdMessage,
        }
    });
};

export const getPublicProgram = async (slugOrId: string): Promise<Program | null> => {
    // 1. Try slug first
    const dataBySlug = await convex.query(api.programs.getProgramBySlug, { slug: slugOrId });
    if (dataBySlug && (dataBySlug as any).isPublic) {
        return transformProgram(dataBySlug);
    }

    // 2. Try ID fallback
    const dataById = await convex.query(api.programs.getProgramById, { id: slugOrId as any });
    if (dataById && (dataById as any).isPublic) {
        return transformProgram(dataById);
    }

    return null;
};

// Helper to transform Convex document to our Program type
const transformProgram = (p: any): Program => ({
    id: p._id || p.id,
    title: p.title,
    subtitle: p.subtitle,
    date: p.date,
    startTime: p.startTime,
    endTime: p.endTime,
    currentSlotIndex: p.currentSlotIndex,
    isTimerActive: p.isTimerActive,
    timerStartTimestamp: p.timerStartTimestamp,
    secondsElapsed: p.secondsElapsed,
    isManualMode: p.isManualMode,
    isOnHold: p.isOnHold,
    holdMessage: p.holdMessage,
    status: p.status,
    slug: p.slug,
    isPublic: p.isPublic,
    organizationId: p.organizationId,
    estimatedAttendees: p.estimatedAttendees,
    averageHourlyRate: p.averageHourlyRate,
    slots: (p.slots || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        speaker: s.speaker,
        durationMinutes: s.durationMinutes,
        type: s.type,
        details: s.details,
        productionNotes: s.productionNotes,
        actualDuration: s.actualDuration
    }))
});
