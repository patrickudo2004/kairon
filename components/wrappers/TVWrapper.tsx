import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Program, Organization } from '../../types';
import { Bell, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import TVView from '../TVView';

const TVWrapper: React.FC = () => {
    const [searchParams] = useSearchParams();
    const programId = searchParams.get('id');

    const [isDarkMode, setIsDarkMode] = useState(true);
    const toggleTheme = () => setIsDarkMode(prev => !prev);

    // Convex Reactive Query: This replaces the entire manual fetch + RealtimeService
    const programData = useQuery(
        api.programs.getProgramById,
        programId ? { id: programId as any } : "skip"
    );

    // Derive the program object
    const program = programData ? (programData as unknown as Program) : null;

    // Organization Branding Query
    const activeOrg = useQuery(
        api.authQueries.getOrganizationById,
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
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium uppercase tracking-[0.2em] text-[10px]">Connecting to Kairon Pulse...</p>
            </div>
        );
    }

    if (networkError || !program) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <AlertCircle className="text-rose-500" size={40} />
                    </div>

                    <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Sync Lost</h1>
                    <p className="text-slate-400 mb-10 leading-relaxed text-sm">
                        {"This display mode is not correctly configured or the program link has expired."}
                    </p>

                    <div className="text-left bg-black/40 p-5 rounded-2xl mb-10 border border-slate-800/50">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Diagnostics</h3>
                        <p className="text-[10px] text-slate-600 font-mono break-all mb-1">
                            TARGET_ID: {programId}
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-white hover:bg-slate-100 text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Retry Connection
                    </button>

                    <p className="mt-6 text-[10px] text-slate-600 font-medium uppercase tracking-widest">Kairon Display Protocol v2.5</p>
                </div>
            </div>
        );
    }

    return (
        <TVView
            program={program}
            currentSlotIndex={program.currentSlotIndex ?? 0}
            isTimerActive={program.isTimerActive ?? false}
            secondsElapsed={secondsElapsed}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            activeOrg={activeOrg}
        />
    );
};

export default TVWrapper;
