import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Zap, Minus, Plus, Minimize2, 
  Clock, Shield, Radio, Volume2, Maximize2 
} from 'lucide-react';
import { Program } from '../types';
import { useTimerSync } from '../hooks/useTimerSync';
import { formatDuration } from '../utils/time';

interface ZenFocusConsoleProps {
  program: Program;
  currentSlotIndex: number;
  isTimerActive: boolean;
  timerStartTimestamp: number | null;
  secondsElapsed?: number;
  onToggleTimer: () => void;
  onNext: () => void;
  onPrev: () => void;
  onNudge: (minutes: number) => void;
  onToggleHold: () => void;
  onExitZen: () => void;
}

export const ZenFocusConsole: React.FC<ZenFocusConsoleProps> = ({
  program,
  currentSlotIndex,
  isTimerActive,
  timerStartTimestamp,
  secondsElapsed = 0,
  onToggleTimer,
  onNext,
  onPrev,
  onNudge,
  onToggleHold,
  onExitZen,
}) => {
  const currentSlot = program.slots[currentSlotIndex] || program.slots[0];
  const nextSlot = program.slots[currentSlotIndex + 1];

  const elapsed = useTimerSync(timerStartTimestamp, isTimerActive, secondsElapsed);
  const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
  const remainingSeconds = durationSeconds - elapsed;
  const isOvertime = remainingSeconds < 0;
  const isUnderTwoMinutes = remainingSeconds > 0 && remainingSeconds <= 120;

  // Live wall clock
  const [wallClock, setWallClock] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  useEffect(() => {
    const timer = setInterval(() => {
      setWallClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener for Zen mode: Escape or Z to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        onExitZen();
      } else if (e.code === 'Space') {
        e.preventDefault();
        onToggleTimer();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExitZen, onToggleTimer, onNext, onPrev]);

  // Tally border color based on state
  let borderClass = 'border-slate-800';
  let timerColorClass = 'text-white';

  if (program.isOnHold) {
    borderClass = 'border-amber-500 shadow-[inset_0_0_60px_rgba(245,158,11,0.25)]';
    timerColorClass = 'text-amber-400';
  } else if (isOvertime) {
    borderClass = 'border-rose-600 shadow-[inset_0_0_80px_rgba(225,29,72,0.35)] animate-pulse';
    timerColorClass = 'text-rose-500';
  } else if (isUnderTwoMinutes && isTimerActive) {
    borderClass = 'border-amber-500 shadow-[inset_0_0_40px_rgba(245,158,11,0.2)]';
    timerColorClass = 'text-amber-400';
  } else if (isTimerActive) {
    borderClass = 'border-emerald-600/60 shadow-[inset_0_0_30px_rgba(16,185,129,0.1)]';
    timerColorClass = 'text-emerald-400';
  }

  return (
    <div className={`fixed inset-0 z-[99999] bg-[#07080A] text-white flex flex-col justify-between p-6 sm:p-10 border-4 ${borderClass} transition-all duration-300 select-none overflow-hidden font-sans`}>
      {/* TOP HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${isTimerActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="font-bold tracking-wider uppercase text-slate-300">
              {isTimerActive ? 'LIVE ON AIR' : 'CONSOLE PAUSED'}
            </span>
          </div>
          <span className="text-sm font-semibold text-slate-400 truncate max-w-[280px]">
            {program.title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
            <Clock size={14} className="text-sky-400" />
            <span className="font-bold text-slate-200">{wallClock}</span>
          </div>

          <button
            onClick={onExitZen}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-all border border-slate-700 active:scale-95"
            title="Exit Focus Mode (Esc or Z)"
          >
            <Minimize2 size={14} />
            <span>Exit Zen Mode</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-900 text-slate-400 text-[10px] rounded border border-slate-700">ESC</kbd>
          </button>
        </div>
      </div>

      {/* CENTER HERO TIMER */}
      <div className="flex flex-col items-center justify-center my-auto text-center px-4">
        {program.isOnHold ? (
          <div className="flex flex-col items-center animate-pulse">
            <div className="px-6 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 text-lg font-mono font-bold tracking-widest uppercase mb-4">
              STANDBY FREEZE
            </div>
            <h1 className="text-[12vw] font-mono font-black tracking-tight text-amber-400 leading-none">
              WAITING FOR CUE
            </h1>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                SLOT {currentSlotIndex + 1} OF {program.slots.length}
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-100 truncate max-w-[80vw]">
                {currentSlot?.title || 'Pre-Service Standby'}
              </h2>
            </div>

            {/* Giant Monospace Timer */}
            <div className={`text-[17vw] sm:text-[18vw] font-mono font-black tabular-nums tracking-tighter leading-none my-2 ${timerColorClass}`}>
              {formatDuration(remainingSeconds)}
            </div>

            {/* Speaker or Details */}
            {currentSlot?.speaker && (
              <p className="text-lg sm:text-xl font-mono text-sky-400 font-medium tracking-wide mb-2">
                {currentSlot.speaker}
              </p>
            )}

            {/* Next Item Preview */}
            {nextSlot && (
              <div className="flex items-center gap-2 text-sm sm:text-base font-mono text-slate-400 mt-2 bg-slate-900/60 px-4 py-1.5 rounded-full border border-slate-800">
                <span className="text-slate-500 uppercase text-xs font-bold">Up Next:</span>
                <span className="text-slate-200 font-semibold">{nextSlot.title}</span>
                <span className="text-slate-500">({nextSlot.durationMinutes}m)</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* BOTTOM CONTROL TRANSPORT */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNudge(-1)}
            className="flex items-center gap-1.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs font-bold transition-all active:scale-95"
            title="Nudge -1 Minute"
          >
            <Minus size={16} />
            <span>1m</span>
          </button>
          <button
            onClick={() => onNudge(1)}
            className="flex items-center gap-1.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs font-bold transition-all active:scale-95"
            title="Nudge +1 Minute"
          >
            <Plus size={16} />
            <span>1m</span>
          </button>
          <button
            onClick={onToggleHold}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-xs font-bold transition-all active:scale-95 border ${
              program.isOnHold 
                ? 'bg-amber-500 hover:bg-amber-600 text-black border-amber-400 animate-pulse' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title="Hold for cue / Release hold"
          >
            <Zap size={16} />
            <span>{program.isOnHold ? 'RELEASE HOLD' : 'HOLD FOR CUE'}</span>
          </button>
        </div>

        {/* Big Center Transport Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={currentSlotIndex <= 0}
            className="p-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-slate-300 rounded-2xl transition-all active:scale-95"
            title="Previous Slot (Left Arrow)"
          >
            <SkipBack size={24} />
          </button>

          <button
            onClick={onToggleTimer}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-mono font-bold text-sm tracking-wider uppercase transition-all shadow-xl active:scale-95 ${
              isTimerActive 
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
            title="Play / Pause Timer (Space)"
          >
            {isTimerActive ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            <span>{isTimerActive ? 'PAUSE CLOCK' : 'START TIMER'}</span>
          </button>

          <button
            onClick={onNext}
            disabled={currentSlotIndex >= program.slots.length - 1}
            className="p-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-slate-300 rounded-2xl transition-all active:scale-95"
            title="Next Slot (Right Arrow)"
          >
            <SkipForward size={24} />
          </button>
        </div>

        {/* Right Info Telemetry */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-500">
          <span>Space: Play/Pause</span>
          <span>•</span>
          <span>Arrows: Next/Prev</span>
          <span>•</span>
          <span>Z: Exit Zen</span>
        </div>
      </div>
    </div>
  );
};

export default ZenFocusConsole;
