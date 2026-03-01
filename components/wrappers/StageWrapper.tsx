import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Program, Organization } from '../../types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import StageDisplay from '../StageDisplay';

const StageWrapper: React.FC = () => {
    const [searchParams] = useSearchParams();
    const programId = searchParams.get('id');

    const [isDarkMode, setIsDarkMode] = useState(true);
    const toggleTheme = () => setIsDarkMode(prev => !prev);

    // Convex Reactive Query
    const programData = useQuery(
        api.programs.getProgramById,
        programId ? { id: programId as any } : "skip"
    );

    // Derive the program object with explicit ID mapping
    const program = programData ? {
        ...(programData as any),
        id: (programData as any)._id
    } as Program : null;

    // Organization Branding Query
    const activeOrg = useQuery(
        api.orgs.getOrganizationById,
        program?.organizationId ? { id: program.organizationId } : "skip"
    ) as Organization | null;

    // Internal Tick Logic for Smooth Countdown
    const [secondsElapsed, setSecondsElapsed] = useState(0);

    useEffect(() => {
        if (program?.isTimerActive && program?.timerStartTimestamp) {
            // Initial sync
            const now = Date.now();
            const elapsed = Math.floor((now - program.timerStartTimestamp) / 1000);
            setSecondsElapsed(elapsed);

            // Tick interval
            const interval = window.setInterval(() => {
                const updatedNow = Date.now();
                const updatedElapsed = Math.floor((updatedNow - program.timerStartTimestamp!) / 1000);
                setSecondsElapsed(updatedElapsed);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            // Static value when paused
            setSecondsElapsed(program?.secondsElapsed || 0);
        }
    }, [program?.isTimerActive, program?.timerStartTimestamp, program?.secondsElapsed]);

    // Handle Loading State
    const loading = programId && programData === undefined;
    const networkError = programId && programData === null;

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium tracking-[0.3em] uppercase text-[10px]">Syncing Stage Pulse...</p>
            </div>
        );
    }

    if (networkError || !program) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <AlertCircle className="text-emerald-500" size={40} />
                    </div>

                    <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase tracking-tighter">Stage Disconnected</h1>
                    <p className="text-slate-400 mb-10 leading-relaxed text-xs uppercase tracking-widest">
                        {"Pulse connection failed. Verify program settings in the Admin console."}
                    </p>

                    <div className="text-left bg-black/40 p-5 rounded-2xl mb-10 border border-slate-800/50">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Technical Context</h3>
                        <p className="text-[10px] text-slate-600 font-mono break-all mb-1">
                            P_ID: {programId}
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                        <RefreshCw size={18} />
                        Reconnect Pulse
                    </button>
                </div>
            </div>
        );
    }

    return (
        <StageDisplay
            program={program}
            currentSlotIndex={program.currentSlotIndex ?? 0}
            isTimerActive={program.isTimerActive ?? false}
            secondsElapsed={secondsElapsed}
            activeOrg={activeOrg}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
        />
    );
};

export default StageWrapper;
