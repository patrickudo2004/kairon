import React, { useState, useEffect } from 'react';
import { Program } from '../types';
import { Play, Pause, SkipForward, SkipBack, Eye, CheckCircle, ClipboardList, MousePointerClick, Zap, Minus, Plus, Power, AlertTriangle, Shield, Clock } from 'lucide-react';
import { useTimerSync } from '../hooks/useTimerSync';
import { formatDuration } from '../utils/time';

interface LiveTimerProps {
  program: Program;
  currentSlotIndex: number;
  isTimerActive: boolean;
  timerStartTimestamp: number | null;
  secondsElapsed?: number;
  onToggleTimer: (target?: Program, force?: boolean, seconds?: number) => void;
  onToggleHold?: (nextState?: boolean, targetId?: string) => void;
  onNext: (targetId?: string) => void;
  onPrev: (targetId?: string) => void;
  onEndEvent?: (targetId?: string) => void;
  onNudge?: (minutes: number) => void;
  readOnly?: boolean;
  isAutopilotEnabled?: boolean;
  onToggleAutopilot?: (enabled: boolean) => void;
}

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
  readOnly = false,
  isAutopilotEnabled = false,
  onToggleAutopilot
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

  // Time calculations
  const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
  const timeLeft = durationSeconds - elapsed;

  const progressPercent = durationSeconds > 0
    ? Math.min(100, Math.max(0, (timeLeft / durationSeconds) * 100))
    : 0;

  if (program.status === 'draft' && program.slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto p-8 animate-in fade-in duration-300 font-sans">
        <div className="mb-6 p-5 bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-lg shadow-sm">
          <Play size={48} className="text-[#0EA5E9] ml-1" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2 tracking-tight">
          No Schedule Items
        </h2>
        <p className="text-xs font-mono text-slate-500 dark:text-[#8A93A4] text-center mb-8">
          Add rundown slots in the Program Editor before starting your live session.
        </p>
      </div>
    );
  }

  // Concluded State
  if (program.status === 'concluded') {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto p-8 animate-in fade-in duration-300 font-sans">
        <div className="mb-6 p-5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg">
          <CheckCircle size={48} className="text-[#10B981]" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-2 tracking-tight">
          Session Concluded
        </h2>
        <p className="text-xs font-mono text-slate-500 dark:text-[#8A93A4] text-center mb-8">
          The program has concluded and all active timers have finished.
        </p>
        {!readOnly && (
          <button
            onClick={() => onPrev(program.id)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#1A1D24] text-slate-800 dark:text-[#E1E4EA] border border-slate-200 dark:border-[#22262E] rounded-md font-mono text-xs font-semibold transition-all shadow-sm"
          >
            <SkipBack size={14} />
            <span>Return to Previous Slot</span>
          </button>
        )}
      </div>
    );
  }

  // Safety fallback
  if (program.status === 'live' && !currentSlot) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto p-8 text-center font-sans">
        <div className="p-4 bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-md mb-4 shadow-sm">
          <ClipboardList size={32} className="text-slate-500 dark:text-[#8A93A4]" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Items in Rundown</h2>
        <p className="text-xs font-mono text-slate-500 dark:text-[#8A93A4] mb-6">This program has no schedule items.</p>
        {!readOnly && (
          <button
            onClick={() => onToggleTimer(program, false, elapsed)}
            className="px-4 py-2 bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] rounded text-xs font-mono font-bold"
          >
            Stop Session
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-6 overflow-y-auto max-w-5xl mx-auto w-full font-sans">
      
      {/* Top Status & Tally Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-md px-4 py-3 mb-6 shadow-sm">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1C2028] border border-slate-200 dark:border-[#2D333F] text-[10px] font-mono font-bold uppercase tracking-wider text-[#0EA5E9]">
            {currentSlot.type || 'SESSION'}
          </span>

          {isTimerActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[10px] font-mono font-bold text-[#10B981]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-tally"></span>
              ON AIR • LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[10px] font-mono font-bold text-[#F59E0B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
              STANDBY
            </span>
          )}

          {program.isManualMode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1C2028] border border-slate-200 dark:border-[#2D333F] text-[10px] font-mono font-bold text-slate-800 dark:text-[#E1E4EA] uppercase">
              <MousePointerClick size={11} className="text-[#0EA5E9]" />
              Manual Advance
            </span>
          )}

          {isAutopilotEnabled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#A855F7]/10 border border-[#A855F7]/30 text-[10px] font-mono font-bold text-[#A855F7] uppercase">
              <Zap size={11} />
              Autopilot Active
            </span>
          )}

          {readOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-[10px] font-mono text-slate-500 dark:text-[#8A93A4]">
              <Eye size={11} />
              Viewer Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-[#8A93A4]">
          <span>NEXT:</span>
          <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[200px]">
            {nextSlot ? nextSlot.title : 'End of Event'}
          </span>
        </div>
      </div>

      {/* Main Studio Countdown Readout Panel */}
      <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-lg p-6 md:p-10 flex flex-col items-center justify-center relative min-h-[320px] mb-6 shadow-xl">
        
        {/* Slot Metadata */}
        <div className="text-center max-w-3xl mb-4">
          <div className="text-[11px] font-mono text-slate-400 dark:text-[#6A7382] uppercase tracking-wider mb-1">
            Slot {currentSlotIndex + 1} of {program.slots.length}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {currentSlot.title}
          </h1>
          {currentSlot.speaker && (
            <p className="text-sm md:text-base text-[#0EA5E9] font-mono font-medium mt-1">
              {currentSlot.speaker}
            </p>
          )}
        </div>

        {/* Master Tabular Timer Display */}
        <div className={`text-[20vw] sm:text-[18vw] lg:text-[150px] font-mono font-bold leading-none tracking-tight tabular-nums select-none transition-colors my-2 ${
          timeLeft < 0 
            ? 'text-[#EF4444] animate-pulse' 
            : (isTimerActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-[#8A93A4]')
        }`}>
          {formatDuration(timeLeft)}
        </div>

        {/* Overtime Alert Banner */}
        {timeLeft < 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded text-[#EF4444] text-xs font-mono font-bold uppercase tracking-wider animate-bounce mt-2">
            <AlertTriangle size={13} />
            <span>Overtime: Running by {formatDuration(Math.abs(timeLeft))}</span>
          </div>
        )}

        {/* Meeting Cost Analytics (Optional) */}
        {program.estimatedAttendees && program.averageHourlyRate && (
          <div className="mt-4 px-3.5 py-1.5 bg-slate-100 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded-md flex items-center gap-2 font-mono text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-tally" />
            <span className="text-slate-500 dark:text-[#8A93A4] uppercase text-[10px]">Session Cost:</span>
            <span className="text-slate-900 dark:text-white font-bold">
              ${((program.estimatedAttendees * program.averageHourlyRate / 3600) * secondsElapsed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Hold Alert Banner */}
        {program.isOnHold && (
          <div className="w-full mt-5 p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded text-[#F59E0B] text-center font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse">
            <Pause size={14} />
            <span>STANDBY HOLD: {program.holdMessage || 'WAITING FOR CUE'}</span>
          </div>
        )}

        {/* Slim Progress Meter */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-[#090A0C] rounded-full overflow-hidden border border-slate-200 dark:border-[#22262E] mt-6">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              program.isOnHold 
                ? 'bg-[#F59E0B] animate-pulse' 
                : (timeLeft < 0 ? 'bg-[#EF4444]' : 'bg-[#10B981]')
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

      </div>

      {/* Tactical Hardware Control Deck */}
      {!readOnly && (
        <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-lg p-5 flex flex-col items-center gap-5 shadow-md">
          
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            
            {/* Previous Slot */}
            <button
              onClick={() => onPrev(program.id)}
              disabled={currentSlotIndex === 0}
              className="p-3.5 bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] disabled:opacity-30 text-slate-800 dark:text-[#E1E4EA] border border-slate-200 dark:border-[#22262E] rounded-md transition-all active:scale-95 shadow-sm"
              title="Jump to Previous Slot"
            >
              <SkipBack size={20} />
            </button>

            {/* Master Play / Pause */}
            <button
              onClick={() => onToggleTimer(program, false, elapsed)}
              className={`w-24 h-24 md:px-8 md:py-3.5 rounded-2xl md:rounded-md font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 ${
                isTimerActive
                  ? 'bg-slate-100 dark:bg-[#1C2028] hover:bg-slate-200 dark:hover:bg-[#252B37] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2D333F]'
                  : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-[#10B981]/20'
              }`}
            >
              {isTimerActive ? (
                <>
                  <Pause size={28} fill="currentColor" />
                  <span className="hidden md:inline">❚❚ Pause</span>
                </>
              ) : (
                <>
                  <Play size={28} fill="currentColor" className="ml-1" />
                  <span className="hidden md:inline">▶ Start</span>
                </>
              )}
            </button>

            {/* Next Slot */}
            <button
              onClick={() => onNext(program.id)}
              className={`p-3.5 rounded-md transition-all active:scale-95 border shadow-sm ${
                program.isManualMode && timeLeft <= 0
                  ? 'bg-[#F59E0B] text-black border-[#F59E0B] animate-pulse ring-2 ring-[#F59E0B]/30'
                  : 'bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] text-slate-800 dark:text-[#E1E4EA] border-slate-200 dark:border-[#22262E]'
              }`}
              title="Next Slot"
            >
              <SkipForward size={20} />
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-[#22262E] mx-1 hidden sm:block"></div>

            {/* Nudge Controls */}
            <div className="inline-flex items-center bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] rounded-md p-0.5 shadow-sm">
              <button
                onClick={() => onNudge?.(-1)}
                className="px-2.5 py-2 hover:bg-slate-200 dark:hover:bg-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded transition-all font-mono text-xs font-bold"
                title="Nudge Down"
              >
                <Minus size={14} />
              </button>
              <span className="px-2 text-[10px] font-mono text-slate-400 dark:text-[#6A7382] uppercase">NUDGE</span>
              <button
                onClick={() => onNudge?.(1)}
                className="px-2.5 py-2 hover:bg-slate-200 dark:hover:bg-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded transition-all font-mono text-xs font-bold"
                title="Nudge Up"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Hold Toggle */}
            <button
              onClick={() => onToggleHold?.(undefined, program.id)}
              className={`px-3.5 py-2.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all border flex items-center gap-1.5 shadow-sm ${
                program.isOnHold
                  ? 'bg-[#F59E0B] text-black border-[#F59E0B]'
                  : 'bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] text-[#F59E0B] border-slate-200 dark:border-[#22262E]'
              }`}
              title="Toggle Hold for Cue"
            >
              <Pause size={14} />
              <span>{program.isOnHold ? 'ON HOLD' : 'HOLD CUE'}</span>
            </button>

            {/* Autopilot Toggle */}
            <button
              onClick={() => onToggleAutopilot?.(!isAutopilotEnabled)}
              className={`px-3.5 py-2.5 rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all border flex items-center gap-1.5 shadow-sm ${
                isAutopilotEnabled
                  ? 'bg-[#A855F7] text-white border-[#A855F7]'
                  : 'bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] text-[#A855F7] border-slate-200 dark:border-[#22262E]'
              }`}
              title="Automatically balance remaining durations on overrun"
            >
              <Zap size={14} />
              <span>AUTOPILOT</span>
            </button>

            {/* End Event Hold-to-Confirm */}
            <button
              onMouseDown={() => setIsEnding(true)}
              onMouseUp={() => setIsEnding(false)}
              onMouseLeave={() => setIsEnding(false)}
              onTouchStart={() => setIsEnding(true)}
              onTouchEnd={() => setIsEnding(false)}
              className="relative overflow-hidden bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] px-4 py-2.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all select-none flex items-center gap-1.5 shadow-sm"
            >
              <div
                className="absolute inset-0 bg-[#EF4444] opacity-30 origin-left transition-transform duration-75"
                style={{ transform: `scaleX(${holdToEnd / 100})` }}
              />
              <Power size={14} className="relative z-10" />
              <span className="relative z-10">
                {holdToEnd > 0 ? `HOLD (${holdToEnd}%)` : 'END EVENT'}
              </span>
            </button>

          </div>

          <div className="text-[10px] font-mono text-slate-400 dark:text-[#6A7382] uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
            <span>Studio Control Surface • Broadcast Timing Engine</span>
          </div>

        </div>
      )}

      {readOnly && (
        <div className="text-center text-[#6A7382] font-mono text-xs py-4">
          OPERATOR CONTROLS DISABLED IN VIEWER MODE
        </div>
      )}

    </div>
  );
};

export default LiveTimer;
