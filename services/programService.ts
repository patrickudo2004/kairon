// Program Service for Kairon (Convex Implementation)
import { convex } from './convexClient';
import { api } from '../convex/_generated/api';
import { Program, Slot } from '../types';
import { getDefaultSeedPrograms } from '../utils/seedData';
import { readLocalFolderPrograms, saveProgramToLocalFolder, deleteProgramFromLocalFolder, getActiveLocalFolder } from './localFolderService';

const isTestBypass = () => {
    try {
        return typeof window !== 'undefined' && (
            window.location.search.includes('testBypass=true') || 
            localStorage.getItem('testBypass') === 'true'
        );
    } catch {
        return false;
    }
};

const safeParseList = (raw: string | null): Program[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const getLocalStoredPrograms = (): Program[] => {
    const local = typeof window !== 'undefined' ? (localStorage.getItem('test_programs') || localStorage.getItem('kairon_offline_programs')) : null;
    const list = safeParseList(local);
    if (list.length > 0) return list;
    if (isTestBypass()) {
        const seed = getDefaultSeedPrograms();
        try {
            localStorage.setItem('kairon_offline_programs', JSON.stringify(seed));
            localStorage.setItem('test_programs', JSON.stringify(seed));
        } catch {}
        return seed;
    }
    return [];
};

const updateTestPrograms = (programs: Program[] | null) => {
    if (programs === null) {
        localStorage.removeItem('test_programs');
        localStorage.removeItem('kairon_offline_programs');
    } else {
        localStorage.setItem('test_programs', JSON.stringify(programs));
        localStorage.setItem('kairon_offline_programs', JSON.stringify(programs));
    }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('program_update'));
    }
};

export const getPrograms = async (organizationId?: string): Promise<Program[]> => {
    if (organizationId?.startsWith('local-folder-')) {
        return await readLocalFolderPrograms();
    }
    if (isTestBypass()) {
        return getLocalStoredPrograms();
    }
    if (!organizationId) {
        const localFolder = getActiveLocalFolder();
        if (localFolder) return await readLocalFolderPrograms(localFolder.folderPath);
        return [];
    }

    const data = await convex.query(api.programs.getPrograms, {
        organizationId: organizationId as any
    });

    return (data || []).map(transformProgram);
};

export const getProgramById = async (id: string): Promise<Program | null> => {
    if (id.startsWith('local-file-') || id.startsWith('local-folder-')) {
        const localList = await readLocalFolderPrograms();
        const cleanId = id.replace('local-file-', '').replace('local-', '');
        const found = localList.find((p) => p.id === id || p.id?.replace(/^local-file-/, '') === cleanId || p.slug === cleanId);
        if (found) return found;
    }
    if (isTestBypass()) {
        const list = getLocalStoredPrograms();
        const cleanId = id.replace('local-', '');
        const found = list.find((p) => p.id === id || p.id?.replace('local-', '') === cleanId || p.slug === cleanId);
        return found || null;
    }
    const data = await convex.query(api.programs.getProgramById, { id: id as any });
    if (!data) return null;
    return transformProgram(data);
};

export const createProgram = async (program: Program): Promise<Program> => {
    if (program.organizationId?.startsWith('local-folder-') || program.id?.startsWith('local-file-')) {
        const saveRes = await saveProgramToLocalFolder(program);
        if (saveRes.success && saveRes.filePath) {
            program._filePath = saveRes.filePath;
        }
        return program;
    }
    if (isTestBypass()) {
        const id = program.id?.startsWith('local-') ? program.id : `local-${crypto.randomUUID()}`;
        const list: Program[] = safeParseList(localStorage.getItem('test_programs'));
        const cleanId = id.replace(/^local-/, '');
        const existing = list.find((p: any) => p.id === id || p.id?.replace(/^local-/, '') === cleanId || (p.slug && p.slug === cleanId));
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
                uuid: id.replace('local-', ''),
                slug: id.replace('local-', ''),
                // Explicitly restore timer fields from localStorage so they aren't lost:
                currentSlotIndex: existing.currentSlotIndex,
                isTimerActive: existing.isTimerActive,
                timerStartTimestamp: existing.timerStartTimestamp,
                secondsElapsed: existing.secondsElapsed,
                status: existing.status,
              }
            : {
                ...program,
                id,
                uuid: id.replace('local-', ''),
                slug: id.replace('local-', ''),
              };
        const filtered = list.filter((p: any) => p.id !== id && p.id?.replace(/^local-/, '') !== cleanId && (!p.slug || p.slug !== cleanId));
        filtered.push(newProg);
        updateTestPrograms(filtered);
        return newProg;
    }
    if (!program.organizationId) {
        throw new Error("Organization ID is mandatory for program creation.");
    }

    const cleanUuid = program.id.replace(/^local-/, '');
    const cleanSlug = (program.slug || cleanUuid).replace(/^local-/, '');
    const id = await convex.mutation(api.programs.createProgram, {
        title: program.title,
        subtitle: program.subtitle,
        date: program.date,
        startTime: program.startTime,
        organizationId: program.organizationId as any,
        slots: program.slots,
        uuid: cleanUuid,
        isPublic: program.isPublic ?? true
    });

    return {
        ...program,
        id: id as string,
        slug: cleanSlug,
        isPublic: program.isPublic ?? true
    };
};

