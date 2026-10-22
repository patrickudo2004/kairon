import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Program } from '../types';
import { PRODUCTION_TEMPLATES } from '../utils/rundownParser';
import {
  Search,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Save,
  FolderOpen,
  Layers,
  Monitor,
  Edit3,
  LayoutDashboard,
  Radio,
  BookOpen,
  Clock,
  FileSpreadsheet,
  X,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program;
  isTimerActive: boolean;
  onToggleTimer: () => void;
  onNextSlot: () => void;
  onPrevSlot: () => void;
  onToggleHold: () => void;
  onSaveKaironFile: () => void;
  onOpenKaironFile: () => void;
  onExportCsv: () => void;
  onApplyTemplate: (templateId: string) => void;
  onOpenIntegrations: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  program,
  isTimerActive,
  onToggleTimer,
  onNextSlot,
  onPrevSlot,
  onToggleHold,
  onSaveKaironFile,
  onOpenKaironFile,
  onExportCsv,
  onApplyTemplate,
  onOpenIntegrations,
}) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  const actions = useMemo(() => {
    const base = [
      {
        id: 'toggle-timer',
        category: 'Live Control',
        label: isTimerActive ? 'Pause Live Countdown' : 'Start Live Countdown',
        shortcut: 'Space',
        icon: isTimerActive ? Pause : Play,
        run: () => onToggleTimer(),
      },
      {
        id: 'next-slot',
        category: 'Live Control',
        label: 'Advance to Next Slot',
        shortcut: 'N',
        icon: SkipForward,
        run: () => onNextSlot(),
      },
      {
        id: 'prev-slot',
        category: 'Live Control',
        label: 'Return to Previous Slot',
        shortcut: 'P',
        icon: SkipBack,
        run: () => onPrevSlot(),
      },
      {
        id: 'hold-cue',
        category: 'Live Control',
        label: program.isOnHold ? 'Resume from Hold for Cue' : 'Hold for Cue (Standby Freeze)',
        shortcut: 'H',
        icon: Clock,
        run: () => onToggleHold(),
      },
      {
        id: 'save-kairon',
        category: 'Portable Files',
        label: 'Save Event as Portable .kairon File',
        shortcut: 'Ctrl+S',
        icon: Save,
        run: () => onSaveKaironFile(),
      },
      {
        id: 'open-kairon',
        category: 'Portable Files',
        label: 'Open / Import .kairon or .csv File...',
        shortcut: 'Ctrl+O',
        icon: FolderOpen,
        run: () => onOpenKaironFile(),
      },
      {
        id: 'export-csv',
        category: 'Portable Files',
        label: 'Export Schedule to CSV Spreadsheet',
        icon: FileSpreadsheet,
        run: () => onExportCsv(),
      },
      {
        id: 'open-integrations',
        category: 'Broadcast Bridges',
        label: 'Configure OBS / vMix / ATEM / ProPresenter 7 Bridges',
        icon: Layers,
        run: () => onOpenIntegrations(),
      },
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        label: 'Go to Event Library Dashboard',
        icon: LayoutDashboard,
        run: () => navigate('/'),
      },
      {
        id: 'nav-editor',
        category: 'Navigation',
        label: 'Go to Rundown Editor',
        shortcut: '1',
        icon: Edit3,
        run: () => navigate(`/editor?id=${program.id}`),
      },
      {
        id: 'nav-live',
        category: 'Navigation',
        label: 'Go to Live Control Console',
        shortcut: '2',
        icon: Play,
        run: () => navigate(`/live?id=${program.id}`),
      },
      {
        id: 'nav-monitors',
        category: 'Navigation',
        label: 'Go to Monitors & Displays Matrix',
        shortcut: '3',
        icon: Monitor,
        run: () => navigate(`/monitors?id=${program.id}`),
      },
      {
        id: 'nav-command',
        category: 'Navigation',
        label: 'Go to Multi-Track Command Center',
        icon: Radio,
        run: () => navigate('/command'),
      },
      ...PRODUCTION_TEMPLATES.map((t) => ({
        id: `tmpl-${t.id}`,
        category: 'Production Templates',
        label: `Load Template: ${t.name} (${t.slots.length} slots)`,
        icon: BookOpen,
        run: () => onApplyTemplate(t.id),
      })),
    ];

    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query, isTimerActive, program.id, program.isOnHold]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 p-4 font-sans animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2D333F] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3.5 border-b border-slate-200 dark:border-[#22262E] flex items-center gap-3 bg-slate-50 dark:bg-[#090A0C]">
          <Search size={16} className="text-[#0EA5E9] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a studio command, template, or view name..."
            className="flex-1 bg-transparent text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {actions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onClose();
                  item.run();
                }}
                className="w-full px-3 py-2 rounded-lg hover:bg-[#0EA5E9]/15 text-left flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={14} className="text-[#0EA5E9] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-semibold text-slate-900 dark:text-white group-hover:text-[#0EA5E9] truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-[#6A7382]">
                      {item.category}
                    </div>
                  </div>
                </div>
                {item.shortcut && (
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] text-[10px] font-mono text-slate-500 dark:text-[#8A93A4] shrink-0">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
          {actions.length === 0 && (
            <div className="p-6 text-center text-xs font-mono text-slate-400">
              No matching studio commands found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
