import React, { useState, useEffect } from 'react';
import { Power, Timer, Plus, Minus, Wifi, WifiOff, BarChart3, Volume2, Lightbulb, Video, Timer as TimerIcon, Play } from 'lucide-react';
import { useQuery } from '../hooks/useConvexMock';
import { api } from '../convex/_generated/api';
import { useTimerSync } from '../hooks/useTimerSync';

interface ProductionHUDProps {
    isTimerActive: boolean;
    isAdminOnline: boolean;
    onEndEvent: () => void;
    onNudge: (minutes: number) => void;
    onViewAnalytics: (id: string) => void;
    onToggleTimer?: (target?: any, force?: boolean, seconds?: number) => void;
    currentSlotTitle?: string;
    programId?: string;
    timerStartTimestamp: number | null;
    secondsElapsed?: number;
    isVertical?: boolean;
}

export const ProductionHUD: React.FC<ProductionHUDProps> = ({
    isTimerActive,
    isAdminOnline,
    onEndEvent,
    onNudge,
    onViewAnalytics,
    onToggleTimer,
    currentSlotTitle,
    programId,
    timerStartTimestamp,
    secondsElapsed = 0,
    isVertical = false
}) => {
    const elapsed = useTimerSync(timerStartTimestamp, isTimerActive, secondsElapsed);
    const [holdToEnd, setHoldToEnd] = useState(0);
    const [isEnding, setIsEnding] = useState(false);

    const acks = useQuery(api.programs.getAcknowledgements, programId ? { programId: programId as any } : "skip") || [];

    const program = useQuery(api.programs.getProgramById, programId ? { id: programId as any } : "skip");
    const currentSlot = program?.slots[program?.currentSlotIndex ?? 0];

    const isAcked = (role: string) => {
        return acks.some(a => a.slotId === currentSlot?.id && a.role === role);
    };

    useEffect(() => {
        let interval: number;
        if (isEnding && holdToEnd < 100) {
            interval = window.setInterval(() => {
                setHoldToEnd((prev) => Math.min(100, prev + 5));
            }, 50);
        } else if (!isEnding && holdToEnd > 0) {
            interval = window.setInterval(() => {
                setHoldToEnd((prev) => Math.max(0, prev - 10));
            }, 50);
        }

        if (holdToEnd >= 100) {
            onEndEvent();
            setHoldToEnd(0);
            setIsEnding(false);
        }

        return () => clearInterval(interval);
    }, [isEnding, holdToEnd, onEndEvent]);

    if (!programId) return null;

    if (isVertical) {
        return (
            <div className="h-full w-28 bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col items-center py-6 gap-6 pointer-events-auto animate-in slide-in-from-left-8 duration-500 overflow-y-auto no-scrollbar">
                {/* Header: Time Left & Session */}
                <div className="px-2 w-full flex flex-col items-center text-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Time Left</span>
                    {currentSlot ? (
                        <div className={`font-mono text-xl font-black ${isTimerActive ? (currentSlot.durationMinutes * 60 - elapsed < 0 ? 'text-rose-500 animate-pulse' : 'text-indigo-400') : 'text-slate-600'}`}>
                            {Math.floor((currentSlot.durationMinutes * 60 - elapsed) / 60)}:
                            {String(Math.abs((currentSlot.durationMinutes * 60 - elapsed) % 60)).padStart(2, '0')}
                        </div>
                    ) : (
                        <div className="text-slate-700 font-mono text-xl">--:--</div>
                    )}
                    <div className="mt-1 px-2 py-0.5 bg-slate-800 rounded-md max-w-full">
                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate w-20">
                            {currentSlotTitle || 'No Session'}
                        </p>
                    </div>
                </div>

                <div className="w-8 h-[1px] bg-slate-800/50" />

                {/* Status Section */}
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isAdminOnline ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                            <Wifi size={18} />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                            {isAdminOnline ? 'Live' : 'Offline'}
                        </span>
                    </div>

                    {/* Crew Feedback (Vertical Stack) */}
                    <div className="flex flex-col items-center gap-2 w-full px-4">
                        <div className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/30 grayscale">
                            <Volume2 size={12} className={isAcked('sound') ? 'text-emerald-500 opacity-100' : 'text-slate-600 opacity-30'} />
                            <Lightbulb size={12} className={isAcked('lighting') ? 'text-emerald-500 opacity-100' : 'text-slate-600 opacity-30'} />
                            <Video size={12} className={isAcked('video') ? 'text-emerald-500 opacity-100' : 'text-slate-600 opacity-30'} />
                        </div>
                    </div>
                    {/* Play/Pause Control (Centralized for Mobile) */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => onToggleTimer?.({ ...program, id: programId } as any, false, elapsed)}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg ${isTimerActive ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-emerald-600 text-white shadow-emerald-900/20'}`}
                        >
                            {isTimerActive ? <TimerIcon size={24} /> : <Play size={24} />}
                        </button>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isTimerActive ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {isTimerActive ? 'Pause' : 'Play'}
                        </span>
                    </div>
                </div>

                {/* Control Section */}
                <div className="mt-auto flex flex-col items-center gap-6 pb-4 w-full px-2">
                    {/* Nudge Controls (Vertical with Labels) */}
                    <div className="flex flex-col items-center bg-slate-800/50 rounded-2xl w-full p-1 gap-1 border border-slate-700/30">
                        <button
                            onClick={() => onNudge(1)}
                            className="w-full aspect-square flex items-center justify-center hover:bg-slate-700 text-indigo-400 hover:text-white rounded-xl transition-all active:scale-90"
                            title="Nudge +1 min"
                        >
                            <Plus size={20} />
                        </button>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nudge</span>
                        <button
                            onClick={() => onNudge(-1)}
                            className="w-full aspect-square flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all active:scale-90"
                            title="Nudge -1 min"
                        >
                            <Minus size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        {programId && (
                            <button
                                onClick={() => onViewAnalytics(programId)}
                                className="p-3 bg-slate-800/50 hover:bg-slate-800 text-amber-500 rounded-2xl transition-all hover:scale-105 active:scale-95 border border-slate-700/30 w-14 h-14 flex items-center justify-center shadow-lg shadow-amber-950/10"
                                title="View Service Report"
                            >
                                <BarChart3 size={20} />
                            </button>
                        )}
                        <span className="text-[8px] font-black text-amber-500/50 uppercase tracking-widest">Report</span>
                    </div>

                    {/* End Event (Square vertical reveal) */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onMouseDown={() => setIsEnding(true)}
                            onMouseUp={() => setIsEnding(false)}
                            onMouseLeave={() => setIsEnding(false)}
                            onTouchStart={() => setIsEnding(true)}
                            onTouchEnd={() => setIsEnding(false)}
                            className="relative group overflow-hidden bg-rose-600 hover:bg-rose-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 select-none shadow-lg shadow-rose-900/20"
                        >
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-rose-950 opacity-50 origin-bottom transition-transform duration-75"
                                style={{ transform: `scaleY(${holdToEnd / 100})` }}
                            />
                            <Power size={20} className="relative z-10" />
                        </button>
                        <span className="text-[8px] font-black text-rose-500/50 uppercase tracking-widest">End Event</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto animate-in slide-in-from-bottom-8 duration-500">
            {/* Status Section */}
            <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center shrink-0 gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                    <span className={`w-2 h-2 rounded-full ${isAdminOnline ? 'bg-indigo-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        {isAdminOnline ? 'Live Broadcast' : 'Sync Offline'}
                    </span>
                </div>
                <div className="hidden md:flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Current Session</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate max-w-[150px]">{currentSlotTitle || 'No Session'}</span>
                        {currentSlot && (
                            <span className={`font-mono text-sm font-bold ${isTimerActive ? (currentSlot.durationMinutes * 60 - elapsed < 0 ? 'text-rose-500' : 'text-indigo-400') : 'text-slate-500'}`}>
                                {Math.floor((currentSlot.durationMinutes * 60 - elapsed) / 60)}:
                                {String(Math.abs((currentSlot.durationMinutes * 60 - elapsed) % 60)).padStart(2, '0')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Crew Feedback */}
                <div className="hidden lg:flex items-center shrink-0 gap-3 border-l border-slate-800 pl-4 ml-2">
                    <div className={`p-1.5 rounded-lg transition-all ${isAcked('sound') ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-600 opacity-30'}`} title="Sound ACK">
                        <Volume2 size={14} />
                    </div>
                    <div className={`p-1.5 rounded-lg transition-all ${isAcked('lighting') ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-600 opacity-30'}`} title="Lighting ACK">
                        <Lightbulb size={14} />
                    </div>
                    <div className={`p-1.5 rounded-lg transition-all ${isAcked('video') ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-600 opacity-30'}`} title="Video ACK">
                        <Video size={14} />
                    </div>
                </div>
            </div>

            {/* Control Section */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-slate-800 rounded-xl p-1">
                    <button
                        onClick={() => onNudge(-1)}
                        className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="Nudge -1 min"
                    >
                        <Minus size={18} />
                    </button>
                    <div className="px-3 flex flex-col items-center">
                        <Timer size={14} className="text-indigo-500 mb-0.5" />
                        <span className="text-[10px] font-bold text-slate-500">NUDGE</span>
                    </div>
                    <button
                        onClick={() => onNudge(1)}
                        className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="Nudge +1 min"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                {programId && (
                    <button
                        onClick={() => onViewAnalytics(programId)}
                        className="flex items-center gap-2 p-2 hover:bg-slate-800 text-amber-500 rounded-xl transition-colors shrink-0"
                        title="View Service Report"
                    >
                        <BarChart3 size={20} />
                        <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Report</span>
                    </button>
                )}

                <div className="w-[1px] h-8 bg-slate-800 mx-2" />
 
                {/* Play/Pause Control (Main HUD) */}
                <div className="flex flex-col items-center gap-1 mr-2 border-r border-slate-800 pr-4">
                    <button
                        onClick={() => onToggleTimer?.({ ...program, id: programId } as any, false, elapsed)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isTimerActive ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'}`}
                    >
                        {isTimerActive ? <TimerIcon size={20} /> : <Play size={20} />}
                    </button>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${isTimerActive ? 'text-amber-500/50' : 'text-emerald-500'}`}>
                        {isTimerActive ? 'Pause' : 'Resume'}
                    </span>
                </div>

                <button
                    onMouseDown={() => setIsEnding(true)}
                    onMouseUp={() => setIsEnding(false)}
                    onMouseLeave={() => setIsEnding(false)}
                    onTouchStart={() => setIsEnding(true)}
                    onTouchEnd={() => setIsEnding(false)}
                    className="relative group overflow-hidden bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 select-none shrink-0"
                >
                    {/* Progress Reveal */}
                    <div
                        className="absolute inset-0 bg-rose-950 opacity-50 origin-left transition-transform duration-75"
                        style={{ transform: `scaleX(${holdToEnd / 100})` }}
                    />
                    <Power size={18} className="relative z-10" />
                    <span className="relative z-10 whitespace-nowrap">
                        {holdToEnd > 0 ? 'Hold...' : 'End Event'}
                    </span>
                </button>
            </div>
        </div>
    );
};
