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

    const isConvexId = programId && programId.length >= 19 && !programId.includes('-');
    const acks = useQuery(
        api.programs.getAcknowledgements,
        isConvexId ? { programId: programId as any } : "skip"
    ) || [];

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
            <div className="h-full w-28 bg-[#121418] border-r border-[#22262E] shadow-2xl flex flex-col items-center py-6 gap-6 pointer-events-auto animate-in slide-in-from-left-8 duration-500 overflow-y-auto no-scrollbar font-mono">
                {/* Header: Time Left & Session */}
                <div className="px-2 w-full flex flex-col items-center text-center gap-1">
                    <span className="text-[10px] font-bold text-[#8A93A4] uppercase tracking-wider">Time Left</span>
                    {currentSlot ? (
                        <div className={`font-mono text-xl font-bold tabular-nums ${isTimerActive ? (currentSlot.durationMinutes * 60 - elapsed < 0 ? 'text-[#EF4444] animate-pulse' : 'text-[#0EA5E9]') : 'text-[#6A7382]'}`}>
                            {Math.floor((currentSlot.durationMinutes * 60 - elapsed) / 60)}:
                            {String(Math.abs((currentSlot.durationMinutes * 60 - elapsed) % 60)).padStart(2, '0')}
                        </div>
                    ) : (
                        <div className="text-[#6A7382] font-mono text-xl">--:--</div>
                    )}
                    <div className="mt-1 px-2 py-0.5 bg-[#181B22] border border-[#22262E] rounded-md max-w-full">
                        <p className="text-[9px] font-bold text-[#E1E4EA] uppercase truncate w-20">
                            {currentSlotTitle || 'No Session'}
                        </p>
                    </div>
                </div>

                <div className="w-8 h-[1px] bg-[#22262E]" />

                {/* Status Section */}
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex flex-col items-center gap-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isAdminOnline ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30'}`}>
                            <Wifi size={18} />
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-[#8A93A4]">
                            {isAdminOnline ? 'Live' : 'Offline'}
                        </span>
                    </div>

                    {/* Crew Feedback (Vertical Stack) */}
                    <div className="flex flex-col items-center gap-2 w-full px-4">
                        <div className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-[#181B22] border border-[#22262E]">
                            <Volume2 size={12} className={isAcked('sound') ? 'text-[#10B981]' : 'text-[#6A7382] opacity-40'} />
                            <Lightbulb size={12} className={isAcked('lighting') ? 'text-[#10B981]' : 'text-[#6A7382] opacity-40'} />
                            <Video size={12} className={isAcked('video') ? 'text-[#10B981]' : 'text-[#6A7382] opacity-40'} />
                        </div>
                    </div>
                    {/* Play/Pause Control */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => onToggleTimer?.({ ...program, id: programId } as any, false, elapsed)}
                            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md ${isTimerActive ? 'bg-[#181B22] text-[#F59E0B] border border-[#F59E0B]/30' : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20'}`}
                        >
                            {isTimerActive ? <TimerIcon size={24} /> : <Play size={24} />}
                        </button>
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${isTimerActive ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                            {isTimerActive ? 'Pause' : 'Play'}
                        </span>
                    </div>
                </div>

                {/* Control Section */}
                <div className="mt-auto flex flex-col items-center gap-5 pb-4 w-full px-2">
                    {/* Nudge Controls */}
                    <div className="flex flex-col items-center bg-[#181B22] rounded-lg w-full p-1 gap-1 border border-[#22262E]">
                        <button
                            onClick={() => onNudge(1)}
                            className="w-full aspect-square flex items-center justify-center hover:bg-[#22262E] text-[#0EA5E9] rounded transition-all active:scale-90"
                            title="Nudge +1 min"
                        >
                            <Plus size={18} />
                        </button>
                        <span className="text-[8px] font-bold text-[#8A93A4] uppercase tracking-widest">Nudge</span>
                        <button
                            onClick={() => onNudge(-1)}
                            className="w-full aspect-square flex items-center justify-center hover:bg-[#22262E] text-[#8A93A4] hover:text-white rounded transition-all active:scale-90"
                            title="Nudge -1 min"
                        >
                            <Minus size={18} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        {programId && (
                            <button
                                onClick={() => onViewAnalytics(programId)}
                                className="p-3 bg-[#181B22] hover:bg-[#22262E] text-[#F59E0B] rounded-xl transition-all active:scale-95 border border-[#22262E] w-14 h-14 flex items-center justify-center shadow-md"
                                title="View Service Report"
                            >
                                <BarChart3 size={20} />
                            </button>
                        )}
                        <span className="text-[8px] font-bold text-[#F59E0B] uppercase tracking-widest">Report</span>
                    </div>

                    {/* End Event */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onMouseDown={() => setIsEnding(true)}
                            onMouseUp={() => setIsEnding(false)}
                            onMouseLeave={() => setIsEnding(false)}
                            onTouchStart={() => setIsEnding(true)}
                            onTouchEnd={() => setIsEnding(false)}
                            className="relative group overflow-hidden bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] w-14 h-14 rounded-xl flex items-center justify-center transition-all active:scale-90 select-none shadow-md"
                        >
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-[#EF4444]/40 origin-bottom transition-transform duration-75"
                                style={{ transform: `scaleY(${holdToEnd / 100})` }}
                            />
                            <Power size={20} className="relative z-10" />
                        </button>
                        <span className="text-[8px] font-bold text-[#EF4444] uppercase tracking-widest">End Event</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-[#121418] border border-[#22262E] shadow-2xl rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto animate-in slide-in-from-bottom-8 duration-500 font-sans">
            {/* Status Section */}
            <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center shrink-0 gap-2 px-3 py-1.5 bg-[#181B22] border border-[#22262E] rounded-md font-mono">
                    <span className={`w-2 h-2 rounded-full ${isAdminOnline ? 'bg-[#10B981] animate-tally' : 'bg-[#EF4444]'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#E1E4EA]">
                        {isAdminOnline ? 'Live Broadcast' : 'Sync Offline'}
                    </span>
                </div>
                <div className="hidden md:flex flex-col min-w-0">
                    <span className="text-[10px] font-mono font-bold text-[#8A93A4] uppercase tracking-wider">Current Session</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate max-w-[150px] font-mono">{currentSlotTitle || 'No Session'}</span>
                        {currentSlot && (
                            <span className={`font-mono text-sm font-bold tabular-nums ${isTimerActive ? (currentSlot.durationMinutes * 60 - elapsed < 0 ? 'text-[#EF4444] animate-pulse' : 'text-[#0EA5E9]') : 'text-[#8A93A4]'}`}>
                                {Math.floor((currentSlot.durationMinutes * 60 - elapsed) / 60)}:
                                {String(Math.abs((currentSlot.durationMinutes * 60 - elapsed) % 60)).padStart(2, '0')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Crew Feedback */}
                <div className="hidden lg:flex items-center shrink-0 gap-2.5 border-l border-[#22262E] pl-4 ml-2">
                    <div className={`p-1.5 rounded transition-all ${isAcked('sound') ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#181B22] text-[#6A7382] opacity-40'}`} title="Sound ACK">
                        <Volume2 size={13} />
                    </div>
                    <div className={`p-1.5 rounded transition-all ${isAcked('lighting') ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#181B22] text-[#6A7382] opacity-40'}`} title="Lighting ACK">
                        <Lightbulb size={13} />
                    </div>
                    <div className={`p-1.5 rounded transition-all ${isAcked('video') ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#181B22] text-[#6A7382] opacity-40'}`} title="Video ACK">
                        <Video size={13} />
                    </div>
                </div>
            </div>

            {/* Control Section */}
            <div className="flex items-center gap-2 shrink-0 font-mono">
                <div className="flex items-center bg-[#181B22] border border-[#22262E] rounded-md p-1">
                    <button
                        onClick={() => onNudge(-1)}
                        className="p-1.5 hover:bg-[#22262E] text-[#8A93A4] hover:text-white rounded transition-colors"
                        title="Nudge -1 min"
                    >
                        <Minus size={16} />
                    </button>
                    <div className="px-2.5 flex flex-col items-center">
                        <Timer size={13} className="text-[#0EA5E9] mb-0.5" />
                        <span className="text-[9px] font-bold text-[#8A93A4]">NUDGE</span>
                    </div>
                    <button
                        onClick={() => onNudge(1)}
                        className="p-1.5 hover:bg-[#22262E] text-[#8A93A4] hover:text-white rounded transition-colors"
                        title="Nudge +1 min"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {programId && (
                    <button
                        onClick={() => onViewAnalytics(programId)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#181B22] hover:bg-[#22262E] border border-[#22262E] text-[#F59E0B] rounded-md transition-colors shrink-0 text-xs font-bold"
                        title="View Service Report"
                    >
                        <BarChart3 size={16} />
                        <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider">Report</span>
                    </button>
                )}

                <div className="w-[1px] h-6 bg-[#22262E] mx-1" />
 
                {/* Play/Pause Control (Main HUD) */}
                <div className="flex flex-col items-center gap-1 mr-2 border-r border-[#22262E] pr-3">
                    <button
                        onClick={() => onToggleTimer?.({ ...program, id: programId } as any, false, elapsed)}
                        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                            isTimerActive
                                ? 'bg-[#181B22] text-[#F59E0B] border border-[#22262E]'
                                : 'bg-[#10B981] hover:bg-[#059669] text-white'
                        }`}
                    >
                        {isTimerActive ? <TimerIcon size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${isTimerActive ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                        {isTimerActive ? 'Pause' : 'Play'}
                    </span>
                </div>

                <button
                    onMouseDown={() => setIsEnding(true)}
                    onMouseUp={() => setIsEnding(false)}
                    onMouseLeave={() => setIsEnding(false)}
                    onTouchStart={() => setIsEnding(true)}
                    onTouchEnd={() => setIsEnding(false)}
                    className="relative group overflow-hidden bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] px-4 py-2 rounded-md font-bold text-xs flex items-center gap-2 transition-all active:scale-95 select-none shrink-0"
                >
                    {/* Progress Reveal */}
                    <div
                        className="absolute inset-0 bg-[#EF4444]/30 origin-left transition-transform duration-75"
                        style={{ transform: `scaleX(${holdToEnd / 100})` }}
                    />
                    <Power size={14} className="relative z-10" />
                    <span className="relative z-10 whitespace-nowrap">
                        {holdToEnd > 0 ? 'Hold...' : 'End Event'}
                    </span>
                </button>
            </div>
        </div>
    );
};
