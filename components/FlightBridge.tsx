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

    const acks = useQuery(api.programs.getAcknowledgements, { programId: program._id as any }) || [];

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
        localDoc.body.style.backgroundColor = isDarkMode ? '#020617' : '#ffffff'; // slate-950 or white
        localDoc.body.style.color = isDarkMode ? '#ffffff' : '#0f172a'; // white or slate-900
    }, [isDarkMode]);

    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        };
    }, []);

    if (!currentSlot) return null;

    return (
        <div ref={containerRef} className={`flex flex-col h-full ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'} font-sans overflow-hidden border-l-4 border-indigo-600 shadow-2xl transition-colors duration-300`}>
            {/* Minimal Header */}
            <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'} flex justify-between items-center z-10 shrink-0`}>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse" />
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Flight Bridge</span>
                </div>

                {/* Crew ACK Feedback */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${isAcked('sound') ? 'bg-emerald-500/20 text-emerald-500' : 'text-slate-500 opacity-30'}`} title="Sound ACK">
                        <Volume2 size={12} />
                        <span className="text-[8px] font-black uppercase">S</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${isAcked('lighting') ? 'bg-emerald-500/20 text-emerald-500' : 'text-slate-500 opacity-30'}`} title="Lighting ACK">
                        <Lightbulb size={12} />
                        <span className="text-[8px] font-black uppercase">L</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${isAcked('video') ? 'bg-emerald-500/20 text-emerald-500' : 'text-slate-500 opacity-30'}`} title="Video ACK">
                        <Video size={12} />
                        <span className="text-[8px] font-black uppercase">V</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleTheme}
                        className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'} transition-colors`}
                    >
                        {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                    <div className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                        {program.status.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Timer Hub - Massive Focus */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-0">
                {/* Slot Title - Marquee if long */}
                <div className="w-full mb-2 overflow-hidden relative fade-mask">
                    <div className={`marquee-container ${currentSlot.title.length > 25 ? 'animate-marquee' : 'text-center'}`}>
                        <div className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} text-[14px] font-black uppercase tracking-tight whitespace-nowrap px-4`}>
                            {currentSlot.title}
                        </div>
                    </div>
                </div>

                {/* THE TITANIC TIMER - Using inline styles for guaranteed scaling */}
                <div
                    className={`font-mono font-black tabular-nums leading-none tracking-[-0.08em] transition-colors ${isOvertime ? 'text-rose-500 animate-pulse' : (isDarkMode ? 'text-white' : 'text-slate-900')}`}
                    style={{
                        fontSize: 'min(100px, 25vw)', // Balanced "sweet spot" for -MM:SS
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900
                    }}
                >
                    {formatDuration(timeLeft)}
                </div>

                <div className={`text-[12px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} font-black uppercase tracking-[0.2em] mt-2`}>
                    {currentSlot.speaker || 'No Speaker'}
                </div>
            </div>

            {/* Tactical Controls */}
            <div className="px-4 pb-4 shrink-0 z-10">
                <div className="flex justify-center items-center gap-6 mb-4">
                    <button
                        onClick={() => onPrev(program.id)}
                        disabled={currentSlotIndex === 0}
                        className={`p-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'} rounded-2xl border transition-all disabled:opacity-20`}
                    >
                        <SkipBack size={24} fill="currentColor" stroke="none" />
                    </button>

                    <button
                        onClick={() => onToggleTimer(program, false, secondsElapsed)}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 active:scale-90`}
                    >
                        {isTimerActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="ml-1" fill="currentColor" />}
                    </button>

                    <button
                        onClick={() => onNext(program.id)}
                        className={`p-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'} rounded-2xl border transition-all`}
                    >
                        <SkipForward size={24} fill="currentColor" stroke="none" />
                    </button>
                </div>

                {/* Sub-controls: Row 1 - Nudges */}
                <div className="flex gap-2 mb-2 w-full">
                    <button onClick={() => onNudge(-1)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${isDarkMode ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'} rounded-xl border transition-colors shadow-sm`}>
                        <span className="text-[12px] font-black">-1M</span>
                    </button>
                    <button onClick={() => onNudge(1)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 ${isDarkMode ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'} rounded-xl border transition-colors shadow-sm`}>
                        <span className="text-[12px] font-black">+1M</span>
                    </button>
                </div>

                {/* Sub-controls: Row 2 - Hold & End */}
                <div className="flex gap-2 mb-2 w-full">
                    <button
                        onClick={() => onToggleHold(undefined, program.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all shadow-sm ${program.isOnHold ? 'bg-amber-600 border-amber-500 text-white' : (isDarkMode ? 'bg-slate-900 border-slate-800 text-amber-500 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-amber-600 hover:bg-slate-100')}`}
                    >
                        <Clock size={16} />
                        <span className="text-[10px] font-black uppercase">Hold</span>
                    </button>

                    <button
                        onMouseDown={handleHoldStart}
                        onMouseUp={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                        onTouchStart={handleHoldStart}
                        onTouchEnd={handleHoldEnd}
                        className={`flex-1 relative flex items-center justify-center gap-2 py-2.5 rounded-xl border select-none active:scale-[0.98] transition-all shadow-sm overflow-hidden shrink-0 ${isDarkMode ? 'bg-rose-900/20 border-rose-500/20 text-rose-500 hover:bg-rose-900/40' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}
                    >
                        <div
                            className="absolute bottom-0 left-0 h-full bg-rose-600/20 transition-all duration-75 pointer-events-none"
                            style={{ width: `${holdToEndProgress}%` }}
                        />
                        <AlertCircle size={16} className="shrink-0" />
                        <span className="text-[10px] font-black uppercase whitespace-nowrap">End Event</span>
                    </button>
                </div>

                {/* Sub-controls: Row 3 - Auto/Manual Toggle */}
                <div className="mb-4">
                    <button
                        onClick={onToggleManualMode}
                        className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl border transition-all shadow-md ${isManualMode
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                            : (isDarkMode ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-indigo-600 hover:bg-slate-100')}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isManualMode ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'}`} />
                        <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                            {isManualMode ? 'Manual Advance Mode' : 'Auto Advance Mode'}
                        </span>
                    </button>
                </div>

                {/* Expansion Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-2 ${isDarkMode ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'} rounded-lg text-[10px] font-bold uppercase tracking-wider group transition-colors`}
                >
                    <div className="flex items-center gap-2">
                        <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} size={14} />
                        Remaining Schedule
                    </div>
                    <span>{remainingSlots.length} Items</span>
                </button>
            </div>

            {/* Scrollable Slot List */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${isExpanded ? 'max-h-[300px] opacity-100 p-4 pt-0' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-2">
                    {remainingSlots.length > 0 ? (
                        remainingSlots.map((slot, idx) => (
                            <div key={slot.id} className={`p-3 ${isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:border-slate-200'} border rounded-xl flex justify-between items-center group transition-colors`}>
                                <div className="min-w-0 pr-4">
                                    <div className={`text-[10px] font-bold ${isDarkMode ? 'text-white group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-indigo-600'} transition-colors truncate`}>{slot.title}</div>
                                    <div className={`text-[8px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} mt-0.5 uppercase tracking-widest`}>{slot.speaker}</div>
                                </div>
                                <div className={`shrink-0 text-[10px] font-mono font-bold ${isDarkMode ? 'text-slate-400 bg-slate-800' : 'text-slate-600 bg-slate-200'} px-2 py-1 rounded`}>
                                    {slot.durationMinutes}M
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={`py-8 text-center ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} text-[10px] italic`}>
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
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 10px; opacity: 0.3; }
                * { box-sizing: border-box; }
            ` }} />
        </div>
    );
};
