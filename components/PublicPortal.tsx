import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useConvex } from '../hooks/useConvexMock';
import { api } from '../convex/_generated/api';
import { Program } from '../types';
import { formatDuration, timeToMinutes, minutesToTime } from '../utils/time';
import { Mic, Clock, User, Calendar, ExternalLink, ChevronRight, Share2, Timer, Sun, Moon, RefreshCw } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export const PublicPortal: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [isScrolled, setIsScrolled] = useState(false);
    const [secondsWaiting, setSecondsWaiting] = useState(0);

    const convex = useConvex();
    // Monitor Convex connection status
    const [connStatus, setConnStatus] = useState<string>('connecting');

    // Global Theme Sync
    const isDarkMode = useUIStore((state) => state.isDarkMode);
    const toggleTheme = useUIStore((state) => state.toggleTheme);

    // Remote Theme Control Listener
    useEffect(() => {
        const isThumbnail = new URLSearchParams(window.location.search).get('mode') === 'thumbnail';
        const isIframe = window.self !== window.top;
        if (isThumbnail || isIframe) return;

        const channel = new BroadcastChannel('kairon_displays');
        const handleMessage = (event: MessageEvent) => {
            if (!event.data) return;
            const { type, tabId: targetTabId, theme } = event.data;
            if (type === 'toggle_theme' && (targetTabId === 'public' || !targetTabId)) {
                if (theme) {
                    if ((theme === 'dark' && !isDarkMode) || (theme === 'light' && isDarkMode)) {
                        toggleTheme();
                    }
                } else {
                    toggleTheme();
                }
            }
        };
        channel.addEventListener('message', handleMessage);
        
        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, [toggleTheme, isDarkMode]);

    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const searchId = searchParams.get('id');
    const targetId = slug || searchId || '';

    // Convex Reactive Query
    const programData = useQuery(
        api.programs.getProgramBySlug,
        slug ? { slug } : (targetId ? { slug: targetId } : "skip")
    );

    // If slug is not found as a slug, it might be an ID
    const programByIdData = useQuery(
        api.programs.getProgramById,
        targetId ? { id: targetId as any } : "skip"
    );

    const liveProgramData = useQuery(
        api.programs.getLiveProgram,
        {} // Always poll live channel as fallback
    );

    const programRaw = programData || programByIdData || liveProgramData;

    // Local Program Fallback for offline or draft IDs
    const [localProgram, setLocalProgram] = useState<Program | null>(() => {
        try {
            // Check offline cache keys
            const cacheKeys = [
                `kairon_offline_cache_${targetId}`,
                `kairon_offline_cache_live`,
                'kairon_program'
            ];
            for (const key of cacheKeys) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && (parsed.id === targetId || parsed.slug === targetId || !targetId || parsed.status === 'live')) {
                        return parsed;
                    }
                }
            }

            // Check list stores
            const listKeys = ['programs', 'test_programs'];
            for (const key of listKeys) {
                const allRaw = localStorage.getItem(key);
                if (allRaw) {
                    const all = JSON.parse(allRaw);
                    if (Array.isArray(all) && all.length > 0) {
                        const match = all.find((p: Program) => p.id === targetId || p.slug === targetId);
                        if (match) return match;
                        return all[0];
                    }
                }
            }
        } catch (e) {
            console.warn("Could not read local fallback program in PublicPortal:", e);
        }
        return null;
    });

    // Offline BroadcastChannel Sync
    useEffect(() => {
        const channel = new BroadcastChannel('kairon_offline_sync');
        const handleSync = (event: MessageEvent) => {
            if (!event.data) return;
            const data = event.data;
            setLocalProgram(prev => {
                if (prev && data.id && prev.id !== data.id && prev.slug !== data.id) {
                    return prev;
                }
                const base = prev || {
                    id: data.id || 'live',
                    title: 'Live Service',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '09:00',
                    slots: [],
                    status: 'live',
                    isTimerActive: false,
                    secondsElapsed: 0,
                    currentSlotIndex: 0,
                    isManualMode: false
                };
                return {
                    ...base,
                    currentSlotIndex: data.currentSlotIndex ?? base.currentSlotIndex,
                    isTimerActive: data.isTimerActive !== undefined ? data.isTimerActive : base.isTimerActive,
                    secondsElapsed: data.secondsElapsed ?? base.secondsElapsed,
                    timerStartTimestamp: data.timerStartTimestamp !== undefined ? data.timerStartTimestamp : base.timerStartTimestamp,
                    isOnHold: data.isOnHold !== undefined ? data.isOnHold : base.isOnHold,
                    holdMessage: data.holdMessage !== undefined ? data.holdMessage : base.holdMessage,
                    isManualMode: data.isManualMode !== undefined ? data.isManualMode : base.isManualMode,
                    status: data.status ?? base.status
                } as Program;
            });
        };
        channel.addEventListener('message', handleSync);
        return () => {
            channel.removeEventListener('message', handleSync);
            channel.close();
        };
    }, []);

    // Ticker for connection diagnostics and countdowns
    useEffect(() => {
        const interval = window.setInterval(() => {
            setSecondsWaiting(s => s + 1);
            // Update connection state from client
            const state = (convex as any).status?.() || 'unknown';
            setConnStatus(state);
        }, 1000);
        return () => clearInterval(interval);
    }, [convex]);

    const effectiveProgramRaw = programRaw || localProgram;
    const program = effectiveProgramRaw ? {
        ...(effectiveProgramRaw as any),
        id: (effectiveProgramRaw as any)._id || (effectiveProgramRaw as any).id
    } as Program : null;

    // Tick every second to keep countdown live between Convex subscription updates
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
        if (program && program.isTimerActive && program.slots?.[program.currentSlotIndex ?? 0]) {
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

    const loading = !program && targetId && (programData === undefined && programByIdData === undefined && liveProgramData === undefined) && !localProgram;
    const networkError = false;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#090A0C] flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-12 h-12 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mb-6" />

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">Syncing Event Feed</h2>
                <p className="text-slate-500 dark:text-[#8A93A4] text-xs mb-6 font-mono">Connecting to Kairon Live...</p>

                <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-xl p-5 w-full max-w-xs shadow-xl space-y-3 mx-auto font-mono">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-slate-400">Target ID</span>
                        <span className="text-slate-900 dark:text-[#0EA5E9] truncate ml-4 block max-w-[120px]">{slug}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-slate-400">Connection</span>
                        <span className={`px-2 py-0.5 rounded ${connStatus === 'connected' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                            }`}>
                            {connStatus}
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-slate-400">Wait Time</span>
                        <span className="text-slate-600 dark:text-slate-300">{secondsWaiting}s</span>
                    </div>
                </div>

                {secondsWaiting > 10 && (
                    <div className="mt-6 animate-in fade-in duration-300 font-mono">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-3 px-4 bg-amber-500/10 py-2 rounded-lg">
                            Connection taking longer than usual.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 mx-auto"
                        >
                            <RefreshCw size={14} />
                            Force Refresh
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (!program) {
        return (
            <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-16 h-16 bg-[#181B22] border border-[#22262E] text-[#0EA5E9] rounded-2xl flex items-center justify-center mb-6">
                    <Share2 size={32} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome to Kairon</h1>
                <p className="text-[#8A93A4] text-base font-medium max-w-md mb-8">
                    There is currently no live session active. Please check back later or use a specific event link.
                </p>
                <Link to="/" className="text-[#0EA5E9] font-mono text-xs uppercase font-bold hover:underline flex items-center gap-1.5">
                    Back to Dashboard <ChevronRight size={14} />
                </Link>
            </div>
        );
    }

    if (program.status === 'concluded') {
        return (
            <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-16 h-16 bg-[#181B22] border border-[#22262E] text-[#F59E0B] rounded-2xl flex items-center justify-center mb-6">
                    <Calendar size={32} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Event Concluded</h1>
                <p className="text-[#8A93A4] text-base font-medium max-w-md mb-8">
                    Thank you for attending <strong>{program.title}</strong>. This session is now concluded.
                </p>
                <Link to="/" className="text-[#0EA5E9] font-mono text-xs uppercase font-bold hover:underline">
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
    const isThumbnail = new URLSearchParams(window.location.search).get('mode') === 'thumbnail';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#090A0C] text-slate-900 dark:text-white transition-colors duration-200 font-sans">
            {/* Minimal Nav Header */}
            {!isThumbnail && (
                <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#090A0C]/80 backdrop-blur-md border-b border-slate-200 dark:border-[#22262E] px-6 py-4 transition-colors">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[#181B22] border border-[#2D333F] rounded-md flex items-center justify-center text-[#0EA5E9] font-bold text-xs font-mono">K</div>
                            <span className="font-bold text-slate-900 dark:text-white tracking-tight font-mono text-sm">KAIRON</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-md bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-slate-500 dark:text-[#8A93A4] hover:text-[#0EA5E9] transition-colors"
                            >
                                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                        </div>
                    </div>
                </header>
            )}

            {/* Floating Status Bar */}
            <div className={`fixed top-16 left-0 right-0 z-40 transition-all duration-300 transform ${isScrolled && isTimerActive ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="bg-[#121418]/95 backdrop-blur-md text-white border-b border-[#22262E] shadow-xl">
                    <div className="max-w-3xl mx-auto px-6 py-2.5 flex items-center justify-between">
                        <div className="flex-1 truncate mr-4">
                            <div className="text-[9px] font-mono font-bold uppercase text-[#10B981] tracking-wider">Live Now</div>
                            <div className="font-bold truncate text-sm">{currentSlot?.title}</div>
                        </div>
                        <div className={`text-xl font-mono font-bold tabular-nums ${remainingSeconds < 60 ? 'text-[#EF4444] animate-pulse' : 'text-white'}`}>
                            {formatCountdown(remainingSeconds)}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-6 py-10">
                {/* Event Hero */}
                {!isScrolled && (
                    <div className="mb-10">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-[#181B22] text-slate-700 dark:text-[#0EA5E9] rounded-md text-xs font-mono font-bold uppercase tracking-wider mb-3 border border-slate-200 dark:border-[#22262E]">
                            <Calendar size={13} />
                            {new Date(program.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                            {program.title}
                        </h1>
                        {program.subtitle && (
                            <p className="text-lg text-slate-600 dark:text-[#8A93A4] font-medium max-w-xl">
                                {program.subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Live Hero */}
                {isTimerActive && currentSlot && (
                    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[#121418] border border-[#22262E] rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[#10B981] font-mono font-bold uppercase tracking-wider text-xs">
                                            <span className="w-2 h-2 bg-[#10B981] rounded-full animate-tally" />
                                            Happening Now
                                        </div>
                                        <h2 className="text-2xl md:text-4xl font-bold tracking-tight uppercase leading-tight font-mono">
                                            {currentSlot.title}
                                        </h2>
                                        {currentSlot.speaker && (
                                            <div className="flex items-center gap-2 text-[#0EA5E9] font-mono text-base mt-1">
                                                <User size={16} />
                                                {currentSlot.speaker}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start md:items-end">
                                        <div className="text-[10px] font-mono font-bold uppercase text-[#8A93A4] tracking-widest mb-1">Remaining</div>
                                        <div className={`text-5xl md:text-6xl font-mono font-bold tabular-nums transition-all ${remainingSeconds < 0 ? 'text-[#EF4444] animate-pulse' : (remainingSeconds <= 60 ? 'text-[#F59E0B] animate-pulse' : 'text-white')}`}>
                                            {formatCountdown(remainingSeconds)}
                                        </div>
                                    </div>
                                </div>

                                <div className="h-2.5 bg-[#181B22] rounded-full overflow-hidden border border-[#22262E]">
                                    <div
                                        className="h-full bg-[#0EA5E9] rounded-full transition-all duration-1000 ease-linear"
                                        style={{ width: `${Math.min(100, (derivedSecondsElapsed / (currentSlot.durationMinutes * 60)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {nextSlots.length > 0 && (
                            <div className="mt-6 px-1">
                                <h3 className="text-xs font-mono font-bold text-slate-400 dark:text-[#8A93A4] uppercase tracking-wider mb-3">Up Next</h3>
                                <div className="flex flex-col md:flex-row gap-3">
                                    {nextSlots.map((slot) => (
                                        <div key={slot.id} className="flex-1 bg-white dark:bg-[#121418] p-3.5 rounded-xl border border-slate-200 dark:border-[#22262E] flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] flex items-center justify-center text-slate-400">
                                                <Timer size={16} />
                                            </div>
                                            <div className="min-w-0 font-mono">
                                                <div className="text-[9px] font-bold text-[#0EA5E9] uppercase">{slot.durationMinutes} min</div>
                                                <div className="font-bold text-slate-900 dark:text-white truncate text-xs">{slot.title}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Schedule List */}
                <div className="space-y-3">
                    <h2 className="text-xs font-mono font-bold text-slate-400 dark:text-[#8A93A4] uppercase tracking-widest mb-4 px-1">Full Program</h2>
                    {program.slots.map((slot, index) => (
                        <div
                            key={slot.id}
                            id={`slot-${slot.id}`}
                            className={`p-4 rounded-xl border transition-all duration-300 ${index === currentSlotIndex && isTimerActive
                                ? 'bg-white dark:bg-[#121418] border-[#0EA5E9]/50 shadow-md'
                                : index < currentSlotIndex
                                    ? 'bg-slate-50/50 dark:bg-[#0E1015] border-slate-200 dark:border-[#1E222A] opacity-60'
                                    : 'bg-white dark:bg-[#121418] border-slate-200 dark:border-[#22262E]'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-[#181B22] text-slate-500 dark:text-[#8A93A4] px-2 py-0.5 rounded border border-slate-200 dark:border-[#22262E]">
                                        SLOT {index + 1}
                                    </div>
                                    {index === currentSlotIndex && isTimerActive && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#10B981]/10 text-[#10B981] text-[9px] font-mono font-bold uppercase rounded border border-[#10B981]/30">
                                            <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-tally" />
                                            Live
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#8A93A4] font-mono text-xs font-bold">
                                    <Clock size={13} />
                                    {slot.durationMinutes}m
                                </div>
                            </div>

                            <h3 className={`text-base font-bold mb-2 tracking-tight ${index === currentSlotIndex && isTimerActive ? 'text-[#0EA5E9]' : 'text-slate-900 dark:text-white'}`}>
                                {slot.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
                                {slot.speaker && (
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-[#8A93A4]">
                                        <User size={13} />
                                        {slot.speaker}
                                    </div>
                                )}
                                <div className="text-slate-400 dark:text-[#6A7382] text-[9px] font-bold uppercase tracking-wider border border-slate-200 dark:border-[#22262E] px-2 py-0.5 rounded">
                                    {slot.type}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                {!isThumbnail && (
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
                )}
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
