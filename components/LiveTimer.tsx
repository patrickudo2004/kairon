import React from 'react';
import { Program, SlotType } from '../types';
import { Play, Pause, SkipForward, SkipBack, Eye, CheckCircle } from 'lucide-react';

interface LiveTimerProps {
  program: Program;
  currentSlotIndex: number;
  isTimerActive: boolean;
  secondsElapsed: number;
  onToggleTimer: () => void;
  onNext: () => void;
  onPrev: () => void;
  readOnly?: boolean;
}

const LiveTimer: React.FC<LiveTimerProps> = ({ 
  program, 
  currentSlotIndex, 
  isTimerActive, 
  secondsElapsed, 
  onToggleTimer, 
  onNext,
  onPrev,
  readOnly = false
}) => {
  const currentSlot = program.slots[currentSlotIndex];
  const nextSlot = program.slots[currentSlotIndex + 1];

  // Time Helpers
  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculations
  const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
  const timeLeft = Math.max(0, durationSeconds - secondsElapsed); 
  
  const progressPercent = durationSeconds > 0
    ? Math.min(100, Math.max(0, (timeLeft / durationSeconds) * 100))
    : 0;

  if (!currentSlot) {
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
                onClick={onPrev} 
                className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-lg hover:shadow-xl transition-all group"
            >
                <SkipBack size={24} className="group-hover:-translate-x-1 transition-transform" /> 
                <span className="font-semibold text-lg">Return to Previous</span>
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
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            currentSlot.type === SlotType.BREAK 
              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
          }`}>
            {currentSlot.type}
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-sm">Current Session</span>
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

        {/* Timer */}
        <div className="text-[100px] md:text-[180px] font-mono font-bold leading-none tracking-tighter tabular-nums text-slate-900 dark:text-white select-none transition-colors">
          {formatTime(timeLeft)}
        </div>
        
        {readOnly && isTimerActive && (
          <div className="mt-4 text-emerald-500 animate-pulse text-sm font-semibold tracking-widest uppercase">
            Live - Session In Progress
          </div>
        )}
        {readOnly && !isTimerActive && (
          <div className="mt-4 text-slate-400 text-sm font-semibold tracking-widest uppercase">
            Waiting to Start
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full mb-12 overflow-hidden shadow-inner">
        <div 
          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Controls - Hidden if readOnly */}
      {!readOnly && (
        <div className="flex justify-center gap-6 mb-8">
          <button 
            onClick={onPrev}
            disabled={currentSlotIndex === 0}
            className="flex items-center gap-3 px-6 py-5 rounded-2xl font-semibold text-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipBack size={28} /> 
          </button>

          <button 
            onClick={onToggleTimer}
            className={`flex items-center gap-3 px-8 md:px-12 py-5 rounded-2xl font-semibold text-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl ${
              isTimerActive 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30'
            }`}
          >
            {isTimerActive ? <><Pause size={28} /> Pause</> : <><Play size={28} fill="currentColor" /> Start</>}
          </button>

          <button 
            onClick={onNext}
            className="flex items-center gap-3 px-8 md:px-10 py-5 rounded-2xl font-semibold text-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all shadow-xl"
          >
            <SkipForward size={28} /> 
            Next
          </button>
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