export const updateProgram = async (program: Program): Promise<void> => {
    if (program.organizationId?.startsWith('local-folder-') || program.id?.startsWith('local-file-')) {
        await saveProgramToLocalFolder(program);
        return;
    }
    const cleanSlug = (program.slug || program.id || '').replace(/^local-/, '');
    const cleanId = (program.id || '').replace(/^local-/, '');
    if (isTestBypass()) {
        let list: Program[] = safeParseList(localStorage.getItem('test_programs'));
        list = list.map((p) => {
            const matches = p.id === program.id ||
                p.id?.replace(/^local-/, '') === cleanId ||
                (cleanSlug && (p.slug === cleanSlug || p.slug === cleanId));
            if (matches) {
                // Preserve timer-managed fields from localStorage (same reason as createProgram above)
                return {
                    ...p,
                    ...program,
                    id: p.id,
                    slug: cleanSlug || p.slug,
                    isPublic: program.isPublic ?? p.isPublic ?? true,
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
            slug: cleanSlug || undefined,
            isPublic: program.isPublic ?? true,
            status: program.status,
            estimatedAttendees: program.estimatedAttendees,
            averageHourlyRate: program.averageHourlyRate,
            slots: program.slots
        }
    });
};

export const deleteProgram = async (id: string): Promise<void> => {
    if (id.startsWith('local-file-')) {
        const localList = await readLocalFolderPrograms();
        const found = localList.find(p => p.id === id || p.id?.replace(/^local-file-/, '') === id.replace(/^local-file-/, ''));
        if (found?._filePath) {
            await deleteProgramFromLocalFolder(found._filePath);
        }
        return;
    }
    const cleanId = id.replace('local-', '');
    if (isTestBypass()) {
        let list: Program[] = safeParseList(localStorage.getItem('test_programs'));
        list = list.filter((p: any) => 
            p.id !== id && 
            p.id?.replace('local-', '') !== cleanId && 
            p._id !== id &&
            p._id !== cleanId
        );
        updateTestPrograms(list);
        return;
    }
    await convex.mutation(api.programs.deleteProgram, { id: id as any });
    try {
        localStorage.removeItem(`kairon_offline_cache_${id}`);
        localStorage.removeItem(`kairon_offline_cache_${cleanId}`);
        localStorage.removeItem(`kairon_offline_cache_${id}_prompter`);
        localStorage.removeItem(`kairon_offline_cache_${cleanId}_prompter`);
    } catch {
        // ignore storage errors
    }
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
        let list: Program[] = safeParseList(localStorage.getItem('test_programs'));
        const cleanId = programId.replace(/^local-/, '');
        list = list.map((p) => {
            if (p.id === programId || p.id?.replace(/^local-/, '') === cleanId || (p as any)._id === programId) {
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

    try {
        await convex.mutation(api.programs.updateTimerState, {
            id: programId as any,
            timerState: stateToSave
        });
    } catch (err) {
        console.warn("Could not sync timer state to Convex cloud (offline or local session):", err);
    }
};

export const getPublicProgram = async (slugOrId: string): Promise<Program | null> => {
    if (isTestBypass()) {
        return await getProgramById(slugOrId);
    }
    const cleanTarget = slugOrId.replace(/^local-/, '');
    // 1. Try slug first
    const dataBySlug = await convex.query(api.programs.getProgramBySlug, { slug: cleanTarget });
    if (dataBySlug && (dataBySlug as any).isPublic !== false) {
        return transformProgram(dataBySlug);
    }

    // 2. Try ID fallback
    const dataById = await convex.query(api.programs.getProgramById, { id: cleanTarget as any });
    if (dataById && (dataById as any).isPublic !== false) {
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
    slug: String(p.slug || p.uuid || p._id || p.id || '').replace(/^local-/, ''),
    isPublic: p.isPublic ?? true,
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
