import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery as useConvexQuery } from '../hooks/useConvexMock';
import { api } from '../convex/_generated/api';
import { Program } from '../types';
import { useTimerSync } from '../hooks/useTimerSync';
import { useStageMessages } from '../hooks/useStageMessages';
import { formatDuration } from '../utils/time';
import { Radio, Clock, User, ChevronRight, AlertTriangle } from 'lucide-react';

export const BroadcastOverlayView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const programIdParam = searchParams.get('programId') || searchParams.get('id');
  const bgMode = (searchParams.get('bg') || 'transparent').toLowerCase() as 'transparent' | 'green' | 'black';
  const layoutMode = (searchParams.get('layout') || 'lower-third').toLowerCase() as 'lower-third' | 'corner-timer' | 'full-bug';

  const rawProgram = useConvexQuery(
    api.programs.getProgramById,
    programIdParam && !programIdParam.startsWith('local-') ? { id: programIdParam } : 'skip'
  );

  const [localFallback, setLocalFallback] = useState<Program | null>(() => {
    try {
      const cached =
        (programIdParam && localStorage.getItem(`kairon_offline_cache_${programIdParam}`)) ||
        localStorage.getItem('kairon_offline_cache_live') ||
        localStorage.getItem('kairon_program');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    document.title = 'Kairon Output [OVERLAY]';
    const syncLocal = () => {
      try {
        const cached =
          (programIdParam && localStorage.getItem(`kairon_offline_cache_${programIdParam}`)) ||
          localStorage.getItem('kairon_offline_cache_live') ||
          localStorage.getItem('kairon_program');
        if (cached) setLocalFallback(JSON.parse(cached));
      } catch {
        // Ignore
      }
    };

    const channel = new BroadcastChannel('kairon_offline_sync');
    channel.addEventListener('message', syncLocal);
    window.addEventListener('storage', syncLocal);
    return () => {
      channel.removeEventListener('message', syncLocal);
      channel.close();
      window.removeEventListener('storage', syncLocal);
    };
  }, [programIdParam]);

  const program: Program | null = useMemo(() => {
    if (rawProgram) {
      return {
        ...(rawProgram as any),
        id: String((rawProgram as any)._id || (rawProgram as any).id),
      };
    }
    return localFallback;
  }, [rawProgram, localFallback]);

  const currentSlotIndex = program?.currentSlotIndex ?? 0;
  const isTimerActive = program?.isTimerActive ?? false;
  const timerStartTimestamp = program?.timerStartTimestamp ?? null;
  const secondsElapsed = program?.secondsElapsed ?? 0;

  const elapsed = useTimerSync(timerStartTimestamp, isTimerActive, secondsElapsed);
  const currentSlot = program?.slots?.[currentSlotIndex];
  const nextSlot = program?.slots?.[currentSlotIndex + 1];
  const durationSeconds = (currentSlot?.durationMinutes || 0) * 60;
  const timeLeft = durationSeconds - elapsed;
  const isOvertime = timeLeft < 0;
  const isWarning = !isOvertime && timeLeft <= 120;

  const { promptMessage } = useStageMessages(program?.id);

  // Set transparent or keyed background on body for OBS / vMix / ATEM
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    if (bgMode === 'transparent') {
      document.documentElement.style.background = 'transparent';
      document.body.style.backgroundColor = 'transparent';
    } else if (bgMode === 'green') {
      document.body.style.backgroundColor = '#00FF00';
    } else if (bgMode === 'black') {
      document.body.style.backgroundColor = '#000000';
    }
    return () => {
      document.body.style.backgroundColor = prevBg;
    };
  }, [bgMode]);

  const bgClass =
    bgMode === 'green'
      ? 'bg-[#00FF00]'
      : bgMode === 'black'
      ? 'bg-[#000000]'
      : 'bg-transparent';

  if (!program || !currentSlot) {
    return (
      <div className={`w-screen h-screen overflow-hidden ${bgClass} flex items-end p-12 select-none font-sans`}>
        <div className="bg-[#090A0C]/90 border border-[#22262E] rounded-lg px-5 py-3 text-white font-mono text-xs flex items-center gap-3 shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <span>KAIRON BROADCAST OVERLAY — STANDBY</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-screen h-screen overflow-hidden ${bgClass} relative select-none font-sans`}>
      {/* Stage Alert Banner Overlay (Top Center) */}
      {promptMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-full px-8">
          <div
            className={`px-6 py-4 rounded-xl border-2 shadow-2xl flex items-center justify-center gap-3 font-mono font-bold text-xl uppercase tracking-wider ${
              promptMessage.isStrobe
                ? 'bg-[#EF4444] text-white border-white animate-pulse'
                : 'bg-[#090A0C]/95 text-[#F59E0B] border-[#F59E0B]'
            }`}
          >
            <AlertTriangle size={24} />
            <span>{promptMessage.text}</span>
          </div>
        </div>
      )}

      {/* Layout 1: Corner Timer Bug (Top-Right) */}
      {layoutMode === 'corner-timer' && (
        <div className="fixed top-8 right-10 flex items-center gap-3 bg-[#090A0C]/92 border border-[#22262E] rounded-xl px-5 py-3 shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A93A4] truncate max-w-[200px]">
              {currentSlot.title}
            </span>
            {currentSlot.speaker && (
              <span className="text-xs font-semibold text-[#0EA5E9] truncate max-w-[200px]">
                {currentSlot.speaker}
              </span>
            )}
          </div>
          <div className="w-[1px] h-8 bg-[#22262E]" />
          <div
            className={`text-3xl font-mono font-extrabold tabular-nums tracking-tight ${
              program.isOnHold
                ? 'text-[#F59E0B]'
                : isOvertime
                ? 'text-[#EF4444]'
                : isWarning
                ? 'text-[#F59E0B]'
                : 'text-[#10B981]'
            }`}
          >
            {program.isOnHold ? 'HOLD' : formatDuration(timeLeft)}
          </div>
        </div>
      )}

      {/* Layout 2: Broadcast Lower-Third (Bottom-Left) */}
      {layoutMode === 'lower-third' && (
        <div className="fixed bottom-12 left-12 right-12 flex items-end justify-between pointer-events-none">
          <div className="bg-[#090A0C]/95 border border-[#22262E] border-l-4 border-l-[#0EA5E9] rounded-r-xl shadow-2xl overflow-hidden min-w-[540px] max-w-[780px]">
            {/* Top Bar: Event Name & Live Status */}
            <div className="px-5 py-1.5 bg-[#121418] border-b border-[#22262E] flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[#8A93A4]">
              <span className="flex items-center gap-2 font-bold text-white">
                <span className={`w-2 h-2 rounded-full ${isTimerActive ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                {program.title}
              </span>
              <span className="text-[#0EA5E9] font-bold">{currentSlot.type}</span>
            </div>

            {/* Main Lower-Third Body */}
            <div className="px-6 py-4 flex items-center justify-between gap-8">
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-bold text-white tracking-tight truncate">
                  {currentSlot.title}
                </div>
                {currentSlot.speaker && (
                  <div className="flex items-center gap-2 mt-1 text-sm font-medium text-[#0EA5E9]">
                    <User size={14} />
                    <span className="truncate">{currentSlot.speaker}</span>
                    {currentSlot.details && (
                      <span className="text-xs font-mono text-[#8A93A4] ml-2 truncate">
                        • {currentSlot.details}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right Countdown Pill */}
              <div className="flex flex-col items-end shrink-0 pl-4 border-l border-[#22262E]">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#8A93A4]">
                  {program.isOnHold ? 'STANDBY CUE' : isOvertime ? 'OVERTIME' : 'REMAINING'}
                </span>
                <span
                  className={`text-4xl font-mono font-black tabular-nums leading-none mt-0.5 ${
                    program.isOnHold
                      ? 'text-[#F59E0B]'
                      : isOvertime
                      ? 'text-[#EF4444]'
                      : isWarning
                      ? 'text-[#F59E0B]'
                      : 'text-[#10B981]'
                  }`}
                >
                  {program.isOnHold ? 'HOLD' : formatDuration(timeLeft)}
                </span>
              </div>
            </div>

            {/* Next Slot Footer Strip */}
            {nextSlot && (
              <div className="px-5 py-1.5 bg-[#0D0E12] border-t border-[#22262E] flex items-center justify-between text-[11px] font-mono text-[#8A93A4]">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="text-[#0EA5E9] font-bold uppercase">UP NEXT:</span>
                  <span className="text-white font-semibold truncate">{nextSlot.title}</span>
                  {nextSlot.speaker && <span className="text-[#8A93A4]">({nextSlot.speaker})</span>}
                </span>
                <span className="font-bold text-[#8A93A4] shrink-0">{nextSlot.durationMinutes}m</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Layout 3: Full Bottom Broadcast Ticker Strip */}
      {layoutMode === 'full-bug' && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#090A0C]/95 border-t-2 border-[#0EA5E9] px-8 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4 min-w-0">
            <span className="px-2.5 py-1 rounded bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] font-mono text-xs font-bold uppercase flex items-center gap-1.5 shrink-0">
              <Radio size={13} />
              LIVE
            </span>
            <div className="min-w-0">
              <div className="text-lg font-bold text-white truncate">{currentSlot.title}</div>
              {currentSlot.speaker && (
                <div className="text-xs font-mono text-[#0EA5E9] truncate">{currentSlot.speaker}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            {nextSlot && (
              <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#8A93A4]">
                <span className="uppercase text-[#6A7382]">NEXT:</span>
                <span className="text-white font-semibold">{nextSlot.title}</span>
                <ChevronRight size={14} className="text-[#0EA5E9]" />
              </div>
            )}
            <div
              className={`px-4 py-1.5 rounded-lg bg-[#121418] border border-[#22262E] text-3xl font-mono font-black tabular-nums ${
                isOvertime ? 'text-[#EF4444]' : isWarning ? 'text-[#F59E0B]' : 'text-[#10B981]'
              }`}
            >
              {program.isOnHold ? 'HOLD' : formatDuration(timeLeft)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastOverlayView;
