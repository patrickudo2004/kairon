import React from 'react';
import { Program } from '../types';
import { Play, Pause, SkipForward, SkipBack, Eye, CheckCircle, ClipboardList, MousePointerClick, Zap } from 'lucide-react';
import { useTimerSync } from '../hooks/useTimerSync';

interface LiveTimerProps {
  program: Program;
  currentSlotIndex: number;
  isTimerActive: boolean;
  timerStartTimestamp: number | null;
  secondsElapsed?: number; // Optional legacy fallback if needed
  onToggleTimer: (target?: Program, force?: boolean, seconds?: number) => void;
  onToggleHold?: (nextState?: boolean, targetId?: string) => void;
  onNext: (targetId?: string) => void;
  onPrev: (targetId?: string) => void;
  onEndEvent?: (targetId?: string) => void;
  onNudge?: (minutes: number) => void;
  readOnly?: boolean;
}

import { formatDuration } from '../utils/time';
import { useState, useEffect } from 'react';
import { Minus, Plus, Power } from 'lucide-react';

const LiveTimer: React.FC<LiveTimerProps> = ({
  program,
  currentSlotIndex,
  isTimerActive,
  timerStartTimestamp,
  secondsElapsed = 0,
  onToggleTimer,
  onToggleHold,
  onNext,
  onPrev,
  onEndEvent,
  onNudge,
  readOnly = false
}) => {
  const currentSlot = program.slots[currentSlotIndex];
  const nextSlot = program.slots[currentSlotIndex + 1];

  // Sync the timer heart-beat with the global anchor
  const elapsed = useTimerSync(timerStartTimestamp, isTimerActive, secondsElapsed);

  // Safety Hold logic for End Event
  const [holdToEnd, setHoldToEnd] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

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

    if (holdToEnd >= 100 && onEndEvent) {
      onEndEvent(program.id);
      setHoldToEnd(0);
      setIsEnding(false);
    }

    return () => clearInterval(interval);
  }, [isEnding, holdToEnd, onEndEvent]);

  // Time Helpers (Consolidated)
  const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
  const timeLeft = durationSeconds - elapsed;

  const progressPercent = durationSeconds > 0
    ? Math.min(100, Math.max(0, (timeLeft / durationSeconds) * 100))
    : 0;

  if (program.status === 'draft' && program.slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 p-6 bg-indigo-100 dark:bg-indigo-500/10 rounded-full shadow-xl shadow-indigo-500/20 ring-1 ring-indigo-500/20">
          <Play size={80} className="text-indigo-600 dark:text-indigo-400 ml-2" strokeWidth={1.5} fill="currentColor" />
        </div>

        <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white text-center mb-4 tracking-tight">
          No Items Added
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 text-center mb-12">
          Please add some schedule items in the Editor before starting your live session.
        </p>
      </div>
    );
  }

  // Case 1: Program is concluded
  if (program.status === 'concluded') {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 p-6 bg-emerald-100 dark:bg-emerald-500/10 rounded-full shadow-xl shadow-emerald-500/20 ring-1 ring-emerald-500/20">
          <CheckCircle size={80} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
        </div>

        <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white text-center mb-4 tracking-tight">
          All Done!
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 text-center mb-12">
          The program has concluded successfully.
        </p>

        {!readOnly && (
          <button
            onClick={() => onPrev(program.id)}
            className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-lg hover:shadow-xl transition-all group"
          >
            <SkipBack size={24} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-lg">Return to Previous</span>
          </button>
        )}
      </div>
    );
  }

  // Case 2: Program is live but has no slots (Safety)
  if (program.status === 'live' && !currentSlot) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-8 text-center">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8">
          <ClipboardList size={40} className="text-slate-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">No Slots Added</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">This live program currently has no schedule items.</p>
        {!readOnly && (
          <button
            onClick={() => onToggleTimer(program, false, elapsed)}
            className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200"
          >
            Stop Session
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto max-w-5xl mx-auto w-full">
      {/* Status Bar */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentSlot.type === 'Break'
            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : ['Worship', 'Sermon', 'Music'].includes(currentSlot.type)
              ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
              : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
            }`}>
            {currentSlot.type}
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-sm">Current Session</span>
          {program.isManualMode && (
            <span className="flex items-center gap-1.5 text-[10px] font-black bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full ml-2 uppercase tracking-widest border border-amber-500/20">
              <MousePointerClick size={12} /> Manual Mode
            </span>
          )}
          {readOnly && (
            <span className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-full ml-2">
              <Eye size={12} /> Viewer Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          Next: <span className="text-slate-700 dark:text-slate-300 font-medium">{nextSlot ? `${nextSlot.title}` : "End of Day"}</span>
        </div>
      </div>

      {/* Main Display */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white text-center mb-4 leading-tight max-w-4xl">
          {currentSlot.title}
        </h1>
        <p className="text-xl md:text-2xl text-indigo-600 dark:text-indigo-300 mb-8 font-light text-center">
          {currentSlot.speaker}
        </p>

        <div className={`text-[25vw] sm:text-[20vw] lg:text-[180px] font-mono font-bold leading-none tracking-tighter tabular-nums select-none transition-colors ${timeLeft < 0 ? 'text-rose-600 dark:text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'
          }`}>
          {formatDuration(timeLeft)}
        </div>

        {/* Meeting Cost Analytics (Pro Feature) */}
        {program.estimatedAttendees && program.averageHourlyRate && (
          <div className="mt-4 px-6 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-700 dark:text-amber-400 text-sm font-medium uppercase tracking-wider">Live Meeting Cost:</span>
            <span className="text-amber-900 dark:text-amber-200 font-mono text-xl font-bold">
              ${((program.estimatedAttendees * program.averageHourlyRate / 3600) * secondsElapsed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {readOnly && isTimerActive && (
          <div className="mt-4 text-emerald-500 animate-pulse text-sm font-semibold tracking-widest uppercase">
            Live - Session In Progress
          </div>
        )}

        {/* Manual Advance Guidance */}
        {!readOnly && program.isManualMode && timeLeft <= 0 && (
          <div className="mt-8 px-6 py-3 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/40 animate-bounce flex items-center gap-3">
            <MousePointerClick size={20} />
            Awaiting Manual Jump
          </div>
        )}

        {readOnly && !isTimerActive && (
          <div className="mt-4 text-slate-400 text-sm font-semibold tracking-widest uppercase">
            Waiting to Start
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full mb-8 overflow-hidden shadow-inner">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${program.isOnHold ? 'bg-amber-500 animate-pulse' : 'bg-indigo-600 dark:bg-indigo-500'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {program.isOnHold && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 font-black uppercase tracking-[0.2em] text-xl">
            <Pause size={24} className="animate-pulse" />
            {program.holdMessage || 'WAITING FOR CUE'}
          </div>
        </div>
      )}

      {/* Controls - Hidden if readOnly */}
      {!readOnly && (
        <div className="flex flex-col items-center gap-8 mb-12">
          {/* Main Command Bar */}
          <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-4xl justify-center">
            
            {/* Override Group (Left) */}
            <div className="flex items-center gap-4 order-2 md:order-1">
              <button
                onClick={() => onToggleHold?.(undefined, program.id)}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all border shadow-lg ${program.isOnHold
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white dark:bg-slate-800 text-amber-600 border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  }`}
              >
                <Pause size={20} />
                <span className="uppercase tracking-widest">Hold for Cue</span>
              </button>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-lg">
                <button
                  onClick={() => onNudge?.(-1)}
                  className="p-3 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                >
                  <Minus size={20} />
                </button>
                <div className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Nudge</div>
                <button
                  onClick={() => onNudge?.(1)}
                  className="p-3 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Core Navigation (Center) */}
            <div className="flex items-center gap-4 order-1 md:order-2">
              <button
                onClick={() => onPrev(program.id)}
                disabled={currentSlotIndex === 0}
                className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all shadow-lg active:scale-95 disabled:opacity-30"
              >
                <SkipBack size={28} />
              </button>

              <button
                onClick={() => onToggleTimer(program)}
                className={`w-24 h-24 flex items-center justify-center rounded-3xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl ${isTimerActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-indigo-500/50'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/40'
                  }`}
              >
                {isTimerActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
              </button>

              <button
                onClick={() => onNext(program.id)}
                className={`w-16 h-16 flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95 border ${program.isManualMode && timeLeft <= 0
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse ring-4 ring-amber-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700'
                  }`}
              >
                <SkipForward size={28} />
              </button>
            </div>

            {/* Critical Action (Right) */}
            <div className="order-3 flex items-center">
              <button
                onMouseDown={() => setIsEnding(true)}
                onMouseUp={() => setIsEnding(false)}
                onMouseLeave={() => setIsEnding(false)}
                onTouchStart={() => setIsEnding(true)}
                onTouchEnd={() => setIsEnding(false)}
                className="relative group overflow-hidden bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 select-none shadow-lg shadow-rose-900/20"
              >
                <div
                    className="absolute inset-0 bg-rose-950 opacity-50 origin-left transition-transform duration-75"
                    style={{ transform: `scaleX(${holdToEnd / 100})` }}
                />
                <Power size={20} className="relative z-10" />
                <span className="relative z-10 uppercase tracking-widest text-sm">
                  {holdToEnd > 0 ? 'Holding...' : 'End Event'}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50">
            Control Deck • Unified Operator Interface
          </div>
        </div>
      )}

      {readOnly && (
        <div className="text-center text-slate-400 text-sm mb-8">
          Controls disabled in viewer mode.
        </div>
      )}
    </div>
  );
};

export default LiveTimer;