import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Clock, ChevronDown, ChevronUp, AlertCircle, Sun, Moon } from 'lucide-react';
import { Program, Slot } from '../types';
import { formatDuration } from '../utils/time';

interface FlightBridgeProps {
    program: Program;
    currentSlotIndex: number;
    isTimerActive: boolean;
    secondsElapsed: number;
    isDarkMode: boolean;
    onToggleTheme: () => void;
    onToggleTimer: () => void;
    onToggleHold: () => void;
    onNext: () => void;
    onPrev: () => void;
    onNudge: (minutes: number) => void;
    onEndEvent: () => void;
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
    onEndEvent
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [holdToEndProgress, setHoldToEndProgress] = useState(0);
    const holdTimerRef = useRef<number | null>(null);

    const currentSlot = program.slots[currentSlotIndex];
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
                onEndEvent();
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

    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        };
    }, []);

    if (!currentSlot) return null;

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'} font-sans overflow-hidden border-l-4 border-indigo-600 shadow-2xl transition-colors duration-300`}>
            {/* Minimal Header */}
            <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'} flex justify-between items-center z-10 shrink-0`}>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse" />
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Flight Bridge</span>
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

                {/* THE TITANIC TIMER */}
                <div className={`text-[120px] font-mono font-black tabular-nums leading-none tracking-[-0.08em] transition-colors ${isOvertime ? 'text-rose-500 animate-pulse' : (isDarkMode ? 'text-white' : 'text-slate-900')}`}>
                    {formatDuration(timeLeft)}
                </div>

                <div className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'} font-bold uppercase tracking-[0.1em] mt-2`}>
                    {currentSlot.speaker || 'No Speaker'}
                </div>
            </div>

            {/* Tactical Controls */}
            <div className="px-4 pb-4 shrink-0 z-10">
                <div className="flex justify-center items-center gap-6 mb-4">
                    <button
                        onClick={onPrev}
                        disabled={currentSlotIndex === 0}
                        className={`p-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'} rounded-2xl border transition-all disabled:opacity-20`}
                    >
                        <SkipBack size={24} fill="currentColor" stroke="none" />
                    </button>

                    <button
                        onClick={onToggleTimer}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 active:scale-90`}
                    >
                        {isTimerActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="ml-1" fill="currentColor" />}
                    </button>

                    <button
                        onClick={onNext}
                        className={`p-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'} rounded-2xl border transition-all`}
                    >
                        <SkipForward size={24} fill="currentColor" stroke="none" />
                    </button>
                </div>

                {/* Sub-controls: Nudge & Hold */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <button onClick={() => onNudge(-1)} className={`flex flex-col items-center justify-center py-2 ${isDarkMode ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'} rounded-xl border`}>
                        <span className="text-[10px] font-black">-1M</span>
                    </button>
                    <button onClick={() => onNudge(1)} className={`flex flex-col items-center justify-center py-2 ${isDarkMode ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'} rounded-xl border`}>
                        <span className="text-[10px] font-black">+1M</span>
                    </button>
                    <button
                        onClick={onToggleHold}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${program.isOnHold ? 'bg-amber-600 border-amber-500 text-white' : (isDarkMode ? 'bg-slate-900 border-slate-800 text-amber-500 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-amber-700 hover:bg-slate-100')}`}
                    >
                        <Clock size={16} />
                        <span className="text-[8px] font-black mt-1 uppercase">Hold</span>
                    </button>

                    {/* Hold to End Button */}
                    <button
                        onMouseDown={handleHoldStart}
                        onMouseUp={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                        onTouchStart={handleHoldStart}
                        onTouchEnd={handleHoldEnd}
                        className={`relative flex flex-col items-center justify-center py-2 rounded-xl border select-none active:scale-[0.98] transition-all ${isDarkMode ? 'bg-rose-900/20 border-rose-500/20 text-rose-500 hover:bg-rose-900/40' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}
                    >
                        <div
                            className="absolute bottom-0 left-0 h-full bg-rose-600/20 transition-all duration-75 pointer-events-none"
                            style={{ width: `${holdToEndProgress}%` }}
                        />
                        <AlertCircle size={16} />
                        <span className="text-[8px] font-black mt-1 uppercase text-center">End Event</span>
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
