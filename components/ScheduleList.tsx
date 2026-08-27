import React, { useRef, useEffect, useState } from 'react';
import { Program } from '../types';
import { Clock, ChevronRight, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { useTimerSync } from '../hooks/useTimerSync';

interface ScheduleListProps {
  program: Program;
  currentSlotIndex: number;
  timerStartTimestamp: number | null;
  secondsElapsed?: number;
  isTimerActive: boolean;
  readOnly?: boolean;
}

const ScheduleList: React.FC<ScheduleListProps> = ({
  program,
  currentSlotIndex,
  timerStartTimestamp,
  secondsElapsed = 0,
  isTimerActive,
  readOnly = false
}) => {
  const activeItemRef = useRef<HTMLDivElement>(null);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());

  // Sync the timer heart-beat with the global anchor
  const elapsed = useTimerSync(timerStartTimestamp, isTimerActive, secondsElapsed);

  // Time Helpers
  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return (h * 60) + m;
  };

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    const h12 = h % 12 || 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSlotIndex]);

  const toggleDetails = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSlots(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startMinutes = timeToMinutes(program.startTime || "09:00");
  let runningMinutes = startMinutes;

  if (program.slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <p>No slots scheduled.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24 font-sans">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-50/95 dark:bg-[#090A0C]/95 backdrop-blur py-4 z-10 border-b border-slate-200 dark:border-[#22262E] transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Full Schedule</h2>
          <p className="text-slate-500 dark:text-[#8A93A4] text-xs font-mono mt-0.5">{program.date} &bull; Starts {minutesToTime(startMinutes)}</p>
        </div>
        <div className="text-right font-mono">
          <div className="text-[10px] font-bold text-slate-500 dark:text-[#8A93A4] uppercase tracking-wider">Current Time</div>
          <div className="text-xl font-mono font-bold text-[#0EA5E9]">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {program.slots.map((slot, index) => {
          const slotStart = runningMinutes;
          runningMinutes += slot.durationMinutes;

          const isCurrent = index === currentSlotIndex;
          const isPast = index < currentSlotIndex;
          const isExpanded = expandedSlots.has(slot.id);

          const durationSeconds = slot.durationMinutes * 60;
          const remainingSeconds = Math.max(0, durationSeconds - (isCurrent ? elapsed : 0));

          return (
            <div
              key={slot.id}
              ref={isCurrent ? activeItemRef : null}
              className={`relative rounded-xl border transition-all duration-300 overflow-hidden ${isCurrent
                ? 'bg-white dark:bg-[#121418] border-[#0EA5E9]/50 ring-1 ring-[#0EA5E9]/20 shadow-md'
                : isPast
                  ? 'bg-slate-100 dark:bg-[#0E1015] border-slate-200 dark:border-[#1E222A] opacity-60'
                  : 'bg-white dark:bg-[#121418] border-slate-200 dark:border-[#22262E]'
                }`}
            >
              {/* Progress Background for Current Slot */}
              {isCurrent && (
                <div
                  className="absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-1000 bg-[#0EA5E9]"
                  style={{ width: `${Math.min(100, (secondsElapsed / durationSeconds) * 100)}%` }}
                />
              )}

              <div
                className="p-4 flex items-start gap-4 relative z-10 cursor-pointer"
                onClick={(e) => toggleDetails(slot.id, e)}
              >
                {/* Time Column */}
                <div className="flex flex-col items-center min-w-[3.5rem] border-r border-slate-200 dark:border-[#22262E] pr-4 pt-1 font-mono">
                  <span className={`text-sm font-bold ${isCurrent ? 'text-[#0EA5E9] dark:text-white' : 'text-slate-500 dark:text-[#8A93A4]'}`}>
                    {minutesToTime(slotStart)}
                  </span>
                  {isCurrent && program.status === 'live' && (
                    <span className="mt-2 text-[10px] font-bold uppercase text-[#0EA5E9] bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 px-1.5 py-0.5 rounded animate-pulse">
                      Now
                    </span>
                  )}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {/* Dropdown Toggle */}
                      <button
                        className="text-slate-400 hover:text-[#0EA5E9] transition-colors p-0.5 rounded hover:bg-slate-100 dark:hover:bg-[#181B22]"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      <h3 className={`font-semibold truncate pr-2 ${isCurrent ? 'text-slate-900 dark:text-white text-base' : 'text-slate-700 dark:text-slate-300 text-sm'}`}>
                        {slot.title}
                      </h3>
                    </div>

                    {isCurrent && program.status === 'live' && (
                      <div className="font-mono font-bold whitespace-nowrap text-[#0EA5E9]">
                        -{formatDuration(remainingSeconds)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pl-7">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#8A93A4] font-mono">
                      <span className={`${isCurrent ? 'text-[#0EA5E9] dark:text-[#0EA5E9] font-medium' : ''}`}>{slot.speaker || slot.type}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${slot.type === 'Break'
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-[#181B22] text-slate-600 dark:text-[#8A93A4] border-slate-200 dark:border-[#22262E]'
                        }`}>
                        {slot.type}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-[#8A93A4]">
                        {slot.durationMinutes}m
                      </span>
                    </div>
                  </div>

                  {/* Details Paragraph */}
                  {isExpanded && slot.details && (
                    <div className="mt-3 ml-7 p-3 bg-slate-50 dark:bg-[#181B22] rounded-lg text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-[#22262E] animate-in fade-in slide-in-from-top-1 duration-200">
                      {slot.details}
                    </div>
                  )}
                  {isExpanded && !slot.details && (
                    <div className="mt-3 ml-7 p-2 text-xs text-slate-400 italic">
                      No details available for this slot.
                    </div>
                  )}
                </div>

                {/* Action Indicator */}
                {isCurrent && program.status === 'live' && (
                  <div className="text-[#0EA5E9] pl-2 pt-1">
                    <Clock className={isTimerActive ? "animate-pulse" : "opacity-50"} size={18} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleList;