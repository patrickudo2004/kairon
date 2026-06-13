// Program Service for Kairon (Convex Implementation)
import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { Program, Slot } from '../types';

const isTestBypass = () => {
    try {
        return typeof window !== 'undefined' && (window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true');
    } catch {
        return false;
    }
};

const updateTestPrograms = (programs: Program[] | null) => {
    if (programs === null) {
        localStorage.removeItem('test_programs');
    } else {
        localStorage.setItem('test_programs', JSON.stringify(programs));
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('program_update'));
    }
};

export const getPrograms = async (organizationId?: string): Promise<Program[]> => {
    if (isTestBypass()) {
        const local = localStorage.getItem('test_programs');
        return local ? JSON.parse(local) : [];
    }
    if (!organizationId) return [];

    const data = await convex.query(api.programs.getPrograms, {
        organizationId: organizationId as any
    });

    return (data || []).map(transformProgram);
};

export const getProgramById = async (id: string): Promise<Program | null> => {
    if (isTestBypass()) {
        const local = localStorage.getItem('test_programs');
        const list: Program[] = local ? JSON.parse(local) : [];
        const cleanId = id.replace('local-', '');
        const found = list.find((p) => p.id === id || p.id?.replace('local-', '') === cleanId);
        return found || null;
    }
    const data = await convex.query(api.programs.getProgramById, { id: id as any });
    if (!data) return null;
    return transformProgram(data);
};

export const createProgram = async (program: Program): Promise<Program> => {
    if (isTestBypass()) {
        const id = program.id?.startsWith('local-') ? program.id : `local-${crypto.randomUUID()}`;
        const local = localStorage.getItem('test_programs');
        const list: Program[] = local ? JSON.parse(local) : [];
        const existing = list.find((p: any) => p.id === id);
        // CRITICAL: If an existing record is found, preserve timer-managed fields.
        // The React 'program' state does NOT contain currentSlotIndex/isTimerActive etc.
        // (those are separate React states), so a naive overwrite would clobber timer
        // state written by timerSaveMutation and reset displays to slot 0.
        // This mirrors the production updateProgram Convex patch which NEVER touches timer fields.
        const newProg = existing
            ? {
                ...existing,      // base: preserve timer state from localStorage
                ...program,       // overlay: update content fields (title, slots, isManualMode, etc.)
                id,
                // Explicitly restore timer fields from localStorage so they aren't lost:
                currentSlotIndex: existing.currentSlotIndex,
                isTimerActive: existing.isTimerActive,
                timerStartTimestamp: existing.timerStartTimestamp,
                secondsElapsed: existing.secondsElapsed,
                status: existing.status,
              }
            : { ...program, id };
        const filtered = list.filter((p: any) => p.id !== id);
        filtered.push(newProg);
        updateTestPrograms(filtered);
        return newProg;
    }
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
        uuid: program.id.replace('local-', ''),
        isPublic: true
    });

    return { ...program, id: id as string };
};

export const updateProgram = async (program: Program): Promise<void> => {
    if (isTestBypass()) {
        const local = localStorage.getItem('test_programs');
        let list: Program[] = local ? JSON.parse(local) : [];
        list = list.map((p) => {
            if (p.id === program.id) {
                // Preserve timer-managed fields from localStorage (same reason as createProgram above)
                return {
                    ...p,
                    ...program,
                    currentSlotIndex: p.currentSlotIndex,
                    isTimerActive: p.isTimerActive,
                    timerStartTimestamp: p.timerStartTimestamp,
                    secondsElapsed: p.secondsElapsed,
                    status: p.status,
                };
            }
            return p;
        });
        updateTestPrograms(list);
        return;
    }
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
    if (isTestBypass()) {
        const local = localStorage.getItem('test_programs');
        let list: Program[] = local ? JSON.parse(local) : [];
        list = list.filter((p) => p.id !== id);
        updateTestPrograms(list);
        return;
    }
    await convex.mutation(api.programs.deleteProgram, { id: id as any });
};

export const migratePrograms = async (targetOrganizationId: string, programIds: string[]) => {
    if (isTestBypass()) return;
    return await convex.mutation(api.programs.migratePrograms, {
        targetOrganizationId: targetOrganizationId as any,
        programIds: programIds as any[]
    });
};

export const deleteAllProgramsInOrg = async (organizationId: string) => {
    if (isTestBypass()) {
        updateTestPrograms(null);
        return;
    }
    return await convex.mutation(api.programs.deleteAllProgramsInOrg, {
        organizationId: organizationId as any
    });
};

export const updateTimerState = async (programId: string, state: {
    currentSlotIndex: number;
    isTimerActive: boolean;
    secondsElapsed: number;
    timerStartTimestamp: number | null;
    isOnHold?: boolean;
    isManualMode?: boolean;
    holdMessage?: string;
    status?: 'draft' | 'live' | 'concluded' | 'archived';
}): Promise<void> => {
    if (isTestBypass()) {
        console.log(`[TEST BYPASS] updateTimerState for programId=${programId}`, state);
        const local = localStorage.getItem('test_programs');
        let list: Program[] = local ? JSON.parse(local) : [];
        list = list.map((p) => {
            if (p.id === programId) {
                return { ...p, ...state };
            }
            return p;
        });
        updateTestPrograms(list);
        return;
    }
    const stateToSave: any = {
        currentSlotIndex: state.currentSlotIndex,
        isTimerActive: state.isTimerActive,
        secondsElapsed: state.secondsElapsed,
        timerStartTimestamp: state.timerStartTimestamp,
    };

    // Only add optional fields if they are defined
    if (state.isOnHold !== undefined) stateToSave.isOnHold = state.isOnHold;
    if (state.isManualMode !== undefined) stateToSave.isManualMode = state.isManualMode;
    if (state.holdMessage !== undefined) stateToSave.holdMessage = state.holdMessage;
    if (state.status !== undefined) stateToSave.status = state.status;

    await convex.mutation(api.programs.updateTimerState, {
        id: programId as any,
        timerState: stateToSave
    });
};

export const getPublicProgram = async (slugOrId: string): Promise<Program | null> => {
    if (isTestBypass()) {
        return await getProgramById(slugOrId);
    }
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
export const transformProgram = (p: any): Program => ({
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
        prompterText: s.prompterText,
        actualDuration: s.actualDuration
    }))
});
