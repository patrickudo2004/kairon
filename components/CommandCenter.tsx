import React, { useState, useEffect } from 'react';
import { Program, Organization } from '../types';
import { Play, Pause, SkipForward, SkipBack, PlusCircle, MinusCircle, LayoutGrid, Radio, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDuration } from '../utils/time';

interface CommandCenterProps {
    programs: Program[];
    activeSessions: Program[];
    onToggleTimer: (program: Program) => void;
    onNext: (programId: string) => void;
    onPrev: (programId: string) => void;
    onNudge: (dir: number, programId: string) => void;
    onSelectProgram: (program: Program) => void;
}

interface CommandTrackCardProps {
    program: Program;
    onToggleTimer: (program: Program) => void;
    onNext: (programId: string) => void;
    onPrev: (programId: string) => void;
    onNudge: (dir: number, programId: string) => void;
    onSelectProgram: (program: Program) => void;
}

const CommandTrackCard: React.FC<CommandTrackCardProps> = ({
    program,
    onToggleTimer,
    onNext,
    onPrev,
    onNudge,
    onSelectProgram
}) => {
    const currentIdx = program.currentSlotIndex ?? 0;
    const currentSlot = program.slots[currentIdx];
    const nextSlot = program.slots[currentIdx + 1];

    // Local ticking to avoid laggy sync between tabs
    const [elapsed, setElapsed] = useState(program.secondsElapsed || 0);

    useEffect(() => {
        let interval: number | undefined;
        if (program.isTimerActive && program.timerStartTimestamp) {
            const tick = () => {
                const now = Date.now();
                const total = Math.floor((now - program.timerStartTimestamp!) / 1000);
                setElapsed(total < 0 ? 0 : total);
            };
            tick();
            interval = window.setInterval(tick, 1000);
        } else {
            setElapsed(program.secondsElapsed || 0);
        }
        return () => clearInterval(interval);
    }, [program.isTimerActive, program.timerStartTimestamp, program.secondsElapsed]);

    const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
    const timeLeft = durationSeconds - elapsed;
    const progressPercent = durationSeconds > 0
        ? Math.min(100, Math.max(0, (timeLeft / durationSeconds) * 100))
        : 0;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient Background Signal */}
            <div className={`absolute inset-0 transition-colors duration-500 pointer-events-none opacity-[0.03] ${
                timeLeft < 0 ? 'bg-rose-500' : timeLeft < 60 ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />

            {/* Header: Track metadata */}
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="max-w-[70%]">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Live Track</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">{program.title}</h2>
                    {program.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{program.subtitle}</p>
                    )}
                </div>

                <button
                    onClick={() => onSelectProgram(program)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                    title="Control Event Live"
                >
                    <ExternalLink size={16} />
                </button>
            </div>

            {/* Clock display */}
            <div className="my-6 text-center relative z-10 flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Countdown</span>
                <div className={`font-mono font-black tabular-nums leading-none tracking-tighter text-5xl md:text-6xl transition-colors duration-500 ${
                    timeLeft < 0 ? 'text-rose-500' : timeLeft < 60 ? 'text-amber-500' : 'text-slate-900 dark:text-white'
                }`}>
                    {formatDuration(timeLeft)}
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6 relative z-10">
                <div 
                    className={`h-full transition-all duration-1000 ease-linear ${
                        timeLeft < 0 ? 'bg-rose-500 animate-pulse' : timeLeft < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Current Segment Info */}
            {currentSlot ? (
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 mb-6 relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1">Active Item</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase">{currentSlot.title}</h3>
                    {currentSlot.speaker && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentSlot.speaker}</p>
                    )}

                    {nextSlot && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 block mb-0.5">Next</span>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate uppercase">{nextSlot.title}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl mb-6 text-center py-6 text-slate-400 dark:text-slate-500">
                    No active slots
                </div>
            )}

            {/* Integrated Controls Grid */}
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/50 pt-4 relative z-10">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onPrev(program.id)}
                        disabled={currentIdx === 0}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-slate-600 dark:text-slate-200 transition-colors"
                        title="Previous Slot"
                    >
                        <SkipBack size={16} />
                    </button>
                    <button
                        onClick={() => onToggleTimer(program)}
                        className={`p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                            program.isTimerActive 
                                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/10' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10'
                        }`}
                        title={program.isTimerActive ? "Pause Timer" : "Start Timer"}
                    >
                        {program.isTimerActive ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                        onClick={() => onNext(program.id)}
                        disabled={currentIdx >= program.slots.length - 1}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-slate-600 dark:text-slate-200 transition-colors"
                        title="Next Slot"
                    >
                        <SkipForward size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onNudge(-1, program.id)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-500 dark:text-slate-400 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
                        title="Shave 1 Minute"
                    >
                        <MinusCircle size={14} /> -1m
                    </button>
                    <button
                        onClick={() => onNudge(1, program.id)}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-500 dark:text-slate-400 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
                        title="Add 1 Minute"
                    >
                        <PlusCircle size={14} /> +1m
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CommandCenter: React.FC<CommandCenterProps> = ({
    programs,
    activeSessions,
    onToggleTimer,
    onNext,
    onPrev,
    onNudge,
    onSelectProgram
}) => {
    // Filter down to only programs that are currently "live"
    const liveTracks = activeSessions.length > 0
        ? activeSessions
        : programs.filter(p => p.status === 'live');

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Title / Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Multi-Track Command Center</h1>
                <p className="text-slate-500 font-medium">Monitor and sync parallel conference channels or concurrent sessions in real time.</p>
            </div>

            {liveTracks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {liveTracks.map(track => (
                        <CommandTrackCard
                            key={track.id}
                            program={track}
                            onToggleTimer={onToggleTimer}
                            onNext={onNext}
                            onPrev={onPrev}
                            onNudge={onNudge}
                            onSelectProgram={onSelectProgram}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-12 text-center max-w-2xl mx-auto mt-6 shadow-sm">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Radio size={36} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Concurrent Tracks</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                        The Command Center aggregates active tracks that are in the <strong>Live</strong> status. Once you launch an event live from your dashboard, its real-time monitor will appear here.
                    </p>
                    <div className="flex justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full">
                            Standing by for broadcast...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
