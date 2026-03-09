import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Program, Slot } from '../types';
import { formatDuration } from '../utils/time';

interface FlightBridgeProps {
    program: Program;
    currentSlotIndex: number;
    isTimerActive: boolean;
    secondsElapsed: number;
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
        <div className="flex flex-col h-full bg-slate-950 text-white font-sans overflow-hidden border-l-4 border-indigo-600 shadow-2xl">
            {/* Minimal Header */}
            <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Flight Bridge</span>
                </div>
                <div className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                    {program.status.toUpperCase()}
                </div>
            </div>

            {/* Timer Core */}
            <div className="p-6 flex flex-col items-center">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1 truncate max-w-full">
                    {currentSlot.title}
                </div>
                <div className={`text-6xl font-mono font-black tabular-nums leading-none tracking-tighter transition-colors ${isOvertime ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                    {formatDuration(timeLeft)}
                </div>
                <div className="text-[10px] text-slate-500 mt-2 font-medium">
                    {currentSlot.speaker}
                </div>
            </div>

            {/* Primary Controls */}
            <div className="px-4 pb-4">
                <div className="flex justify-center items-center gap-4 mb-4">
                    <button
                        onClick={onPrev}
                        disabled={currentSlotIndex === 0}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all disabled:opacity-20"
                    >
                        <SkipBack size={20} />
                    </button>

                    <button
                        onClick={onToggleTimer}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95`}
                    >
                        {isTimerActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} className="ml-1" fill="currentColor" />}
                    </button>

                    <button
                        onClick={onNext}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                    >
                        <SkipForward size={20} />
                    </button>
                </div>

                {/* Sub-controls: Nudge & Hold */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <button onClick={() => onNudge(-1)} className="flex flex-col items-center justify-center py-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold">-1m</span>
                    </button>
                    <button onClick={() => onNudge(1)} className="flex flex-col items-center justify-center py-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold">+1m</span>
                    </button>
                    <button
                        onClick={onToggleHold}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${program.isOnHold ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-amber-500 hover:bg-slate-800'}`}
                    >
                        <Clock size={16} />
                        <span className="text-[8px] font-bold mt-1 uppercase">Hold</span>
                    </button>

                    {/* Hold to End Button */}
                    <button
                        onMouseDown={handleHoldStart}
                        onMouseUp={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                        onTouchStart={handleHoldStart}
                        onTouchEnd={handleHoldEnd}
                        className="relative flex flex-col items-center justify-center py-2 bg-rose-900/40 hover:bg-rose-900/60 rounded-xl border border-rose-500/30 text-rose-500 overflow-hidden select-none active:scale-[0.98] transition-transform"
                    >
                        <div
                            className="absolute bottom-0 left-0 h-full bg-rose-600/30 transition-all duration-75 pointer-events-none"
                            style={{ width: `${holdToEndProgress}%` }}
                        />
                        <AlertCircle size={16} />
                        <span className="text-[8px] font-bold mt-1 uppercase">End Event</span>
                    </button>
                </div>

                {/* Expansion Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400 group transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} size={14} />
                        Remaining Schedule
                    </div>
                    <span>{remainingSlots.length} items</span>
                </button>
            </div>

            {/* Scrollable Slot List */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${isExpanded ? 'max-h-[300px] opacity-100 p-4 pt-0' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-2">
                    {remainingSlots.length > 0 ? (
                        remainingSlots.map((slot, idx) => (
                            <div key={slot.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex justify-between items-center group hover:border-slate-700 transition-colors">
                                <div className="min-w-0 pr-4">
                                    <div className="text-[10px] font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{slot.title}</div>
                                    <div className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-widest">{slot.speaker}</div>
                                </div>
                                <div className="shrink-0 text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                    {slot.durationMinutes}m
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-slate-600 text-[10px] italic">
                            End of Program
                        </div>
                    )}
                </div>
            </div>

            {/* Style Injection Helper */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                * { box-sizing: border-box; }
            ` }} />
        </div>
    );
};
