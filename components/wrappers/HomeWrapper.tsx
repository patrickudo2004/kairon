import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPrograms } from '../../services/programService';
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

    const { data: allPrograms = [], isLoading, isError, error } = useQuery({
        queryKey: ['programs', activeOrgId],
        queryFn: () => getPrograms(activeOrgId),
        enabled: !!activeOrgId,
    });

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

    if (isError) {
        return (
            <div className="flex items-center justify-center h-full text-rose-500">
                <p>Error loading programs: {(error as Error).message}</p>
            </div>
        );
    }

    return (
        <HomeDashboard
            programs={allPrograms}
            activeProgramId={activeProgramId}
            liveProgramId={liveProgramId}
            onSelectProgram={(p) => { loadProgram(p); navigate(`/editor?id=${p.id}&mode=${mode}`); }}
            onCreateNew={() => { createProgram(new Date().toISOString().split('T')[0]); }}
            onDelete={deleteProgram}
            onDuplicate={duplicateProgram}
        />
    );
};

export default HomeWrapper;
