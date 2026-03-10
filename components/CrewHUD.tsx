import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Program } from '../types';
import { formatDuration, timeToMinutes, minutesToTime } from '../utils/time';
import { Mic, Clock, User, Calendar, ExternalLink, ChevronRight, Share2, Timer, Sun, Moon, RefreshCw, Volume2, Lightbulb, Video, CheckCircle2, Activity } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export const CrewHUD: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [tick, setTick] = useState(0);

    // Convex Reactive Query
    const programData = useQuery(
        api.programs.getProgramBySlug,
        slug ? { slug } : "skip"
    );

    const programByIdData = useQuery(
        api.programs.getProgramById,
        !programData && slug ? { id: slug as any } : "skip"
    );

    const programRaw = programData || programByIdData;
    const acks = useQuery(api.programs.getAcknowledgements, programRaw ? { programId: (programRaw as any)._id } : "skip") || [];
    const acknowledge = useMutation(api.programs.acknowledgeCue);

    const program = programRaw ? {
        ...(programRaw as any),
        id: (programRaw as any)._id || (programRaw as any).id
    } as Program : null;

    // Live Ticker (Forces re-render every second when timer is active)
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (program?.isTimerActive) {
            interval = setInterval(() => {
                setTick(t => t + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [program?.isTimerActive, program?.id]);

    // Global Theme Sync (Force Dark for Tactical View)
    const isDarkMode = true;

    const nowTime = Date.now();
    const derivedSecondsElapsed = (program?.isTimerActive && program?.timerStartTimestamp)
        ? Math.max(0, Math.floor((nowTime - program.timerStartTimestamp) / 1000))
        : (program?.secondsElapsed || 0);

    const currentSlotIndex = program?.currentSlotIndex ?? 0;
    const currentSlot = program?.slots[currentSlotIndex];
    const nextSlot = program?.slots[currentSlotIndex + 1];

    const formatCountdown = (totalSeconds: number) => {
        const abs = Math.abs(totalSeconds);
        const mins = Math.floor(abs / 60);
        const secs = abs % 60;
        return `${totalSeconds < 0 ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const remainingSeconds = currentSlot ? (currentSlot.durationMinutes * 60) - derivedSecondsElapsed : 0;

    const [localAcks, setLocalAcks] = useState<Set<string>>(new Set());

    const handleAck = async (role: 'sound' | 'lighting' | 'video') => {
        if (!program || !currentSlot) return;
        const ackKey = `${currentSlot.id}-${role}`;
        setLocalAcks(prev => new Set(prev).add(ackKey));
        await acknowledge({
            programId: programRaw?._id as any,
            slotId: currentSlot.id,
            role,
        });
    };

    const isAcked = (role: string) => {
        if (!currentSlot) return false;
        return acks.some(a => a.slotId === currentSlot.id && a.role === role) || localAcks.has(`${currentSlot.id}-${role}`);
    };

    if (!program) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-slate-100 overflow-hidden flex flex-col font-mono">
            {/* Header / Meta */}
            <header className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-600 text-black text-[10px] font-black px-2 py-0.5 rounded tracking-tighter uppercase">Crew HUD</div>
                    <h1 className="text-sm font-bold truncate max-w-[300px] text-slate-400 uppercase tracking-widest">{program.title}</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${program.isTimerActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{program.isTimerActive ? 'Active' : 'Standby'}</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 tracking-widest">
                        {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-12 gap-px bg-slate-800 overflow-hidden">
                {/* Left: The "Now" Block */}
                <div className="col-span-12 lg:col-span-8 bg-black p-8 flex flex-col justify-between border-r border-slate-800">
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Current Session</div>
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none text-white uppercase italic">
                            {currentSlot?.title || 'No Active Slot'}
                        </h2>
                        {currentSlot?.speaker && (
                            <div className="text-xl text-slate-500 flex items-center gap-2 italic">
                                <User size={18} /> {currentSlot.speaker}
                            </div>
                        )}
                    </div>

                    <div className="flex items-baseline gap-4 py-8">
                        <div className={`text-[12rem] lg:text-[18rem] font-black leading-none tabular-nums tracking-tighter ${remainingSeconds < 60 ? 'text-rose-600 animate-pulse' : 'text-white'}`}>
                            {formatCountdown(remainingSeconds)}
                        </div>
                        <div className="text-3xl font-bold text-slate-700 uppercase tracking-widest">Remaining</div>
                    </div>

                    <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-1000 ease-linear"
                            style={{ width: `${Math.min(100, (derivedSecondsElapsed / ((currentSlot?.durationMinutes || 1) * 60)) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Right: Technical Cues & ACKs */}
                <div className="col-span-12 lg:col-span-4 flex flex-col bg-slate-950">
                    <div className="flex-1 overflow-y-auto">
                        {/* Active Cue Block */}
                        <div className="p-6 space-y-4 border-b border-slate-800/50">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Active Cue</span>
                                <Activity size={12} className="text-emerald-500" />
                            </div>
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5">
                                {currentSlot?.productionNotes ? (
                                    <p className="text-lg text-emerald-100/90 leading-tight italic font-medium">
                                        "{currentSlot.productionNotes}"
                                    </p>
                                ) : (
                                    <p className="text-slate-700 text-sm italic">No cues for current slot.</p>
                                )}
                            </div>
                        </div>

                        {/* Next Prep Block (Option B) */}
                        <div className="p-6 space-y-4 bg-amber-500/[0.02]">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">Upcoming Prep</span>
                                    <span className="text-[9px] text-slate-600 font-bold uppercase truncate max-w-[200px]">Next: {nextSlot?.title || 'End'}</span>
                                </div>
                                <Clock size={12} className="text-amber-500" />
                            </div>
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 relative overflow-hidden">
                                {nextSlot?.productionNotes ? (
                                    <p className="text-lg text-amber-100 leading-tight italic font-medium">
                                        "{nextSlot.productionNotes}"
                                    </p>
                                ) : (
                                    <p className="text-slate-700 text-sm italic">No preparation notes needed.</p>
                                )}
                                <div className="absolute top-0 right-0 h-1 w-12 bg-amber-500/20" />
                            </div>
                        </div>

                        {/* ACK Section */}
                        <div className="p-6 space-y-4 border-t border-slate-800/50">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Confirm Readiness</span>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleAck('sound')}
                                    className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${isAcked('sound') ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600'}`}
                                >
                                    <Volume2 size={20} className="mb-1" />
                                    <span className="text-[9px] font-black uppercase">Sound</span>
                                    {isAcked('sound') && <CheckCircle2 size={10} className="mt-1" />}
                                </button>
                                <button
                                    onClick={() => handleAck('lighting')}
                                    className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${isAcked('lighting') ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600'}`}
                                >
                                    <Lightbulb size={20} className="mb-1" />
                                    <span className="text-[9px] font-black uppercase">Lights</span>
                                    {isAcked('lighting') && <CheckCircle2 size={10} className="mt-1" />}
                                </button>
                                <button
                                    onClick={() => handleAck('video')}
                                    className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${isAcked('video') ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600'}`}
                                >
                                    <Video size={20} className="mb-1" />
                                    <span className="text-[9px] font-black uppercase">Video</span>
                                    {isAcked('video') && <CheckCircle2 size={10} className="mt-1" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Meta Footer */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-500 uppercase tracking-widest">Kairon HUD 2.0</span>
                            <span className="text-slate-600 tabular-nums uppercase tracking-widest">
                                {new Date().toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Status Footer */}
            <footer className="px-6 py-2 bg-slate-950 border-t border-slate-900 flex items-center justify-between">
                <div className="text-[9px] text-slate-700 uppercase font-black tracking-widest">Kairon Tactical HUD // Ref: {slug}</div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Sync Online</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
