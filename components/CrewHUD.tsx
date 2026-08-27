import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '../hooks/useConvexMock';
import { api } from '../convex/_generated/api';
import { Program } from '../types';
import { formatDuration, timeToMinutes, minutesToTime } from '../utils/time';
import { Mic, Clock, User, Calendar, ExternalLink, ChevronRight, Share2, Timer, Sun, Moon, RefreshCw, Volume2, Lightbulb, Video, CheckCircle2, Activity, Maximize, Minimize } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export const CrewHUD: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const searchId = searchParams.get('id');
    const targetId = slug || searchId || '';
    const isAutoFs = searchParams.get('autofs') === '1';

    const [tick, setTick] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFsPrompt, setShowFsPrompt] = useState(isAutoFs);

    // Hardware Fullscreen Toggle
    const toggleFullscreen = useCallback(async () => {
        try {
            const doc = window.document as any;
            const docEl = doc.documentElement as any;

            const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
            const isFs = doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullScreenElement || doc.msFullscreenElement;

            if (!isFs) {
                if (requestFullScreen) await requestFullScreen.call(docEl);
            } else {
                if (cancelFullScreen) await cancelFullScreen.call(doc);
            }
            setShowFsPrompt(false);
        } catch (err) {
            console.error("Error toggling fullscreen in CrewHUD:", err);
        }
    }, []);

    // Track fullscreen changes and keyboard shortcuts
    useEffect(() => {
        const handleFsChange = () => {
            const doc = document as any;
            const isFs = !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
            setIsFullscreen(isFs);
            if (isFs) setShowFsPrompt(false);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        document.addEventListener('mozfullscreenchange', handleFsChange);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
            document.removeEventListener('mozfullscreenchange', handleFsChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [toggleFullscreen]);

    // BroadcastChannel Display Telemetry
    useEffect(() => {
        const isThumbnail = new URLSearchParams(window.location.search).get('mode') === 'thumbnail';
        const isIframe = window.self !== window.top;
        if (isThumbnail || isIframe) return;

        const channel = new BroadcastChannel('kairon_displays');
        
        const sendHeartbeat = () => {
            const isBrowserFullscreen = Math.abs(window.screen.width - window.innerWidth) <= 1 && 
                                         Math.abs(window.screen.height - window.innerHeight) <= 1;
            const isFs = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement ||
                isBrowserFullscreen
            );
            const isOnSecondary = Math.abs(window.screenX) >= 100 || Math.abs(window.screenY) >= 100;

            channel.postMessage({
                type: 'heartbeat',
                tabId: 'crew',
                isFullscreen: isFs,
                isOnSecondary
            });
        };
        
        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 1000);
        
        return () => {
            clearInterval(interval);
            channel.close();
        };
    }, []);

    // Convex Reactive Query
    const programData = useQuery(
        api.programs.getProgramBySlug,
        slug ? { slug } : "skip"
    );

    const programByIdData = useQuery(
        api.programs.getProgramById,
        !programData && targetId ? { id: targetId as any } : "skip"
    );

    const programRaw = programData || programByIdData;

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
                    if (parsed && (parsed.id === targetId || parsed.slug === targetId || !targetId)) {
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
                        if (!targetId) return all[0];
                    }
                }
            }
        } catch (e) {
            console.warn("Could not read local fallback program in CrewHUD:", e);
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

    const effectiveProgramRaw = programRaw || localProgram;
    const program = effectiveProgramRaw ? {
        ...(effectiveProgramRaw as any),
        id: (effectiveProgramRaw as any)._id || (effectiveProgramRaw as any).id
    } as Program : null;

    // Live Ticker
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (program?.isTimerActive) {
            interval = setInterval(() => {
                setTick(t => t + 1);
            }, 200);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [program?.isTimerActive, program?.id]);

    const nowTime = Date.now();
    const derivedSecondsElapsed = (program?.isTimerActive && program?.timerStartTimestamp)
        ? Math.max(0, Math.floor((nowTime - program.timerStartTimestamp) / 1000))
        : (program?.secondsElapsed || 0);

    const currentSlotIndex = program?.currentSlotIndex ?? 0;
    const currentSlot = program?.slots?.[currentSlotIndex];
    const nextSlot = program?.slots?.[currentSlotIndex + 1];

    const formatCountdown = (totalSeconds: number) => {
        const abs = Math.abs(totalSeconds);
        const mins = Math.floor(abs / 60);
        const secs = abs % 60;
        return `${totalSeconds < 0 ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const remainingSeconds = currentSlot ? (currentSlot.durationMinutes * 60) - derivedSecondsElapsed : 0;

    const [localAcks, setLocalAcks] = useState<Set<string>>(new Set());

    // Safely attempt cloud mutation if available
    let acknowledgeMutation: any = null;
    try {
        acknowledgeMutation = useMutation((api.programs as any).acknowledgeCrew || (api.programs as any).acknowledge);
    } catch (e) {}

    const handleAck = async (role: 'sound' | 'lighting' | 'video') => {
        if (!program || !currentSlot) return;
        const ackKey = `${currentSlot.id}-${role}`;
        setLocalAcks(prev => new Set(prev).add(ackKey));
        
        try {
            if (acknowledgeMutation && programRaw?._id) {
                await acknowledgeMutation({
                    programId: programRaw._id as any,
                    slotId: currentSlot.id,
                    role,
                });
            }
        } catch (e) {
            console.warn("Could not push ACK to Convex (local fallback active):", e);
        }
    };

    const isAcked = (role: string) => {
        if (!currentSlot) return false;
        return localAcks.has(`${currentSlot.id}-${role}`);
    };

    if (!program || !program.slots || program.slots.length === 0) {
        return (
            <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center p-6 text-center font-mono">
                <div className="w-10 h-10 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs font-mono text-[#8A93A4] uppercase tracking-widest">Awaiting Tactical Feed...</p>
                <p className="text-[10px] text-slate-500 mt-2">Target ID: {targetId || 'Live Session'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-3 py-1.5 bg-[#181B22] border border-[#22262E] text-[#0EA5E9] rounded text-xs hover:bg-[#22262E] transition-all"
                >
                    Refresh Stream
                </button>
            </div>
        );
    }

    return (
        <div 
            onDoubleClick={toggleFullscreen}
            className="min-h-screen bg-[#090A0C] text-white overflow-hidden flex flex-col font-mono select-none relative"
        >
            {/* Auto Fullscreen Floating Banner */}
            {showFsPrompt && !isFullscreen && (
                <div 
                    onClick={toggleFullscreen}
                    className="cursor-pointer bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl animate-pulse z-50 transition-all"
                >
                    <Maximize size={14} />
                    <span>Click anywhere or press 'F' to lock into 100% Fullscreen</span>
                </div>
            )}

            {/* Header / Meta */}
            <header className="px-6 py-3.5 bg-[#121418] border-b border-[#22262E] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-[#F59E0B] text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                        Crew HUD
                    </div>
                    <h1 className="text-sm font-bold truncate max-w-[300px] text-white uppercase tracking-wider font-mono">
                        {program.title}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${program.isTimerActive ? 'bg-[#10B981] animate-tally' : 'bg-[#6A7382]'}`} />
                        <span className="text-[10px] font-bold text-[#8A93A4] uppercase tracking-widest font-mono">
                            {program.isTimerActive ? 'ON AIR' : 'STANDBY'}
                        </span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-[#8A93A4] tracking-widest">
                        {new Date().toLocaleTimeString()}
                    </div>
                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 bg-[#181B22] hover:bg-[#22262E] border border-[#22262E] text-[#8A93A4] hover:text-white rounded transition-all"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen (F)"}
                    >
                        {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
                    </button>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-12 gap-px bg-[#22262E] overflow-hidden">
                {/* Left: The "Now" Block */}
                <div className="col-span-12 lg:col-span-8 bg-[#090A0C] p-6 lg:p-10 flex flex-col justify-between border-r border-[#22262E]">
                    <div className="space-y-2">
                        <div className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-[0.25em] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-tally" />
                            Current Slot • {currentSlotIndex + 1} of {program.slots.length}
                        </div>
                        <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-white uppercase font-mono leading-tight">
                            {currentSlot?.title || 'No Active Slot'}
                        </h2>
                        {currentSlot?.speaker && (
                            <div className="text-lg lg:text-xl text-[#0EA5E9] flex items-center gap-2 font-mono font-medium mt-1">
                                <User size={16} /> {currentSlot.speaker}
                            </div>
                        )}
                    </div>

                    <div className="flex items-baseline gap-4 py-6 lg:py-10">
                        <div className={`text-[16vw] lg:text-[140px] font-mono font-bold leading-none tabular-nums tracking-tight ${remainingSeconds < 0 ? 'text-[#EF4444] animate-pulse' : (remainingSeconds <= 60 ? 'text-[#F59E0B] animate-pulse' : 'text-white')}`}>
                            {formatCountdown(remainingSeconds)}
                        </div>
                        <div className="text-xl lg:text-2xl font-mono font-bold text-[#6A7382] uppercase tracking-widest">
                            {remainingSeconds < 0 ? 'Overtime' : 'Remaining'}
                        </div>
                    </div>

                    <div className="h-3 bg-[#121418] rounded-full overflow-hidden border border-[#22262E] p-0.5">
                        <div
                            className="h-full bg-[#0EA5E9] rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${Math.min(100, (derivedSecondsElapsed / ((currentSlot?.durationMinutes || 1) * 60)) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Right: Technical Cues & ACKs */}
                <div className="col-span-12 lg:col-span-4 flex flex-col bg-[#121418]">
                    <div className="flex-1 overflow-y-auto">
                        {/* Active Cue Block */}
                        <div className="p-6 space-y-3 border-b border-[#22262E]">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-[0.2em]">Active Production Cue</span>
                                <Activity size={12} className="text-[#10B981]" />
                            </div>
                            <div className="bg-[#181B22] border border-[#22262E] rounded-md p-4">
                                {currentSlot?.productionNotes ? (
                                    <p className="text-base text-[#E1E4EA] leading-snug font-mono">
                                        "{currentSlot.productionNotes}"
                                    </p>
                                ) : (
                                    <p className="text-[#6A7382] text-xs font-mono italic">No cues entered for current slot.</p>
                                )}
                            </div>
                        </div>

                        {/* Next Prep Block */}
                        <div className="p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono font-bold text-[#F59E0B] uppercase tracking-[0.2em]">Upcoming Standby</span>
                                    <span className="text-[9px] text-[#8A93A4] font-mono font-semibold uppercase truncate max-w-[200px]">Next: {nextSlot?.title || 'Conclude'}</span>
                                </div>
                                <Clock size={12} className="text-[#F59E0B]" />
                            </div>
                            <div className="bg-[#181B22] border border-[#22262E] rounded-md p-4 relative overflow-hidden">
                                {nextSlot?.productionNotes ? (
                                    <p className="text-base text-[#F59E0B] leading-snug font-mono">
                                        "{nextSlot.productionNotes}"
                                    </p>
                                ) : (
                                    <p className="text-[#6A7382] text-xs font-mono italic">No advance cues required.</p>
                                )}
                            </div>
                        </div>

                        {/* ACK Section */}
                        <div className="p-6 space-y-3 border-t border-[#22262E]">
                            <span className="text-[10px] font-mono font-bold text-[#8A93A4] uppercase tracking-[0.2em]">Confirm Readiness</span>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleAck('sound')}
                                    className={`flex flex-col items-center justify-center py-3.5 rounded-md border transition-all ${isAcked('sound') ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' : 'bg-[#181B22] border-[#22262E] text-[#8A93A4] hover:text-white hover:border-[#2D333F]'}`}
                                >
                                    <Volume2 size={18} className="mb-1" />
                                    <span className="text-[9px] font-mono font-bold uppercase">Sound</span>
                                    {isAcked('sound') && <CheckCircle2 size={10} className="mt-1" />}
                                </button>
                                <button
                                    onClick={() => handleAck('lighting')}
                                    className={`flex flex-col items-center justify-center py-3.5 rounded-md border transition-all ${isAcked('lighting') ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' : 'bg-[#181B22] border-[#22262E] text-[#8A93A4] hover:text-white hover:border-[#2D333F]'}`}
                                >
                                    <Lightbulb size={18} className="mb-1" />
                                    <span className="text-[9px] font-mono font-bold uppercase">Lights</span>
                                    {isAcked('lighting') && <CheckCircle2 size={10} className="mt-1" />}
                                </button>
                                <button
                                    onClick={() => handleAck('video')}
                                    className={`flex flex-col items-center justify-center py-3.5 rounded-md border transition-all ${isAcked('video') ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' : 'bg-[#181B22] border-[#22262E] text-[#8A93A4] hover:text-white hover:border-[#2D333F]'}`}
                                >
                                    <Video size={18} className="mb-1" />
                                    <span className="text-[9px] font-mono font-bold uppercase">Video</span>
                                    {isAcked('video') && <CheckCircle2 size={10} className="mt-1" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Meta Footer */}
                    <div className="p-4 bg-[#181B22] border-t border-[#22262E]">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#8A93A4]">
                            <span className="uppercase tracking-widest">Tactical HUD</span>
                            <span className="tabular-nums uppercase tracking-widest">
                                {new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Status Footer */}
            <footer className="px-6 py-2 bg-[#121418] border-t border-[#22262E] flex items-center justify-between text-[9px] font-mono">
                <div className="text-[#6A7382] uppercase font-bold tracking-widest">Kairon HUD // Ref: {targetId || 'Live'}</div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="text-[#8A93A4] font-bold uppercase">Sync Live</span>
                </div>
            </footer>
        </div>
    );
};
