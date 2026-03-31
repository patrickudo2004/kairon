import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, ChevronDown, Clock, Zap, 
  MousePointerClick, Timer, Power, BarChart3, List, Settings2 
} from 'lucide-react';
import { Program, Slot } from '../types';

interface MobileFlightBridgeProps {
  program: Program;
  currentSlotIndex: number;
  secondsElapsed: number;
  isTimerActive: boolean;
  isAdminOnline: boolean;
  onToggleTimer: () => void;
  onNextSlot: () => void;
  onPrevSlot: () => void;
  onToggleManualMode: () => void;
  onToggleHold: () => void;
  onNudge: (minutes: number) => void;
  onEndEvent: () => void;
  onViewAnalysis: (id: string) => void;
}

export const MobileFlightBridge: React.FC<MobileFlightBridgeProps> = ({
  program,
  currentSlotIndex,
  secondsElapsed,
  isTimerActive,
  isAdminOnline,
  onToggleTimer,
  onNextSlot,
  onPrevSlot,
  onToggleManualMode,
  onToggleHold,
  onNudge,
  onEndEvent,
  onViewAnalysis
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'schedule'>('controls');
  const [holdToEnd, setHoldToEnd] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  // OPTIMISTIC STATE for instant feedback
  const [optimisticIndex, setOptimisticIndex] = useState(currentSlotIndex);
  const [optimisticTimerActive, setOptimisticTimerActive] = useState(isTimerActive);
  const [localSecondsOffset, setLocalSecondsOffset] = useState(0);
  const lastPropsIndex = useRef(currentSlotIndex);

  // Sync optimistic states when props arrive from the backend
  useEffect(() => {
    setOptimisticIndex(currentSlotIndex);
    setOptimisticTimerActive(isTimerActive);
    setLocalSecondsOffset(0); // Reset offset when real data arrives
  }, [currentSlotIndex, isTimerActive]);

  const currentSlot = program.slots[optimisticIndex] || program.slots[0];
  const nextSlot = program.slots[optimisticIndex + 1];

  // A program is "Live" only if it has a status of 'live' or is formally active
  const isShowLive = program.status === 'live';

  // Hold to end logic (matching ProductionHUD parity)
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

    if (holdToEnd >= 100) {
      onEndEvent();
      setHoldToEnd(0);
      setIsEnding(false);
      setIsExpanded(false); // Collapse on end
    }

    return () => clearInterval(interval);
  }, [isEnding, holdToEnd, onEndEvent]);

  const formatDuration = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Optimistic Handlers
  const handleNext = () => {
    if (optimisticIndex < program.slots.length - 1) {
      setOptimisticIndex(prev => prev + 1);
      setLocalSecondsOffset(0);
      // Predict continuous playback if in auto mode (not manual)
      if (!program.isManualMode) setOptimisticTimerActive(true);
      onNextSlot();
    }
  };

  const handlePrev = () => {
    if (optimisticIndex > 0) {
      setOptimisticIndex(prev => prev - 1);
      setLocalSecondsOffset(0);
      if (!program.isManualMode) setOptimisticTimerActive(true);
      onPrevSlot();
    }
  };

  const handleToggle = () => {
    setOptimisticTimerActive(!optimisticTimerActive);
    onToggleTimer();
  };

  const remainingSeconds = currentSlot 
    ? (currentSlot.durationMinutes * 60 - (isShowLive ? (secondsElapsed + localSecondsOffset) : 0)) 
    : 0;
  const isOvertime = isShowLive && remainingSeconds < 0;

  if (!currentSlot && !isExpanded) return null;

  return (
    <div 
      className={`fixed left-0 right-0 z-[100] transition-all duration-500 ease-out lg:hidden
        ${isExpanded ? 'bottom-0 h-[85vh] rounded-t-[40px]' : 'bottom-16 h-20'}
        bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]
        backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95
        safe-area-bottom
      `}
    >
      {/* Pull Tab / Handle */}
      <div 
        className="flex justify-center items-center py-2.5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>

      {!isExpanded ? (
        /* --- COLLAPSED BAR VIEW --- */
        <div className="flex items-center justify-between px-6 pb-4 h-full">
          <div className="flex flex-col min-w-0 flex-1 mr-4" onClick={() => setIsExpanded(true)}>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isShowLive ? (optimisticTimerActive ? 'text-emerald-500' : 'text-slate-400') : 'text-indigo-500'}`}>
                {isShowLive ? (optimisticTimerActive ? 'Live' : 'Paused') : 'Ready'}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                {currentSlot?.title || 'No Slot'}
              </span>
            </div>
            <div className={`text-2xl font-mono font-bold tabular-nums leading-none mt-1 ${isOvertime ? 'text-rose-500 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'}`}>
              {isShowLive ? formatDuration(remainingSeconds) : `${currentSlot?.durationMinutes}:00`}
            </div>
          </div>

          <div className="flex items-center gap-3">
             {!isShowLive ? (
               <button
                  onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                  className="px-6 h-12 rounded-full bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
               >
                  Start
               </button>
             ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    optimisticTimerActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {optimisticTimerActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
             )}
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 active:scale-95"
            >
              <Settings2 size={20} />
            </button>
          </div>
        </div>
      ) : (
        /* --- EXPANDED REMOTE PANEL --- */
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-start px-8 pt-2 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${isAdminOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <h2 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em]">
                  {isShowLive ? (isAdminOnline ? 'Live Production Remote' : 'Sync Offline') : 'Program Ready'}
                </h2>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white truncate pr-4">{program.title}</h3>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 active:scale-90 transition-all"
            >
              <ChevronDown size={24} />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex px-8 mb-6">
            <div className="flex w-full p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
              <button 
                onClick={() => setActiveTab('controls')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'controls' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}
              >
                <Zap size={14} />
                Controls
              </button>
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'schedule' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}
              >
                <List size={14} />
                Schedule
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-8 pb-32">
            {activeTab === 'controls' ? (
              <div className="flex flex-col animate-in slide-in-from-left-4 duration-300">
                {/* Large Countdown Display */}
                <div className="flex flex-col items-center justify-center p-10 bg-slate-50 dark:bg-slate-950 rounded-[40px] mb-8 border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden relative">
                   {/* Sync Status Glow */}
                   <div className={`absolute -top-10 -right-10 w-24 h-24 blur-3xl opacity-20 ${isAdminOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                   
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">
                    {currentSlot?.title || 'Remaining Time'}
                  </span>
                  <div className={`text-7xl font-mono font-bold tabular-nums tracking-tighter ${isOvertime ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                    {isShowLive ? formatDuration(remainingSeconds) : `${currentSlot?.durationMinutes}:00`}
                  </div>
                  {nextSlot && (
                    <div className="mt-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                      <span className="opacity-50">Next:</span>
                      <span className="truncate max-w-[200px]">{nextSlot.title}</span>
                    </div>
                  )}
                </div>

                {/* Primary Play/Next/Prev Controls */}
                <div className="grid grid-cols-3 gap-6 items-center mb-10">
                  <button
                    onClick={handlePrev}
                    disabled={optimisticIndex === 0}
                    className="aspect-square rounded-[30px] flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30 active:scale-95 transition-all"
                  >
                    <SkipBack size={32} />
                  </button>

                  <button
                    onClick={handleToggle}
                    className={`aspect-square rounded-[40px] flex items-center justify-center transition-all active:scale-90 shadow-2xl ${
                      optimisticTimerActive 
                        ? 'bg-rose-600 text-white shadow-rose-500/30' 
                        : 'bg-indigo-600 text-white shadow-indigo-500/30 shadow-indigo-600/20'
                    }`}
                  >
                    {!isShowLive ? (
                      <span className="text-xs font-black uppercase tracking-widest text-white">Start</span>
                    ) : (
                      optimisticTimerActive ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />
                    )}
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={optimisticIndex >= program.slots.length - 1}
                    className="aspect-square rounded-[30px] flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
                  >
                    <SkipForward size={32} />
                  </button>
                </div>

                {/* Secondary Toggles (Manual/Hold) */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={onToggleManualMode}
                    className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      program.isManualMode 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-transparent opacity-70'
                    }`}
                  >
                    <MousePointerClick size={16} />
                    {program.isManualMode ? 'Manual Mode' : 'Auto Mode'}
                  </button>

                  <button
                    onClick={onToggleHold}
                    className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      program.isOnHold 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200 shadow-sm' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-transparent opacity-70'
                    }`}
                  >
                    <Zap size={16} className={program.isOnHold ? 'animate-pulse' : ''} />
                    {program.isOnHold ? 'HOLD FOR CUE' : 'RELEASE CUE'}
                  </button>
                </div>

                {/* Production HUD Tools (Nudge/Analysis/End) - Only if live */}
                {isShowLive && (
                  <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-[32px] border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <button onClick={() => onNudge(-1)} className="p-3 text-slate-500 hover:text-indigo-500 active:scale-90"><Minus size={20} /></button>
                          <div className="flex flex-col items-center px-4 border-x border-slate-100 dark:border-slate-800">
                            <Timer size={14} className="text-indigo-500 mb-0.5" />
                            <span className="text-[10px] font-black text-slate-400">NUDGE</span>
                          </div>
                          <button onClick={() => onNudge(1)} className="p-3 text-slate-500 hover:text-indigo-500 active:scale-90"><Plus size={20} /></button>
                      </div>

                      <button 
                        onClick={() => onViewAnalysis(program.id)}
                        className="flex flex-col items-center justify-center gap-1 w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-amber-500 active:scale-90"
                      >
                        <BarChart3 size={24} />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Report</span>
                      </button>
                    </div>

                    <button
                      onMouseDown={() => setIsEnding(true)}
                      onMouseUp={() => setIsEnding(false)}
                      onMouseLeave={() => setIsEnding(false)}
                      onTouchStart={() => setIsEnding(true)}
                      onTouchEnd={() => setIsEnding(false)}
                      className="relative w-full h-16 group overflow-hidden bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
                    >
                      <div
                        className="absolute inset-0 bg-rose-950 opacity-40 origin-left transition-transform duration-75"
                        style={{ transform: `scaleX(${holdToEnd / 100})` }}
                      />
                      <Power size={20} className="relative z-10" />
                      <span className="relative z-10">
                        {holdToEnd > 0 ? `Hold to Confirm (${Math.floor(holdToEnd)}%)` : 'End Production'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* --- SCHEDULE TAB --- */
              <div className="flex flex-col gap-2 animate-in slide-in-from-right-4 duration-300">
                {program.slots.map((slot, idx) => (
                  <div 
                    key={slot.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      idx === optimisticIndex 
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                      idx === optimisticIndex ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate ${idx === optimisticIndex ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                        {slot.title}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {slot.durationMinutes} min • {slot.type}
                      </div>
                    </div>
                    {idx === optimisticIndex && isShowLive && (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <Zap size={14} fill="currentColor" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper components for the tools
const Plus = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const Minus = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
