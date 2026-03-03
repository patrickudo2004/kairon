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

    const specificProgram = useQuery(
        api.programs.getProgramById,
        programId ? { id: programId as any } : "skip"
    );

    const liveProgram = useQuery(
        api.programs.getLiveProgram,
        {} // Always poll live channel as fallback
    );

    // Multi-level fallback: Specific ID -> Global Live -> Standby
    const activeData = (programId && specificProgram) ? specificProgram : liveProgram;

    // Derive the program object with explicit ID mapping
    const program = activeData ? {
        ...(activeData as any),
        id: (activeData as any)._id
    } as Program : null;

    // Organization Branding Query
    const activeOrg = useQuery(
        api.orgs.getOrganizationById,
        program?.organizationId ? { id: program.organizationId } : "skip"
    ) as Organization | null;

    // Use a simple ticker to force re-render every second for the countdown
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = window.setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const nowTime = Date.now();
    const derivedSecondsElapsed = (program?.isTimerActive && program?.timerStartTimestamp)
        ? Math.max(0, Math.floor((nowTime - program.timerStartTimestamp) / 1000))
        : (program?.secondsElapsed || 0);


    // Handle Loading State
    const loading = programId
        ? (specificProgram === undefined)
        : (liveProgram === undefined);

    // Only show "Sync Lost" if we have no data at all after trying both specific and live lookups
    const networkError = programId
        ? (specificProgram === null && liveProgram === null)
        : (liveProgram === null);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium uppercase tracking-[0.2em] text-[10px]">Connecting to Kairon Pulse...</p>
            </div>
        );
    }

    if (networkError || !program) {
        if (networkError) {
            return (
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <AlertCircle className="text-rose-500" size={40} />
                        </div>

                        <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Sync Lost</h1>
                        <p className="text-slate-400 mb-10 leading-relaxed text-sm">
                            {"Pulse connection failed. Verify your internet connection."}
                        </p>

                        <div className="text-left bg-black/40 p-5 rounded-2xl mb-10 border border-slate-800/50">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Diagnostics</h3>
                            <p className="text-[10px] text-slate-600 font-mono break-all mb-1">
                                TARGET_ID: {programId || 'GLOBAL_LIVE_FEED'}
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-white hover:bg-slate-100 text-black font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Retry Connection
                        </button>
                    </div>
                </div>
            );
        }

        // Default TV Fallback: Welcome/Thank You Screen
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12 text-center font-sans">
                <div className="w-24 h-24 bg-indigo-600/20 rounded-full flex items-center justify-center mb-12 animate-in zoom-in duration-1000">
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl rotate-45" />
                </div>
                <h1 className="text-white text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">
                    Stay Tuned
                </h1>
                <p className="text-slate-400 text-2xl font-medium max-w-2xl mx-auto leading-relaxed border-t border-slate-800 pt-8 mt-4">
                    The next session will begin shortly. Thank you for your patience.
                </p>
                <div className="mt-20 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                </div>
            </div>
        );
    }

    return (
        <TVView
            program={program}
            currentSlotIndex={program.currentSlotIndex ?? 0}
            isTimerActive={program.isTimerActive ?? false}
            secondsElapsed={derivedSecondsElapsed}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            activeOrg={activeOrg}
        />
    );
};

export default TVWrapper;
