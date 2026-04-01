import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import CalendarView from '../CalendarView';
import { Program } from '../../types';
import { transformProgram } from '../../services/programService';

interface CalendarWrapperProps {
    activeOrgId: string | undefined;
    activeProgramId: string;
    liveProgramId: string | null;
    loadProgram: (p: Program) => void;
    createProgram: (date: string) => void;
    deleteProgram: (id: string) => void;
    duplicateProgram: (p: Program) => void;
    mode: string;
}

const CalendarWrapper: React.FC<CalendarWrapperProps> = ({
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

    const convexPrograms = useConvexQuery(
        api.programs.getPrograms,
        activeOrgId ? { organizationId: activeOrgId as any } : "skip"
    );

    const isLoading = activeOrgId && convexPrograms === undefined;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm animate-pulse">Loading calendar...</p>
                </div>
            </div>
        );
    }

    const allPrograms = (convexPrograms || []).map(transformProgram);

    return (
        <CalendarView
            programs={allPrograms}
            activeProgramId={activeProgramId}
            onSelectProgram={(p) => { loadProgram(p); navigate(`/editor?mode=${mode}`); }}
            onCreateProgram={(date) => { createProgram(date); navigate(`/editor?mode=${mode}`); }}
            onDelete={deleteProgram}
            onDuplicate={duplicateProgram}
        />
    );
};

export default CalendarWrapper;
