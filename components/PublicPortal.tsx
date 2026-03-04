import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Program } from '../types';
import { formatDuration, timeToMinutes, minutesToTime } from '../utils/time';
import { Mic, Clock, User, Calendar, ExternalLink, ChevronRight, Share2, Timer, Sun, Moon } from 'lucide-react';

export const PublicPortal: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false); // Default to light for public users? 

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    // Sync theme to document for full-page dark mode
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return () => document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    // Convex Reactive Query
    const programData = useQuery(
        api.programs.getProgramBySlug,
        slug ? { slug } : "skip"
    );

    // If slug is not found as a slug, it might be an ID
    const programByIdData = useQuery(
        api.programs.getProgramById,
        !programData && slug ? { id: slug as any } : "skip"
    );

    const programRaw = programData || programByIdData;
    const program = programRaw ? {
        ...(programRaw as any),
        id: (programRaw as any)._id || (programRaw as any).id
    } as Program : null;


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


    // Scroll Observer
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 300);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-scroll to active slot on load
    useEffect(() => {
        if (program && program.isTimerActive && program.slots[program.currentSlotIndex ?? 0]) {
            const timer = setTimeout(() => {
                const activeSlotId = program.slots[program.currentSlotIndex ?? 0].id;
                const element = document.getElementById(`slot-${activeSlotId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [program?.id, program?.isTimerActive, program?.currentSlotIndex]);

    const loading = slug && programData === undefined;
    const networkError = slug && programData === null && programByIdData === null;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Syncing event pulse...</p>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-indigo-600/20 text-indigo-500 rounded-[2rem] flex items-center justify-center mb-8 rotate-3">
                    <Share2 size={48} />
                </div>
                <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Welcome to Kairon</h1>
                <p className="text-slate-400 text-xl font-medium max-w-md mb-12">
                    There is currently no live session active. Please check back later or use a specific event link.
                </p>
                <Link to="/" className="text-indigo-400 font-bold hover:underline flex items-center gap-2">
                    Back to Dashboard <ChevronRight size={18} />
                </Link>
            </div>
        );
    }

    if (program.status === 'concluded') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-indigo-600/20 text-indigo-500 rounded-full flex items-center justify-center mb-8">
                    <Calendar size={48} />
                </div>
                <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Event Concluded</h1>
                <p className="text-slate-400 text-xl font-medium max-w-md mb-12">
                    Thank you for attending **{program.title}**. This session is now over.
                </p>
                <Link to="/" className="text-indigo-400 font-bold hover:underline">
                    Back to Kairon
                </Link>
            </div>
        );
    }

    const currentSlotIndex = program.currentSlotIndex ?? 0;
    const currentSlot = program.slots[currentSlotIndex];
    const nextSlots = program.slots.slice(currentSlotIndex + 1, currentSlotIndex + 3);

    const formatCountdown = (totalSeconds: number) => {
        if (totalSeconds < -1800) return '--:--';
        const abs = Math.abs(totalSeconds);
        const mins = Math.floor(abs / 60);
        const secs = abs % 60;
        return `${totalSeconds < 0 ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const remainingSeconds = currentSlot ? (currentSlot.durationMinutes * 60) - derivedSecondsElapsed : 0;
    const isTimerActive = program.isTimerActive ?? false;

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-900' : 'bg-slate-50'} transition-colors pb-24`}>
            {/* Minimal Header */}
            <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-all">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">K</div>
                        <span className="font-bold text-slate-900 dark:text-white tracking-tight">Kairon</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Floating Status Bar */}
            <div className={`fixed top-16 left-0 right-0 z-40 transition-all duration-500 transform ${isScrolled && isTimerActive ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="bg-indigo-600/90 dark:bg-indigo-900/90 backdrop-blur-lg text-white border-b border-indigo-400/20 shadow-2xl">
                    <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
                        <div className="flex-1 truncate mr-4">
                            <div className="text-[10px] font-bold uppercase opacity-70 tracking-tighter">Live Now</div>
                            <div className="font-bold truncate text-sm">{currentSlot?.title}</div>
                        </div>
                        <div className={`text-2xl font-mono font-black tabular-nums ${remainingSeconds < 60 ? 'text-amber-300 animate-pulse' : ''}`}>
                            {formatCountdown(remainingSeconds)}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-6 py-12">
                {/* Event Hero */}
                {!isScrolled && (
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-200/50 dark:border-indigo-800/50">
                            <Calendar size={14} />
                            {new Date(program.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-none">
                            {program.title}
                        </h1>
                        {program.subtitle && (
                            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium max-w-xl">
                                {program.subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Live Hero */}
                {isTimerActive && currentSlot && (
                    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-600 dark:to-indigo-950 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl -ml-32 -mb-32" />

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-indigo-200 font-bold uppercase tracking-widest text-xs">
                                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                                            Happening Now
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                                            {currentSlot.title}
                                        </h2>
                                        {currentSlot.speaker && (
                                            <div className="flex items-center gap-2 text-indigo-100 font-medium text-lg italic">
                                                <User size={18} />
                                                {currentSlot.speaker}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center md:items-end">
                                        <div className="text-[10px] font-bold uppercase text-indigo-200 tracking-widest mb-1">Remaining</div>
                                        <div className={`text-6xl md:text-7xl font-mono font-black tabular-nums transition-all ${remainingSeconds < 60 ? 'text-amber-400 scale-105' : ''}`}>
                                            {formatCountdown(remainingSeconds)}
                                        </div>
                                    </div>
                                </div>

                                <div className="h-3 bg-indigo-900/40 rounded-full overflow-hidden border border-indigo-400/20">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                                        style={{ width: `${Math.min(100, (derivedSecondsElapsed / (currentSlot.durationMinutes * 60)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {nextSlots.length > 0 && (
                            <div className="mt-8 px-4">
                                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Up Next</h3>
                                <div className="flex flex-col md:flex-row gap-4">
                                    {nextSlots.map((slot) => (
                                        <div key={slot.id} className="flex-1 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                                                <Timer size={20} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-indigo-500 uppercase">{slot.durationMinutes} min Session</div>
                                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{slot.title}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Schedule List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 px-1">Full Program</h2>
                    {program.slots.map((slot, index) => (
                        <div
                            key={slot.id}
                            id={`slot-${slot.id}`}
                            className={`group p-6 rounded-[2rem] border transition-all duration-500 ${index === currentSlotIndex && isTimerActive
                                ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/50 shadow-xl'
                                : index < currentSlotIndex
                                    ? 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-60 grayscale-[0.5]'
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-mono font-black bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                                        EVENT {index + 1}
                                    </div>
                                    {index === currentSlotIndex && isTimerActive && (
                                        <div className="relative flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-full tracking-widest">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                            Live
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-sm font-bold">
                                    <Clock size={16} />
                                    {slot.durationMinutes}m
                                </div>
                            </div>

                            <h3 className={`text-2xl font-black mb-3 tracking-tight transition-colors ${index === currentSlotIndex && isTimerActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                {slot.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-6">
                                {slot.speaker && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden">
                                            <User size={16} />
                                        </div>
                                        {slot.speaker}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                                    <Mic size={14} />
                                    {slot.type}
                                </div>
                            </div>

                            {slot.details && (
                                <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed border-t border-slate-100 dark:border-slate-900 pt-4">
                                    {slot.details}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <footer className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest mb-4">
                        Powered by Kairon
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-2xl font-black hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all shadow-xl hover:shadow-2xl border border-slate-200 dark:border-slate-800"
                    >
                        Try Kairon for your event
                        <ExternalLink size={18} />
                    </Link>
                </footer>
            </main>

            {/* Hold Message Overlay */}
            {program.isOnHold && (
                <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="text-center max-w-lg">
                        <div className="w-24 h-24 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <Clock size={48} />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
                            Event On Hold
                        </h2>
                        <p className="text-slate-400 text-xl font-medium mb-8">
                            {program.holdMessage || "We'll be back in just a few minutes."}
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Live Sync Active
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
