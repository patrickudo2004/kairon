import React, { useRef, useEffect, useState } from 'react';
import { Program } from '../types';
import { Clock, ChevronRight, Play, ChevronDown, ChevronUp } from 'lucide-react';

interface ScheduleListProps {
  program: Program;
  currentSlotIndex: number;
  secondsElapsed: number;
  isTimerActive: boolean;
  readOnly?: boolean;
}

const ScheduleList: React.FC<ScheduleListProps> = ({
  program,
  currentSlotIndex,
  secondsElapsed,
  isTimerActive,
  readOnly = false
}) => {
  const activeItemRef = useRef<HTMLDivElement>(null);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());

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
    <div className="max-w-3xl mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur py-4 z-10 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Full Schedule</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{program.date} &bull; Starts {minutesToTime(startMinutes)}</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Time</div>
          <div className="text-xl font-mono text-indigo-600 dark:text-indigo-400">
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
          const remainingSeconds = Math.max(0, durationSeconds - secondsElapsed);

          return (
            <div
              key={slot.id}
              ref={isCurrent ? activeItemRef : null}
              className={`relative rounded-xl border transition-all duration-300 overflow-hidden ${isCurrent
                ? 'bg-white dark:bg-slate-800 border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
                : isPast
                  ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/50 opacity-60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
            >
              {/* Progress Background for Current Slot */}
              {isCurrent && (
                <div
                  className="absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-1000 bg-indigo-500"
                  style={{ width: `${Math.min(100, (secondsElapsed / durationSeconds) * 100)}%` }}
                />
              )}

              <div
                className="p-4 flex items-start gap-4 relative z-10 cursor-pointer"
                onClick={(e) => toggleDetails(slot.id, e)}
              >
                {/* Time Column */}
                <div className="flex flex-col items-center min-w-[3.5rem] border-r border-slate-200 dark:border-slate-700/50 pr-4 pt-1">
                  <span className={`text-sm font-mono font-bold ${isCurrent ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}>
                    {minutesToTime(slotStart)}
                  </span>
                  {isCurrent && (
                    <span className="mt-2 text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded animate-pulse">
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
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      <h3 className={`font-semibold truncate pr-2 ${isCurrent ? 'text-slate-900 dark:text-white text-lg' : 'text-slate-700 dark:text-slate-300'}`}>
                        {slot.title}
                      </h3>
                    </div>

                    {isCurrent && (
                      <div className="font-mono font-bold whitespace-nowrap text-indigo-600 dark:text-indigo-300">
                        -{formatDuration(remainingSeconds)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pl-7">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                      <span className={`${isCurrent ? 'text-indigo-700 dark:text-indigo-200' : ''}`}>{slot.speaker || slot.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${slot.type === 'Break'
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                        {slot.type}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        {slot.durationMinutes}m
                      </span>
                    </div>
                  </div>

                  {/* Details Paragraph */}
                  {isExpanded && slot.details && (
                    <div className="mt-3 ml-7 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200">
                      {slot.details}
                    </div>
                  )}
                  {isExpanded && !slot.details && (
                    <div className="mt-3 ml-7 p-2 text-xs text-slate-400 italic">
                      No details available for this slot.
                    </div>
                  )}
                </div>

                {/* Action Arrow - Only show if not read only or just show icon without action? */}
                {isCurrent && !readOnly && (
                  <div className="text-indigo-500 pl-2 pt-1">
                    {isTimerActive ? <Clock className="animate-pulse" size={20} /> : <Play size={20} className="opacity-50" />}
                  </div>
                )}
                {isCurrent && readOnly && (
                  <div className="text-indigo-500 pl-2 pt-1">
                    <Clock className={isTimerActive ? "animate-pulse" : ""} size={20} />
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