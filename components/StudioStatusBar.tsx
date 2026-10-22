import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Monitor, Sparkles, Volume2, Lightbulb, Video, HardDrive } from 'lucide-react';
import { getOfflineLedger } from '../services/offlineSyncLedger';

interface StudioStatusBarProps {
  isOnline: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  isAutopilotEnabled: boolean;
  onToggleAutopilot: () => void;
  connectedDisplayCount: number;
  isSoundAcked?: boolean;
  isLightsAcked?: boolean;
  isVideoAcked?: boolean;
  lastArchivedPath?: string | null;
}

export const StudioStatusBar: React.FC<StudioStatusBarProps> = ({
  isOnline,
  saveStatus,
  isAutopilotEnabled,
  onToggleAutopilot,
  connectedDisplayCount,
  isSoundAcked,
  isLightsAcked,
  isVideoAcked,
  lastArchivedPath,
}) => {
  const [wallClock, setWallClock] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineLedger().length);

  useEffect(() => {
    const t = setInterval(() => {
      setWallClock(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleLedger = () => setOfflineQueueCount(getOfflineLedger().length);
    window.addEventListener('kairon_ledger_updated', handleLedger);
    window.addEventListener('storage', handleLedger);
    return () => {
      window.removeEventListener('kairon_ledger_updated', handleLedger);
      window.removeEventListener('storage', handleLedger);
    };
  }, []);

  return (
    <footer className="hidden lg:flex h-6 shrink-0 bg-slate-100 dark:bg-[#090A0C] border-t border-slate-200 dark:border-[#22262E] px-3 items-center justify-between select-none z-40 no-print font-mono text-[10px] text-slate-500 dark:text-[#8A93A4]">
      {/* Left Telemetry Cluster */}
      <div className="flex items-center gap-3">
        {/* Cloud / Local-First Offline Relay Status */}
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <>
              <Wifi size={11} className="text-[#10B981]" />
              <span className="text-[#10B981] font-bold">Live Sync</span>
              <span className="text-slate-400 dark:text-[#6A7382]">
                ({saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Pending' : 'Cloud Connected'})
              </span>
            </>
          ) : (
            <>
              <WifiOff size={11} className="text-[#F59E0B]" />
              <span className="text-[#F59E0B] font-bold">
                LOCAL-FIRST RELAY ({offlineQueueCount} queued)
              </span>
            </>
          )}
        </div>

        <span className="text-slate-300 dark:text-[#22262E]">|</span>

        {/* Autopilot Toggle */}
        <button
          type="button"
          onClick={onToggleAutopilot}
          className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Toggle Deterministic Autopilot Schedule Healer"
        >
          <Sparkles size={10} className={isAutopilotEnabled ? 'text-[#10B981]' : 'text-slate-400'} />
          <span>
            AUTOPILOT:{' '}
            <strong className={isAutopilotEnabled ? 'text-[#10B981]' : 'text-slate-400'}>
              {isAutopilotEnabled ? 'ARMED' : 'MANUAL'}
            </strong>
          </span>
        </button>

        <span className="text-slate-300 dark:text-[#22262E]">|</span>

        {/* Active Hardware Displays */}
        <div className="flex items-center gap-1">
          <Monitor size={10} className="text-[#0EA5E9]" />
          <span>DISPLAYS: {connectedDisplayCount}</span>
        </div>

        {lastArchivedPath && (
          <>
            <span className="text-slate-300 dark:text-[#22262E]">|</span>
            <div className="flex items-center gap-1 text-[#0EA5E9]">
              <HardDrive size={10} />
              <span className="truncate max-w-[180px]">DISK ARCHIVE ACTIVE</span>
            </div>
          </>
        )}
      </div>

      {/* Right Telemetry Cluster */}
      <div className="flex items-center gap-3">
        {/* Crew Readiness Tally */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-[#6A7382]">CREW:</span>
          <span className={isSoundAcked ? 'text-[#10B981] font-bold' : 'text-slate-400'}>
            S {isSoundAcked ? '✓' : '·'}
          </span>
          <span className={isLightsAcked ? 'text-[#10B981] font-bold' : 'text-slate-400'}>
            L {isLightsAcked ? '✓' : '·'}
          </span>
          <span className={isVideoAcked ? 'text-[#10B981] font-bold' : 'text-slate-400'}>
            V {isVideoAcked ? '✓' : '·'}
          </span>
        </div>

        <span className="text-slate-300 dark:text-[#22262E]">|</span>

        {/* Master Wall Clock */}
        <span className="font-bold text-slate-800 dark:text-[#E1E4EA] tabular-nums">{wallClock}</span>

        <span className="text-slate-300 dark:text-[#22262E]">|</span>

        <span className="text-slate-400 dark:text-[#6A7382]">v1.0.4</span>
      </div>
    </footer>
  );
};
