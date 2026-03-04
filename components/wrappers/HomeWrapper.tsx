import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import HomeDashboard from '../HomeDashboard';
import { Program } from '../../types';

interface HomeWrapperProps {
    activeOrgId: string | undefined;
    activeProgramId: string;
    liveProgramId: string | null;
    loadProgram: (p: Program) => void;
    createProgram: (date: string) => void;
    deleteProgram: (id: string) => void;
    duplicateProgram: (p: Program) => void;
    mode: string;
}

const HomeWrapper: React.FC<HomeWrapperProps> = ({
    activeOrgId,
    activeProgramId,
    liveProgramId,
    loadProgram,
    createProgram,
    deleteProgram,
    duplicateProgram,
    mode
}) => {
    const navigate = useNavigate();

    const allPrograms = useConvexQuery(
        api.programs.getPrograms,
        activeOrgId ? { organizationId: activeOrgId as any } : "skip"
    );

    const updateTimerState = useConvexMutation(api.programs.updateTimerState);

    const onStopLive = async (programId: string) => {
        if (!confirm('Deactivate this live session? It will be moved back to draft.')) return;
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

    return (
        <HomeDashboard
            programs={allPrograms || []}
            activeProgramId={activeProgramId}
            liveProgramId={liveProgramId}
            onSelectProgram={(p) => { loadProgram(p); navigate(`/editor?id=${p.id}&mode=${mode}`); }}
            onViewAnalytics={(id) => navigate(`/analytics/${id}`)}
            onStopLive={onStopLive}
            onCreateNew={() => { createProgram(new Date().toISOString().split('T')[0]); }}
            onDelete={deleteProgram}
            onDuplicate={duplicateProgram}
        />
    );
};

export default HomeWrapper;
