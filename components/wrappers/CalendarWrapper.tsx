import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPrograms } from '../../services/programService';
import CalendarView from '../CalendarView';
import { Program } from '../../types';

interface CalendarWrapperProps {
    activeProgramId: string;
    loadProgram: (p: Program) => void;
    createProgram: (date: string) => void;
    deleteProgram: (id: string) => void;
    duplicateProgram: (p: Program) => void;
    mode: string;
}

const CalendarWrapper: React.FC<CalendarWrapperProps> = ({
    activeProgramId,
    loadProgram,
    createProgram,
    deleteProgram,
    duplicateProgram,
    mode
}) => {
    const navigate = useNavigate();

    const { data: allPrograms = [], isLoading } = useQuery({
        queryKey: ['programs'],
        queryFn: getPrograms,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-slate-500">Loading programs...</div>
            </div>
        );
    }

    return (
        <CalendarView
            programs={allPrograms}
            activeProgramId={activeProgramId}
            onSelectProgram={(p) => { loadProgram(p); navigate(`/live?id=${p.id}&mode=${mode}`); }}
            onCreateProgram={(date) => { createProgram(date); navigate(`/editor?mode=${mode}`); }}
            onDelete={deleteProgram}
            onDuplicate={duplicateProgram}
        />
    );
};

export default CalendarWrapper;
