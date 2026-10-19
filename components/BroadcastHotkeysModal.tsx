import React from 'react';
import { X, Keyboard, Radio, Play, Pause, SkipForward, SkipBack, Plus, Minus, Clock, Zap, Monitor, Tv, Sliders, Maximize } from 'lucide-react';

interface BroadcastHotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BroadcastHotkeysModal: React.FC<BroadcastHotkeysModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = [
    {
      title: 'Studio Transport & Timers',
      icon: Radio,
      shortcuts: [
        { key: 'Space', action: 'Master Play / Pause Countdown', icon: Play },
        { key: 'N', action: 'Next Slot (Advance)', icon: SkipForward },
        { key: 'P', action: 'Previous Slot (Return)', icon: SkipBack },
        { key: '+ / -', action: 'Nudge Current Slot ±1 Minute', icon: Plus },
        { key: 'H', action: 'Hold for Cue (Standby Freeze)', icon: Clock },
        { key: 'M', action: 'Toggle Manual Advance Mode', icon: Sliders },
        { key: 'A', action: 'Toggle Autopilot Rebalancing', icon: Zap },
      ]
    },
    {
      title: 'Console Views & Routing',
      icon: Monitor,
      shortcuts: [
        { key: '1', action: 'Switch to Program Editor', icon: null },
        { key: '2', action: 'Switch to Live Console', icon: null },
        { key: '3', action: 'Switch to Monitor & Display Hub', icon: null },
        { key: '4', action: 'Switch to Post-Show Analytics', icon: null },
      ]
    },
    {
      title: 'Screen & Navigation',
      icon: Tv,
      shortcuts: [
        { key: 'F / F11', action: 'Toggle Fullscreen Mode', icon: Maximize },
        { key: '?', action: 'Toggle This Keyboard Reference', icon: Keyboard },
        { key: 'Esc', action: 'Close Modal / Exit Fullscreen', icon: X },
      ]
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 select-none font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-xl shadow-2xl max-w-2xl w-full p-6 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#22262E] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded-lg border border-[#0EA5E9]/30">
              <Keyboard size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Broadcast Keyboard Hotkeys</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1C2028] border border-slate-200 dark:border-[#2D333F] text-[#0EA5E9] uppercase">
                  Surface Reference
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8A93A4]">
                Instant tactile controls for live broadcast and FOH operators.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181B22] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div key={cat.title}>
              <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-slate-500 dark:text-[#8A93A4] uppercase tracking-wider">
                <cat.icon size={13} className="text-[#0EA5E9]" />
                <span>{cat.title}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.shortcuts.map((sc) => (
                  <div 
                    key={sc.key}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#0E1013] border border-slate-200 dark:border-[#1E222A] text-xs font-mono"
                  >
                    <span className="text-slate-700 dark:text-[#D1D5DB] flex items-center gap-2 truncate">
                      {sc.action}
                    </span>
                    <kbd className="px-2 py-1 bg-white dark:bg-[#181B22] border border-slate-300 dark:border-[#2A303C] rounded text-[11px] font-bold text-slate-900 dark:text-white shadow-xs ml-2 shrink-0">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-[#22262E] flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-[#6A7382]">
          <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#1C2028] border rounded text-[10px]">?</kbd> anywhere to toggle this guide</span>
          <span>KAIRON STUDIO ENGINE</span>
        </div>
      </div>
    </div>
  );
};
