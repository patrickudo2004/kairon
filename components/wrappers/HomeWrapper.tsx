import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from '../../hooks/useConvexMock';
import { api } from '../../convex/_generated/api';
import HomeDashboard from '../HomeDashboard';
import { Program } from '../../types';
import { ConfirmationModal } from '../ConfirmationModal';
import { updateTimerState as updateTimerStateService } from '../../services/programService';

interface HomeWrapperProps {
    activeOrgId: string | undefined;
    activeProgramId: string;
    activeSessions: Program[];
    programs?: Program[];
    loadProgram: (p: Program) => void;
    createProgram: (date: string) => void;
    deleteProgram: (id: string) => void;
    duplicateProgram: (id: string) => void;
    onTurnaround?: (id: string) => void;
    onPlay: (p: Program, seconds?: number) => void;
    mode: string;
}

const HomeWrapper: React.FC<HomeWrapperProps> = ({
    activeOrgId,
    activeProgramId,
    activeSessions,
    programs: propPrograms,
    loadProgram,
    createProgram,
    deleteProgram,
    duplicateProgram,
    onTurnaround,
    onPlay,
    mode
}) => {
    const navigate = useNavigate();
    const [confirmStopId, setConfirmStopId] = useState<string | null>(null);

    const isConvexOrg = Boolean(
        activeOrgId &&
        !activeOrgId.startsWith('local-') &&
        !activeOrgId.startsWith('test-') &&
        activeOrgId.length >= 19
    );

    const convexPrograms = useConvexQuery(
        api.programs.getPrograms,
        (isConvexOrg && !propPrograms) ? { organizationId: activeOrgId as any } : "skip"
    );

    const updateTimerState = useConvexMutation(api.programs.updateTimerState);

    const onStopLive = async (programId: string) => {
        try {
            const timerState = {
                isTimerActive: false,
                secondsElapsed: 0,
                timerStartTimestamp: null,
                status: 'draft' as const,
                currentSlotIndex: 0
            };
            if (programId.startsWith('local-')) {
                await updateTimerStateService(programId, timerState);
            } else {
                await updateTimerState({
                    id: programId as any,
                    timerState
                });
            }
        } catch (err) {
            console.error("Failed to stop live session:", err);
        }
    };

    const isLoading = !propPrograms && isConvexOrg && convexPrograms === undefined;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm animate-pulse">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Use propPrograms (from App.tsx, which includes localFolderPrograms and offline cache)
    // or fallback to Convex programs
    const rawList = propPrograms || convexPrograms || [];
    const transformedPrograms = rawList.map((p: any) => ({
        ...p,
        id: String(p._id || p.id)
    }));

    return (
        <>
            <HomeDashboard
                programs={transformedPrograms}
                activeProgramId={activeProgramId}
                activeSessions={activeSessions}
                onSelectProgram={(p, s) => { loadProgram(p); if (s !== undefined) onPlay(p, s); }}
                onViewAnalytics={(id) => navigate(`/analytics/${id}`)}
                onStopLive={(id) => setConfirmStopId(id)}
                onCreateNew={() => { createProgram(new Date().toISOString().split('T')[0]); }}
                onDelete={deleteProgram}
                onDuplicate={duplicateProgram}
                onTurnaround={onTurnaround}
                onPlay={(p, s) => onPlay(p, s)}
            />

            <ConfirmationModal
                isOpen={!!confirmStopId}
                title="Deactivate Session?"
                message="This will stop the live timer and move the event back to draft. Monitors will return to standby."
                confirmText="Deactivate"
                type="warning"
                onConfirm={() => confirmStopId && onStopLive(confirmStopId)}
                onClose={() => setConfirmStopId(null)}
            />
        </>
    );
};

export default HomeWrapper;
