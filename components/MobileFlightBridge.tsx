import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown, Clock, Zap, MousePointerClick } from 'lucide-react';
import { Program, Slot } from '../types';

interface MobileFlightBridgeProps {
  program: Program;
  currentSlotIndex: number;
  secondsElapsed: number;
  isTimerActive: boolean;
  onToggleTimer: () => void;
  onNextSlot: () => void;
  onPrevSlot: () => void;
  onToggleManualMode: () => void;
  onToggleHold: () => void;
}

export const MobileFlightBridge: React.FC<MobileFlightBridgeProps> = ({
  program,
  currentSlotIndex,
  secondsElapsed,
  isTimerActive,
  onToggleTimer,
  onNextSlot,
  onPrevSlot,
  onToggleManualMode,
  onToggleHold
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentSlot = program.slots[currentSlotIndex];
  const nextSlot = program.slots[currentSlotIndex + 1];

  const formatDuration = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingSeconds = currentSlot ? (currentSlot.durationMinutes * 60 - secondsElapsed) : 0;
  const isOvertime = remainingSeconds < 0;

  if (!currentSlot && !isExpanded) return null;

  return (
    <div 
      className={`fixed left-0 right-0 z-[100] transition-all duration-500 ease-out lg:hidden
        ${isExpanded ? 'bottom-0 h-[85vh] rounded-t-[32px]' : 'bottom-16 h-20'}
        bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]
        backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95
        safe-area-bottom
      `}
    >
      {/* Pull Tab / Handle */}
      <div 
        className="flex justify-center items-center py-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>

      {!isExpanded ? (
        /* Collapsed Bar View */
        <div className="flex items-center justify-between px-6 pb-4 h-full">
          <div className="flex flex-col min-w-0 flex-1 mr-4" onClick={() => setIsExpanded(true)}>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isTimerActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                {isTimerActive ? 'Live' : 'Paused'}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                {currentSlot?.title || 'No Slot'}
              </span>
            </div>
            <div className={`text-2xl font-mono font-bold tabular-nums leading-none mt-1 ${isOvertime ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
              {formatDuration(remainingSeconds)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleTimer(); }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isTimerActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isTimerActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNextSlot(); }}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 active:scale-95"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Remote Panel */
        <div className="flex flex-col h-full px-8 pb-10">
          <div className="flex justify-between items-start mt-4 mb-8">
            <div className="flex-1">
              <h2 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-1">Production Remote</h2>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{program.title}</h3>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"
            >
              <ChevronDown size={24} />
            </button>
          </div>

          {/* Large Countdown Display */}
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 rounded-[40px] mb-10 border border-slate-200 dark:border-slate-800 shadow-inner">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
              {currentSlot?.title || 'Remaining Time'}
            </span>
            <div className={`text-7xl font-mono font-bold tabular-nums tracking-tighter ${isOvertime ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
              {formatDuration(remainingSeconds)}
            </div>
            {nextSlot && (
              <div className="mt-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                <span className="opacity-50">Next:</span>
                <span className="truncate max-w-[200px]">{nextSlot.title}</span>
              </div>
            )}
          </div>

          {/* Primary Controls (Thumb Optimized) */}
          <div className="grid grid-cols-3 gap-6 items-center mb-10">
            <button
              onClick={onPrevSlot}
              disabled={currentSlotIndex === 0}
              className="w-full aspect-square rounded-[30px] flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30 active:scale-95 transition-all shadow-sm"
            >
              <SkipBack size={32} />
            </button>

            <button
              onClick={onToggleTimer}
              className={`w-full aspect-square rounded-[40px] flex items-center justify-center transition-all active:scale-90 shadow-2xl ${
                isTimerActive 
                  ? 'bg-rose-600 text-white shadow-rose-500/30' 
                  : 'bg-indigo-600 text-white shadow-indigo-500/30'
              }`}
            >
              {isTimerActive ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
            </button>

            <button
              onClick={onNextSlot}
              className="w-full aspect-square rounded-[30px] flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-all shadow-sm"
            >
              <SkipForward size={32} />
            </button>
          </div>

          {/* Secondary Controls */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onToggleManualMode}
              className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                program.isManualMode 
                  ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent'
              }`}
            >
              {program.isManualMode ? <MousePointerClick size={20} /> : <Zap size={20} />}
              {program.isManualMode ? 'Manual Mode' : 'Auto Mode'}
            </button>

            <button
              onClick={onToggleHold}
              className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                program.isOnHold 
                  ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent'
              }`}
            >
              <Clock size={20} />
              {program.isOnHold ? 'ON HOLD' : 'Normal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
