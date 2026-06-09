import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from '../../hooks/useConvexMock';
import { api } from '../../convex/_generated/api';
import HomeDashboard from '../HomeDashboard';
import { Program } from '../../types';
import { ConfirmationModal } from '../ConfirmationModal';

interface HomeWrapperProps {
    activeOrgId: string | undefined;
    activeProgramId: string;
    activeSessions: Program[];
    loadProgram: (p: Program) => void;
    createProgram: (date: string) => void;
    deleteProgram: (id: string) => void;
    duplicateProgram: (p: Program) => void;
    onPlay: (p: Program, seconds?: number) => void;
    mode: string;
}

const HomeWrapper: React.FC<HomeWrapperProps> = ({
    activeOrgId,
    activeProgramId,
    activeSessions,
    loadProgram,
    createProgram,
    deleteProgram,
    duplicateProgram,
    onPlay,
    mode
}) => {
    const navigate = useNavigate();
    const [confirmStopId, setConfirmStopId] = useState<string | null>(null);

    const allPrograms = useConvexQuery(
        api.programs.getPrograms,
        activeOrgId ? { organizationId: activeOrgId as any } : "skip"
    );

    const updateTimerState = useConvexMutation(api.programs.updateTimerState);

    const onStopLive = async (programId: string) => {
        try {
            await updateTimerState({
                id: programId as any,
                timerState: {
                    isTimerActive: false,
                    secondsElapsed: 0,
                    timerStartTimestamp: null,
                    status: 'draft',
                    currentSlotIndex: 0
                }
            });
        } catch (err) {
            console.error("Failed to stop live session:", err);
        }
    };

    const isLoading = activeOrgId && allPrograms === undefined;

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

    // CRITICAL: Transform Convex _id to id for the rest of the app
    const transformedPrograms = (allPrograms || []).map((p: any) => ({
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
