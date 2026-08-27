import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Clock, ChevronDown, ChevronUp, AlertCircle, Sun, Moon } from 'lucide-react';
import { Program, Slot } from '../types';
import { formatDuration } from '../utils/time';
import { useQuery } from '../hooks/useConvexMock';
import { api } from '../convex/_generated/api';
import { Volume2, Lightbulb, Video } from 'lucide-react';

interface FlightBridgeProps {
    program: Program;
    currentSlotIndex: number;
    isTimerActive: boolean;
    secondsElapsed: number;
    isDarkMode: boolean;
    onToggleTheme: () => void;
    onToggleTimer: (target?: Program, force?: boolean, seconds?: number) => void;
    onToggleHold: (nextState?: boolean, targetId?: string) => void;
    onNext: (targetId?: string) => void;
    onPrev: (targetId?: string) => void;
    onNudge: (minutes: number) => void;
    onEndEvent: (targetId?: string) => void;
    isManualMode: boolean;
    onToggleManualMode: () => void;
}

export const FlightBridge: React.FC<FlightBridgeProps> = ({
    program,
    currentSlotIndex,
    isTimerActive,
    secondsElapsed,
    isDarkMode,
    onToggleTheme,
    onToggleTimer,
    onToggleHold,
    onNext,
    onPrev,
    onNudge,
    onEndEvent,
    isManualMode,
    onToggleManualMode
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [holdToEndProgress, setHoldToEndProgress] = useState(0);
    const holdTimerRef = useRef<number | null>(null);

    const isConvexId = program.id && program.id.length >= 19 && !program.id.includes('-');
    const acks = useQuery(
        api.programs.getAcknowledgements,
        isConvexId ? { programId: program.id as any } : "skip"
    ) || [];

    const currentSlot = program.slots[currentSlotIndex];

    const isAcked = (role: string) => {
        return acks.some(a => a.slotId === currentSlot?.id && a.role === role);
    };
    const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
    const timeLeft = durationSeconds - secondsElapsed;
    const isOvertime = timeLeft < 0;

    const remainingSlots = program.slots.slice(currentSlotIndex + 1);

    // Hold to End Event Logic
    const handleHoldStart = () => {
        const startTime = Date.now();
        holdTimerRef.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(100, (elapsed / 2000) * 100);
            setHoldToEndProgress(progress);
            if (progress >= 100) {
                if (holdTimerRef.current) clearInterval(holdTimerRef.current);
                onEndEvent(program.id);
                setHoldToEndProgress(0);
            }
        }, 50);
    };

    const handleHoldEnd = () => {
        if (holdTimerRef.current) {
            clearInterval(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        setHoldToEndProgress(0);
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const marqueeRef = useRef<HTMLDivElement>(null);

    // Sync theme to PiP window body
    useEffect(() => {
        if (!containerRef.current) return;
        // Ensure the body of the window this component is rendered in has the correct theme class
        const localDoc = containerRef.current.ownerDocument;
        localDoc.body.classList.toggle('dark', isDarkMode);
        localDoc.body.style.backgroundColor = isDarkMode ? '#090A0C' : '#F8FAFC';
        localDoc.body.style.color = isDarkMode ? '#FFFFFF' : '#0F172A';
    }, [isDarkMode]);

    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        };
    }, []);

    if (!currentSlot) return null;

    return (
        <div ref={containerRef} className={`flex flex-col h-full ${isDarkMode ? 'bg-[#090A0C] text-white' : 'bg-[#F8FAFC] text-slate-900'} font-sans overflow-hidden border-l-4 border-[#0EA5E9] shadow-2xl transition-colors duration-200`}>
            {/* Minimal Header */}
            <div className={`px-4 py-2.5 border-b ${isDarkMode ? 'border-[#22262E] bg-[#121418]' : 'border-slate-200 bg-white'} flex justify-between items-center z-10 shrink-0`}>
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-[#181B22] border border-[#2D333F] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-pulse" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'text-[#8A93A4]' : 'text-slate-600'}`}>Flight Bridge</span>
                </div>

                {/* Crew ACK Feedback */}
                <div className="flex items-center gap-2.5">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${isAcked('sound') ? 'bg-[#10B981]/20 text-[#10B981]' : (isDarkMode ? 'text-[#6A7382] opacity-40' : 'text-slate-400')}`} title="Sound ACK">
                        <Volume2 size={11} />
                        <span className="text-[8px] font-mono font-bold uppercase">S</span>
                    </div>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${isAcked('lighting') ? 'bg-[#10B981]/20 text-[#10B981]' : (isDarkMode ? 'text-[#6A7382] opacity-40' : 'text-slate-400')}`} title="Lighting ACK">
                        <Lightbulb size={11} />
                        <span className="text-[8px] font-mono font-bold uppercase">L</span>
                    </div>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${isAcked('video') ? 'bg-[#10B981]/20 text-[#10B981]' : (isDarkMode ? 'text-[#6A7382] opacity-40' : 'text-slate-400')}`} title="Video ACK">
                        <Video size={11} />
                        <span className="text-[8px] font-mono font-bold uppercase">V</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleTheme}
                        className={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-[#181B22] text-[#8A93A4]' : 'hover:bg-slate-200 text-slate-600'} transition-colors`}
                    >
                        {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
                    </button>
                    <div className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                        program.status === 'live' 
                            ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30' 
                            : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                    }`}>
                        {program.status.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Timer Hub - Massive Focus */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-0">
                {/* Slot Title - Marquee if long */}
                <div className="w-full mb-1 overflow-hidden relative fade-mask">
                    <div className={`marquee-container ${currentSlot.title.length > 25 ? 'animate-marquee' : 'text-center'}`}>
                        <div className={`${isDarkMode ? 'text-[#0EA5E9]' : 'text-[#0284C7]'} text-[13px] font-mono font-bold uppercase tracking-tight whitespace-nowrap px-4`}>
                            {currentSlot.title}
                        </div>
                    </div>
                </div>

                {/* THE TITANIC TIMER */}
                <div
                    className={`font-mono font-bold tabular-nums leading-none tracking-tight select-none transition-colors ${isOvertime ? 'text-[#EF4444] animate-pulse' : (isDarkMode ? 'text-white' : 'text-slate-900')}`}
                    style={{
                        fontSize: 'min(90px, 24vw)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {formatDuration(timeLeft)}
                </div>

                <div className={`text-[11px] font-mono ${isDarkMode ? 'text-[#8A93A4]' : 'text-slate-600'} font-semibold uppercase tracking-wider mt-1.5`}>
                    {currentSlot.speaker || 'No Speaker Assigned'}
                </div>
            </div>

            {/* Tactical Controls */}
            <div className="px-4 pb-3 shrink-0 z-10">
                <div className="flex justify-center items-center gap-4 mb-3">
                    <button
                        onClick={() => onPrev(program.id)}
                        disabled={currentSlotIndex === 0}
                        className={`p-3 rounded-lg border transition-all disabled:opacity-30 ${isDarkMode ? 'bg-[#181B22] border-[#22262E] hover:bg-[#22262E] text-white' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800 shadow-sm'}`}
                        title="Previous Slot"
                    >
                        <SkipBack size={18} fill="currentColor" stroke="none" />
                    </button>

                    <button
                        onClick={() => onToggleTimer(program, false, secondsElapsed)}
                        className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
                            isTimerActive
                                ? 'bg-[#1C2028] hover:bg-[#252B37] text-white border border-[#2D333F]'
                                : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20'
                        }`}
                        title={isTimerActive ? "Pause Timer" : "Start Timer"}
                    >
                        {isTimerActive ? <Pause size={30} fill="currentColor" /> : <Play size={30} className="ml-0.5" fill="currentColor" />}
                    </button>

                    <button
                        onClick={() => onNext(program.id)}
                        className={`p-3 rounded-lg border transition-all ${isDarkMode ? 'bg-[#181B22] border-[#22262E] hover:bg-[#22262E] text-white' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800 shadow-sm'}`}
                        title="Next Slot"
                    >
                        <SkipForward size={18} fill="currentColor" stroke="none" />
                    </button>
                </div>

                {/* Sub-controls: Row 1 - Nudges */}
                <div className="flex gap-2 mb-2 w-full font-mono">
                    <button onClick={() => onNudge(-1)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-bold transition-all shadow-sm ${isDarkMode ? 'bg-[#181B22] hover:bg-[#22262E] border-[#22262E] text-[#8A93A4] hover:text-white' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'}`}>
                        <span>-1 MIN</span>
                    </button>
                    <button onClick={() => onNudge(1)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-bold transition-all shadow-sm ${isDarkMode ? 'bg-[#181B22] hover:bg-[#22262E] border-[#22262E] text-[#8A93A4] hover:text-white' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'}`}>
                        <span>+1 MIN</span>
                    </button>
                </div>

                {/* Sub-controls: Row 2 - Hold & End */}
                <div className="flex gap-2 mb-2 w-full font-mono">
                    <button
                        onClick={() => onToggleHold(undefined, program.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-bold transition-all shadow-sm ${program.isOnHold ? 'bg-[#F59E0B] border-[#F59E0B] text-black' : (isDarkMode ? 'bg-[#181B22] border-[#22262E] text-[#F59E0B] hover:bg-[#22262E]' : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-100')}`}
                    >
                        <Clock size={13} />
                        <span className="uppercase">Hold</span>
                    </button>

                    <button
                        onMouseDown={handleHoldStart}
                        onMouseUp={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                        onTouchStart={handleHoldStart}
                        onTouchEnd={handleHoldEnd}
                        className={`flex-1 relative flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-bold select-none active:scale-[0.98] transition-all shadow-sm overflow-hidden shrink-0 ${isDarkMode ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}
                    >
                        <div
                            className="absolute bottom-0 left-0 h-full bg-[#EF4444]/20 transition-all duration-75 pointer-events-none"
                            style={{ width: `${holdToEndProgress}%` }}
                        />
                        <AlertCircle size={13} className="shrink-0" />
                        <span className="uppercase whitespace-nowrap">End Event</span>
                    </button>
                </div>

                {/* Sub-controls: Row 3 - Auto/Manual Toggle */}
                <div className="mb-2">
                    <button
                        onClick={onToggleManualMode}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-md border font-mono text-xs font-bold transition-all shadow-sm ${isManualMode
                            ? 'bg-[#181B22] border-[#2D333F] text-[#0EA5E9]'
                            : (isDarkMode ? 'bg-[#181B22] border-[#22262E] text-[#10B981] hover:bg-[#22262E]' : 'bg-white border-slate-200 text-[#059669] hover:bg-slate-100')}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isManualMode ? 'bg-[#0EA5E9]' : 'bg-[#10B981] animate-tally'}`} />
                        <span className="uppercase tracking-wider">
                            {isManualMode ? 'Manual Advance Mode' : 'Auto Advance Mode'}
                        </span>
                    </button>
                </div>

                {/* Expansion Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${isDarkMode ? 'bg-[#121418] hover:bg-[#181B22] text-[#8A93A4]' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                >
                    <div className="flex items-center gap-1.5">
                        <ChevronDown className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} size={12} />
                        Remaining Schedule
                    </div>
                    <span>{remainingSlots.length} Items</span>
                </button>
            </div>

            {/* Scrollable Slot List */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${isExpanded ? 'max-h-[220px] opacity-100 p-3 pt-0' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-1.5 font-mono">
                    {remainingSlots.length > 0 ? (
                        remainingSlots.map((slot) => (
                            <div key={slot.id} className={`p-2.5 rounded-md border flex justify-between items-center transition-colors ${isDarkMode ? 'bg-[#121418] border-[#22262E]' : 'bg-white border-slate-200'}`}>
                                <div className="min-w-0 pr-3">
                                    <div className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{slot.title}</div>
                                    <div className={`text-[9px] uppercase tracking-wider ${isDarkMode ? 'text-[#8A93A4]' : 'text-slate-500'}`}>{slot.speaker || 'General'}</div>
                                </div>
                                <div className={`shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isDarkMode ? 'text-[#0EA5E9] bg-[#181B22]' : 'text-slate-700 bg-slate-100'}`}>
                                    {slot.durationMinutes}m
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={`py-4 text-center font-mono text-[10px] italic ${isDarkMode ? 'text-[#6A7382]' : 'text-slate-400'}`}>
                            End of Program
                        </div>
                    )}
                </div>
            </div>

            {/* Style Injection Helper */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(10%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    display: inline-block;
                    animation: marquee 10s linear infinite;
                    padding-left: 20px;
                }
                .marquee-container {
                    width: 100%;
                }
                .fade-mask {
                    -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
                    mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #0EA5E9; border-radius: 10px; opacity: 0.4; }
                * { box-sizing: border-box; }
            ` }} />
        </div>
    );
};
