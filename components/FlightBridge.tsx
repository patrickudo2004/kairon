import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, Pause, SkipForward, SkipBack, Clock, ChevronDown, ChevronUp, 
    AlertCircle, Sun, Moon, X, List, FastForward, 
    Music, Mic, BookOpen, Flame, Coffee, Sparkles, Radio, ListMusic,
    Volume2, Lightbulb, Video 
} from 'lucide-react';
import { Program, Slot } from '../types';
import { formatDuration, timeToMinutes, minutesToTime } from '../utils/time';
import { useQuery } from '../hooks/useConvexMock';
import { api } from '../convex/_generated/api';
import { HoldToConfirmButton } from './HoldToConfirmButton';

const getSlotTypeIcon = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('worship') || t.includes('praise') || t.includes('music') || t.includes('hymn')) {
        return <Music size={11} className="text-[#38BDF8]" />;
    }
    if (t.includes('sermon') || t.includes('word') || t.includes('talk') || t.includes('keynote') || t.includes('preach')) {
        return <Mic size={11} className="text-[#10B981]" />;
    }
    if (t.includes('bible') || t.includes('scripture') || t.includes('reading')) {
        return <BookOpen size={11} className="text-[#F59E0B]" />;
    }
    if (t.includes('prayer') || t.includes('intercession') || t.includes('supplication')) {
        return <Flame size={11} className="text-[#EC4899]" />;
    }
    if (t.includes('offer') || t.includes('giving') || t.includes('tithe')) {
        return <Sparkles size={11} className="text-[#A855F7]" />;
    }
    if (t.includes('break') || t.includes('lunch') || t.includes('transition')) {
        return <Coffee size={11} className="text-[#A1A1AA]" />;
    }
    return <Radio size={11} className="text-[#0EA5E9]" />;
};

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
    const containerRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    const isConvexId = program.id && program.id.length >= 19 && !program.id.includes('-');
    const acks = useQuery(
        api.programs.getAcknowledgements,
        isConvexId ? { programId: program.id as any } : "skip"
    ) || [];

    const [localAcks, setLocalAcks] = useState<Set<string>>(new Set());

    useEffect(() => {
        const channel = new BroadcastChannel('kairon_acks');
        const handleAckMsg = (e: MessageEvent) => {
            if (e.data && e.data.type === 'crew_ack' && e.data.slotId && e.data.role) {
                setLocalAcks(prev => new Set(prev).add(`${e.data.slotId}-${e.data.role}`));
            }
        };
        channel.addEventListener('message', handleAckMsg);
        return () => {
            channel.removeEventListener('message', handleAckMsg);
            channel.close();
        };
    }, []);

    const currentSlot = program.slots[currentSlotIndex];
    const nextSlot = program.slots[currentSlotIndex + 1];

    const isAcked = (role: string) => {
        if (currentSlot && localAcks.has(`${currentSlot.id}-${role}`)) return true;
        return acks.some(a => a.slotId === currentSlot?.id && a.role === role);
    };

    const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
    const timeLeft = durationSeconds - secondsElapsed;
    const isOvertime = timeLeft < 0;

    const remainingSlots = program.slots.slice(currentSlotIndex + 1);

    // MCR Hard Cutoff Telemetry
    const [wallClockSeconds, setWallClockSeconds] = useState(() => {
        const d = new Date();
        return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const d = new Date();
            setWallClockSeconds(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const totalPlannedMinutes = program.slots.reduce((acc, s) => acc + s.durationMinutes, 0);
    const cutoffMinutes = program.endTime 
        ? timeToMinutes(program.endTime) 
        : (timeToMinutes(program.startTime || '09:00') + totalPlannedMinutes);
    const cutoffSeconds = cutoffMinutes * 60;
    const mcrSecondsRemaining = cutoffSeconds - wallClockSeconds;

    // Sync theme to PiP window body
    useEffect(() => {
        if (!containerRef.current) return;
        const localDoc = containerRef.current.ownerDocument;
        localDoc.body.classList.toggle('dark', isDarkMode);
        localDoc.body.style.backgroundColor = isDarkMode ? '#090A0C' : '#F1F5F9';
        localDoc.body.style.color = isDarkMode ? '#FFFFFF' : '#0F172A';
        localDoc.body.style.margin = '0';
        localDoc.body.style.height = '100%';
        localDoc.body.style.overflow = 'hidden';
    }, [isDarkMode]);

    // Click outside listener for the Rundown Drawer in the PiP window
    useEffect(() => {
        if (!isExpanded || !containerRef.current) return;
        const localDoc = containerRef.current.ownerDocument;
        const handleOutsideClick = (e: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        };
        localDoc.addEventListener('mousedown', handleOutsideClick);
        return () => {
            localDoc.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isExpanded]);

    if (!currentSlot) return null;

    return (
        <div 
            ref={containerRef} 
            className={`flex flex-col h-full ${
                isDarkMode ? 'bg-[#090A0C] text-white' : 'bg-slate-50 text-slate-900'
            } font-sans overflow-hidden border-l-4 ${
                program.isOnHold ? 'border-amber-500' : (isOvertime ? 'border-rose-500' : 'border-[#0EA5E9]')
            } shadow-2xl transition-colors duration-200 relative select-none`}
        >
            {/* Top Telemetry Header */}
            <div className={`px-3 py-2 border-b ${
                isDarkMode ? 'border-[#22262E] bg-[#121418]' : 'border-slate-200 bg-white'
            } flex justify-between items-center z-10 shrink-0`}>
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-[#181B22] border border-slate-300 dark:border-[#2D333F] flex items-center justify-center shrink-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                            program.isOnHold ? 'bg-amber-500 animate-pulse' : (isTimerActive ? 'bg-[#10B981] animate-tally' : 'bg-[#0EA5E9]')
                        }`} />
                    </div>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider truncate ${
                        isDarkMode ? 'text-[#8A93A4]' : 'text-slate-600'
                    }`}>
                        Flight Bridge
                    </span>
                </div>

                {/* Tactical Crew ACKs */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono font-bold ${
                        isAcked('sound') ? 'bg-[#10B981]/20 text-[#10B981]' : (isDarkMode ? 'text-[#6A7382] opacity-40' : 'text-slate-400 opacity-60')
                    }`} title="Sound Crew Ack">
                        <Volume2 size={11} />
                        <span>S</span>
                    </div>
                    <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono font-bold ${
                        isAcked('lighting') ? 'bg-[#10B981]/20 text-[#10B981]' : (isDarkMode ? 'text-[#6A7382] opacity-40' : 'text-slate-400 opacity-60')
                    }`} title="Lighting Crew Ack">
                        <Lightbulb size={11} />
                        <span>L</span>
                    </div>
                    <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono font-bold ${
                        isAcked('video') ? 'bg-[#10B981]/20 text-[#10B981]' : (isDarkMode ? 'text-[#6A7382] opacity-40' : 'text-slate-400 opacity-60')
                    }`} title="Video Crew Ack">
                        <Video size={11} />
                        <span>V</span>
                    </div>
                </div>

                {/* Theme & Status */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={onToggleTheme}
                        className={`p-1 rounded-md transition-colors ${
                            isDarkMode ? 'hover:bg-[#181B22] text-[#8A93A4]' : 'hover:bg-slate-100 text-slate-700 bg-slate-100/60'
                        }`}
                        title="Toggle Light/Dark Theme"
                    >
                        {isDarkMode ? <Sun size={12} /> : <Moon size={12} />}
                    </button>
                    <div className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                        program.isOnHold 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : (program.status === 'live' 
                                ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30' 
                                : 'bg-slate-100 dark:bg-[#1C2028] text-slate-600 dark:text-[#8A93A4] border-slate-300 dark:border-[#2D333F]')
                    }`}>
                        {program.isOnHold ? 'HOLD' : program.status.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Main Stage & Telemetry Hub */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 relative min-h-0">
                {/* Active Slot Title */}
                <div className="w-full mb-0.5 overflow-hidden text-center">
                    <div className="text-[13px] font-mono font-bold uppercase tracking-tight text-[#0EA5E9] truncate px-2">
                        {currentSlot.title}
                    </div>
                    <div className={`text-[10px] font-mono font-semibold uppercase tracking-wider truncate ${
                        isDarkMode ? 'text-[#8A93A4]' : 'text-slate-500'
                    }`}>
                        {currentSlot.speaker || 'No Speaker Assigned'}
                    </div>
                </div>

                {/* THE TITANIC COUNTDOWN CLOCK */}
                <div
                    className={`font-mono font-black tabular-nums leading-none tracking-tight select-none my-1 transition-colors ${
                        program.isOnHold
                            ? 'text-amber-500'
                            : isOvertime 
                                ? 'text-[#EF4444] animate-pulse' 
                                : isTimerActive
                                    ? (isDarkMode ? 'text-white' : 'text-slate-900')
                                    : 'text-slate-400 dark:text-slate-500'
                    }`}
                    style={{
                        fontSize: 'min(76px, 20vw)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {formatDuration(timeLeft)}
                </div>

                {/* Dedicated Broadcast "UP NEXT" & MCR Cutoff Telemetry Bar */}
                <div className={`w-full max-w-[320px] px-2.5 py-1 rounded border text-[10px] font-mono flex items-center justify-between gap-2 shadow-xs ${
                    isDarkMode ? 'bg-[#121418] border-[#22262E] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-[#6A7382] shrink-0">NEXT:</span>
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                            {nextSlot ? nextSlot.title : 'End of Rundown'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-[#0EA5E9]">
                            {nextSlot ? `${nextSlot.durationMinutes}m` : '0m'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            mcrSecondsRemaining <= 0
                                ? 'bg-[#EF4444]/20 text-[#EF4444] animate-pulse'
                                : mcrSecondsRemaining <= 600
                                    ? 'bg-[#F59E0B]/20 text-[#F59E0B] animate-pulse'
                                    : 'bg-slate-200 dark:bg-[#1E222A] text-slate-500 dark:text-[#8A93A4]'
                        }`} title={`MCR Hard Broadcast Cutoff: ${minutesToTime(cutoffMinutes, '12h')}`}>
                            MCR {mcrSecondsRemaining <= 0 ? `-${formatDuration(Math.abs(mcrSecondsRemaining))}` : formatDuration(mcrSecondsRemaining)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tactical Control Console */}
            <div className={`px-4 pb-3 pt-1 shrink-0 z-10 border-t ${isDarkMode ? 'border-[#1C2028] bg-[#090A0C]' : 'border-slate-200 bg-slate-50'}`}>
                {/* Hero Transport Controls */}
                <div className="flex justify-center items-center gap-3 mb-2.5">
                    <button
                        onClick={() => onPrev(program.id)}
                        disabled={currentSlotIndex === 0}
                        className={`p-2.5 rounded-lg border transition-all disabled:opacity-30 ${
                            isDarkMode 
                                ? 'bg-[#181B22] border-[#22262E] hover:bg-[#22262E] text-white' 
                                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800 shadow-xs'
                        }`}
                        title="Previous Slot"
                    >
                        <SkipBack size={16} fill="currentColor" stroke="none" />
                    </button>

                    {/* Master Play / Pause Button with High Contrast in Both Modes */}
                    <button
                        onClick={() => onToggleTimer(program, false, secondsElapsed)}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
                            isTimerActive
                                ? (isDarkMode 
                                    ? 'bg-[#1C2028] hover:bg-[#252B37] text-white border border-[#2D333F]' 
                                    : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 shadow-md')
                                : (isDarkMode 
                                    ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/25' 
                                    : 'bg-[#059669] hover:bg-[#047857] text-white shadow-md border border-[#047857]')
                        }`}
                        title={isTimerActive ? "Pause Timer" : "Start Event"}
                    >
                        {isTimerActive ? <Pause size={26} fill="currentColor" /> : <Play size={26} className="ml-0.5" fill="currentColor" />}
                    </button>

                    <button
                        onClick={() => onNext(program.id)}
                        disabled={currentSlotIndex >= program.slots.length - 1}
                        className={`p-2.5 rounded-lg border transition-all disabled:opacity-30 ${
                            isDarkMode 
                                ? 'bg-[#181B22] border-[#22262E] hover:bg-[#22262E] text-white' 
                                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800 shadow-xs'
                        }`}
                        title="Next Slot"
                    >
                        <SkipForward size={16} fill="currentColor" stroke="none" />
                    </button>
                </div>

                {/* Sub-controls: Nudges & Hold / End */}
                <div className="grid grid-cols-4 gap-1.5 mb-2 font-mono text-[11px] font-bold">
                    <button 
                        onClick={() => onNudge(-1)} 
                        className={`py-1.5 rounded border transition-all flex items-center justify-center ${
                            isDarkMode ? 'bg-[#181B22] hover:bg-[#22262E] border-[#22262E] text-[#8A93A4] hover:text-white' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
                        }`}
                        title="Deduct 1 minute from current slot"
                    >
                        -1m
                    </button>
                    <button 
                        onClick={() => onNudge(1)} 
                        className={`py-1.5 rounded border transition-all flex items-center justify-center ${
                            isDarkMode ? 'bg-[#181B22] hover:bg-[#22262E] border-[#22262E] text-[#8A93A4] hover:text-white' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
                        }`}
                        title="Add 1 minute to current slot"
                    >
                        +1m
                    </button>
                    <button
                        onClick={() => onToggleHold(undefined, program.id)}
                        className={`py-1.5 rounded border transition-all flex items-center justify-center gap-1 ${
                            program.isOnHold 
                                ? 'bg-amber-500 border-amber-500 text-black font-extrabold shadow-sm' 
                                : (isDarkMode ? 'bg-[#181B22] border-[#22262E] text-amber-500 hover:bg-[#22262E]' : 'bg-white border-slate-300 text-amber-600 hover:bg-slate-100 shadow-xs')
                        }`}
                        title="Toggle Hold (Standby Freeze)"
                    >
                        <Clock size={11} />
                        <span>HOLD</span>
                    </button>
                    <HoldToConfirmButton
                        durationMs={2000}
                        onConfirm={() => onEndEvent(program.id)}
                        label="End"
                        holdingLabel="Hold"
                        className="py-1.5 text-[11px] font-bold font-mono"
                        title="Press and hold 2 seconds to end event"
                    />
                </div>

                {/* Mode Pill & Rundown Drawer Launcher */}
                <div className="flex gap-2 items-center">
                    <button
                        onClick={onToggleManualMode}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border font-mono text-[10px] font-bold transition-all ${
                            isManualMode
                                ? 'bg-[#181B22] border-[#2D333F] text-[#0EA5E9]'
                                : (isDarkMode ? 'bg-[#181B22] border-[#22262E] text-[#10B981] hover:bg-[#22262E]' : 'bg-white border-slate-300 text-[#059669] hover:bg-slate-100 shadow-xs')
                        }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isManualMode ? 'bg-[#0EA5E9]' : 'bg-[#10B981] animate-tally'}`} />
                        <span className="uppercase tracking-wider">
                            {isManualMode ? 'MANUAL' : 'AUTO-ADVANCE'}
                        </span>
                    </button>

                    <button
                        onClick={() => setIsExpanded(prev => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-mono text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            isExpanded
                                ? 'bg-[#0EA5E9] border-[#0EA5E9] text-white shadow-xs'
                                : (isDarkMode ? 'bg-[#121418] hover:bg-[#181B22] border-[#22262E] text-[#8A93A4]' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs')
                        }`}
                        title="View remaining rundown list"
                    >
                        <ListMusic size={12} />
                        <span>Rundown ({remainingSlots.length})</span>
                    </button>
                </div>
            </div>

            {/* Broadcast Overlay Drawer for Full Rundown (Mini-Player Track List Aesthetic) */}
            {isExpanded && (
                <div 
                    ref={drawerRef}
                    className={`absolute inset-x-0 bottom-0 max-h-[82%] z-50 flex flex-col rounded-t-xl border-t-2 border-[#0EA5E9] shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-6 duration-200 ${
                        isDarkMode ? 'bg-[#090A0D]/95 text-white' : 'bg-white/98 text-slate-900'
                    }`}
                >
                    {/* Drawer Header */}
                    <div className={`px-4 py-2.5 border-b flex justify-between items-center shrink-0 ${
                        isDarkMode ? 'border-[#1C2028] bg-[#0E1117]' : 'border-slate-200 bg-slate-100'
                    }`}>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#0EA5E9] animate-pulse" />
                            <span className="text-xs font-mono font-bold uppercase tracking-wider">
                                Track Queue ({remainingSlots.length} Remaining)
                            </span>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#1C2028] text-slate-500 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Close Rundown Drawer"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Scrollable Mini-Player Track Items */}
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                        {remainingSlots.length > 0 ? (
                            remainingSlots.map((slot, idx) => {
                                const trackNum = String(currentSlotIndex + 1 + idx + 1).padStart(2, '0');
                                return (
                                    <div 
                                        key={slot.id} 
                                        onClick={() => setIsExpanded(false)}
                                        className={`group px-3 py-2 rounded-lg border flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer ${
                                            isDarkMode 
                                                ? 'bg-[#121418] border-[#1F242F] hover:border-[#0EA5E9]/70 hover:bg-[#171B22] hover:shadow-[inset_3px_0_0_#0EA5E9]' 
                                                : 'bg-white border-slate-200 hover:border-[#0EA5E9] hover:bg-slate-50 shadow-2xs hover:shadow-[inset_3px_0_0_#0EA5E9]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            {/* Track Badge */}
                                            <div className="w-5 h-5 rounded flex items-center justify-center font-mono text-[9px] font-bold shrink-0 bg-slate-200 dark:bg-[#1C2028] text-slate-700 dark:text-slate-400">
                                                {trackNum}
                                            </div>

                                            {/* Category Icon */}
                                            <div className="shrink-0 p-1 rounded bg-slate-100 dark:bg-[#161920]">
                                                {getSlotTypeIcon(slot.type)}
                                            </div>

                                            {/* Track Meta */}
                                            <div className="min-w-0 pr-1">
                                                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate font-sans tracking-tight">
                                                    {slot.title}
                                                </div>
                                                <div className={`text-[10px] font-mono tracking-wider truncate flex items-center gap-1.5 ${
                                                    isDarkMode ? 'text-[#38BDF8]' : 'text-slate-500'
                                                }`}>
                                                    <span>{slot.speaker || 'No Speaker Assigned'}</span>
                                                    {slot.type && <span className="opacity-50">• {slot.type}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Glowing Duration Pill */}
                                        <div className={`shrink-0 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border transition-colors ${
                                            isDarkMode 
                                                ? 'bg-[#0EA5E9]/10 text-[#38BDF8] border-[#0EA5E9]/30 group-hover:bg-[#0EA5E9]/20' 
                                                : 'bg-sky-50 text-sky-700 border-sky-200 group-hover:bg-sky-100'
                                        }`}>
                                            {slot.durationMinutes}m
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={`py-8 text-center font-mono text-xs italic ${
                                isDarkMode ? 'text-[#6A7382]' : 'text-slate-400'
                            }`}>
                                End of scheduled slots
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #0EA5E9; border-radius: 10px; opacity: 0.5; }
                * { box-sizing: border-box; }
            ` }} />
        </div>
    );
};
