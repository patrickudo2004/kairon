import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Program } from '../types';
import { PRODUCTION_TEMPLATES } from '../utils/rundownParser';
import {
  FileText,
  FolderOpen,
  Save,
  Download,
  FileSpreadsheet,
  Plus,
  Copy,
  FastForward,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Clock,
  Zap,
  Monitor,
  Tv,
  Layers,
  PanelLeft,
  PanelRight,
  Command,
  HelpCircle,
  Keyboard,
  BookOpen,
  Sparkles,
  Check,
  Radio,
  AppWindow,
} from 'lucide-react';

interface StudioMenuBarProps {
  program: Program;
  isTimerActive: boolean;
  isAutopilotEnabled: boolean;
  isSidebarCollapsed: boolean;
  isRightDockOpen: boolean;
  lastArchivedPath: string | null;
  onCreateNewEvent: () => void;
  onOpenKaironFile: () => void;
  onSaveKaironFile: () => void;
  onExportCsv: () => void;
  onOpenExportPdf: () => void;
  onDuplicateEvent: () => void;
  onTurnaroundEvent: () => void;
  onApplyTemplate: (templateId: string) => void;
  onToggleAutopilot: () => void;
  onToggleManualMode: () => void;
  onToggleTimer: () => void;
  onNextSlot: () => void;
  onPrevSlot: () => void;
  onNudge: (mins: number) => void;
  onToggleHold: () => void;
  onClearStageMessage: () => void;
  onProjectScreen: (path: string, screenIdx: number, winId: string) => void;
  onOpenIntegrations: () => void;
  onToggleSidebar: () => void;
  onToggleRightDock: () => void;
  onOpenCommandPalette: () => void;
  onOpenHotkeys: () => void;
  onOpenPip?: () => void;
}

type MenuKey = 'file' | 'edit' | 'rundown' | 'live' | 'displays' | 'integrations' | 'window' | 'help' | null;

export const StudioMenuBar: React.FC<StudioMenuBarProps> = ({
  program,
  isTimerActive,
  isAutopilotEnabled,
  isSidebarCollapsed,
  isRightDockOpen,
  lastArchivedPath,
  onCreateNewEvent,
  onOpenKaironFile,
  onSaveKaironFile,
  onExportCsv,
  onOpenExportPdf,
  onDuplicateEvent,
  onTurnaroundEvent,
  onApplyTemplate,
  onToggleAutopilot,
  onToggleManualMode,
  onToggleTimer,
  onNextSlot,
  onPrevSlot,
  onNudge,
  onToggleHold,
  onClearStageMessage,
  onProjectScreen,
  onOpenIntegrations,
  onToggleSidebar,
  onToggleRightDock,
  onOpenCommandPalette,
  onOpenHotkeys,
  onOpenPip,
}) => {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const runAction = (fn: () => void) => {
    setOpenMenu(null);
    fn();
  };

  const MenuItem: React.FC<{
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    shortcut?: string;
    active?: boolean;
    onClick: () => void;
  }> = ({ icon: Icon, label, shortcut, active, onClick }) => (
    <button
      type="button"
      onClick={() => runAction(onClick)}
      className="w-full px-3 py-1.5 text-left flex items-center justify-between gap-4 text-xs font-mono text-slate-700 dark:text-[#E1E4EA] hover:bg-[#0EA5E9]/15 hover:text-[#0EA5E9] rounded transition-colors"
    >
      <span className="flex items-center gap-2 truncate">
        {Icon ? <Icon size={13} className="text-slate-400 dark:text-[#8A93A4] shrink-0" /> : <span className="w-3.5" />}
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        {active && <Check size={12} className="text-[#10B981]" />}
        {shortcut && <span className="text-[10px] text-slate-400 dark:text-[#6A7382]">{shortcut}</span>}
      </span>
    </button>
  );

  const MenuDivider = () => <div className="my-1 border-t border-slate-200 dark:border-[#22262E]" />;

  const menus: { key: Exclude<MenuKey, null>; label: string }[] = [
    { key: 'file', label: 'File' },
    { key: 'edit', label: 'Edit' },
    { key: 'rundown', label: 'Rundown' },
    { key: 'live', label: 'Live Control' },
    { key: 'displays', label: 'Displays' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'window', label: 'Window' },
    { key: 'help', label: 'Help' },
  ];

  return (
    <div
      ref={menuBarRef}
      className="hidden lg:flex h-7 shrink-0 bg-slate-100 dark:bg-[#090A0C] border-b border-slate-200 dark:border-[#22262E] px-3 items-center justify-between select-none z-50 no-print font-mono text-[11px]"
    >
      {/* Left: Studio Application Menus */}
      <div className="flex items-center gap-0.5">
        <span className="px-2 py-0.5 font-extrabold tracking-widest text-[#0EA5E9] uppercase mr-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
          KAIRON STUDIO
        </span>

        {menus.map((m) => (
          <div key={m.key} className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === m.key ? null : m.key)}
              onMouseEnter={() => {
                if (openMenu !== null) setOpenMenu(m.key);
              }}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                openMenu === m.key
                  ? 'bg-white dark:bg-[#181B22] text-[#0EA5E9] font-bold'
                  : 'text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#121418]'
              }`}
            >
              {m.label}
            </button>

            {openMenu === m.key && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2D333F] rounded-lg p-1.5 shadow-2xl z-[110] animate-in fade-in duration-100">
                {m.key === 'file' && (
                  <>
                    <MenuItem icon={Plus} label="New Event Rundown" shortcut="Alt+N" onClick={onCreateNewEvent} />
                    <MenuDivider />
                    <MenuItem icon={FolderOpen} label="Open .kairon File..." shortcut="Ctrl+O" onClick={onOpenKaironFile} />
                    <MenuItem icon={Save} label="Save .kairon File" shortcut="Ctrl+S" onClick={onSaveKaironFile} />
                    <MenuDivider />
                    <MenuItem icon={Download} label="Export Printable PDF..." onClick={onOpenExportPdf} />
                    <MenuItem icon={FileSpreadsheet} label="Export CSV Spreadsheet" onClick={onExportCsv} />
                  </>
                )}

                {m.key === 'edit' && (
                  <>
                    <MenuItem
                      icon={FileText}
                      label="Open Rundown Editor"
                      shortcut="1"
                      onClick={() => navigate(`/editor?id=${program.id}`)}
                    />
                    <MenuItem icon={Copy} label="Duplicate Active Event" onClick={onDuplicateEvent} />
                    <MenuItem
                      icon={FastForward}
                      label="Turnaround Next Service (+2h)"
                      onClick={onTurnaroundEvent}
                    />
                  </>
                )}

                {m.key === 'rundown' && (
                  <>
                    <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#6A7382]">
                      Load Production Template
                    </div>
                    {PRODUCTION_TEMPLATES.map((t) => (
                      <MenuItem
                        key={t.id}
                        icon={BookOpen}
                        label={t.name}
                        shortcut={`${t.slots.length} slots`}
                        onClick={() => onApplyTemplate(t.id)}
                      />
                    ))}
                    <MenuDivider />
                    <MenuItem
                      icon={Sparkles}
                      label="Autopilot Schedule Healer"
                      shortcut="A"
                      active={isAutopilotEnabled}
                      onClick={onToggleAutopilot}
                    />
                    <MenuItem
                      icon={Zap}
                      label="Auto-Advance Mode"
                      shortcut="M"
                      active={!program.isManualMode}
                      onClick={onToggleManualMode}
                    />
                  </>
                )}

                {m.key === 'live' && (
                  <>
                    <MenuItem
                      icon={isTimerActive ? Pause : Play}
                      label={isTimerActive ? 'Pause Countdown' : 'Start Live Countdown'}
                      shortcut="Space"
                      onClick={onToggleTimer}
                    />
                    <MenuItem icon={SkipForward} label="Next Slot" shortcut="N" onClick={onNextSlot} />
                    <MenuItem icon={SkipBack} label="Previous Slot" shortcut="P" onClick={onPrevSlot} />
                    <MenuDivider />
                    <MenuItem label="Nudge +1 Minute" shortcut="+" onClick={() => onNudge(1)} />
                    <MenuItem label="Nudge -1 Minute" shortcut="-" onClick={() => onNudge(-1)} />
                    <MenuDivider />
                    <MenuItem
                      icon={Clock}
                      label="Hold for Cue (Standby)"
                      shortcut="H"
                      active={!!program.isOnHold}
                      onClick={onToggleHold}
                    />
                    <MenuItem label="Clear Stage Banner / Strobe" onClick={onClearStageMessage} />
                  </>
                )}

                {m.key === 'displays' && (
                  <>
                    <MenuItem
                      icon={Monitor}
                      label="Project Stage to Screen 2"
                      onClick={() => onProjectScreen(`/stage?programId=${program.id}`, 2, 'kairon_display_stage')}
                    />
                    <MenuItem
                      icon={Tv}
                      label="Project TV to Screen 3"
                      onClick={() => onProjectScreen(`/tv?programId=${program.id}`, 3, 'kairon_display_tv')}
                    />
                    <MenuDivider />
                    <MenuItem
                      label="Open Stage Display Window"
                      onClick={() => window.open(`/stage?programId=${program.id}`, 'kairon_display_stage', 'width=1280,height=720')}
                    />
                    <MenuItem
                      label="Open Teleprompter Window"
                      onClick={() => window.open(`/prompter?programId=${program.id}`, 'kairon_display_prompter', 'width=1280,height=720')}
                    />
                    <MenuItem
                      label="Open TV / Overflow Window"
                      onClick={() => window.open(`/tv?programId=${program.id}`, 'kairon_display_tv', 'width=1280,height=720')}
                    />
                    <MenuItem
                      label="Open Crew Tactical HUD"
                      onClick={() => window.open(`/crew?programId=${program.id}`, 'kairon_display_crew', 'width=1280,height=720')}
                    />
                    <MenuItem
                      label="Open OBS Lower-Third Overlay"
                      onClick={() => window.open(`/overlay?programId=${program.id}&layout=lower-third&bg=transparent`, 'kairon_display_overlay', 'width=1280,height=720')}
                    />
                  </>
                )}

                {m.key === 'integrations' && (
                  <>
                    <MenuItem
                      icon={Layers}
                      label="OBS / vMix / ATEM Overlay Setup..."
                      onClick={onOpenIntegrations}
                    />
                    <MenuItem
                      icon={Radio}
                      label="ProPresenter 7 Network Bridge..."
                      onClick={onOpenIntegrations}
                    />
                    <MenuItem
                      icon={Keyboard}
                      label="Stream Deck & NDI Configuration..."
                      onClick={onOpenIntegrations}
                    />
                  </>
                )}

                {m.key === 'window' && (
                  <>
                    <MenuItem
                      icon={Command}
                      label="Studio Command Palette..."
                      shortcut="Ctrl+K"
                      onClick={onOpenCommandPalette}
                    />
                    <MenuDivider />
                    <MenuItem
                      icon={PanelLeft}
                      label={isSidebarCollapsed ? 'Expand Left Navigation Rail' : 'Collapse Left Navigation Rail'}
                      shortcut="Ctrl+B"
                      onClick={onToggleSidebar}
                    />
                    <MenuItem
                      icon={PanelRight}
                      label={isRightDockOpen ? 'Hide Right Studio Dock' : 'Show Right Studio Dock'}
                      shortcut="Ctrl+\"
                      onClick={onToggleRightDock}
                    />
                    {onOpenPip && (
                      <MenuItem
                        icon={AppWindow}
                        label="Open Floating PiP Controller"
                        onClick={onOpenPip}
                      />
                    )}
                  </>
                )}

                {m.key === 'help' && (
                  <>
                    <MenuItem icon={HelpCircle} label="Interactive Studio User Guide" onClick={() => navigate('/guide')} />
                    <MenuItem icon={Keyboard} label="Broadcast Hotkeys Cheat Sheet" shortcut="?" onClick={onOpenHotkeys} />
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right: Quick Command Palette Trigger & Local File Status */}
      <div className="flex items-center gap-2">
        {lastArchivedPath && (
          <span
            className="text-[10px] text-[#10B981] truncate max-w-[220px]"
            title={`Saved to ${lastArchivedPath}`}
          >
            ✓ Saved: {lastArchivedPath.split(/[\\/]/).pop()}
          </span>
        )}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="px-2 py-0.5 rounded bg-white dark:bg-[#121418] hover:bg-slate-200 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-slate-500 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors"
          title="Open Studio Command Palette (Ctrl+K)"
        >
          <Command size={11} className="text-[#0EA5E9]" />
          <span>Command Palette</span>
          <kbd className="px-1 rounded bg-slate-100 dark:bg-[#090A0C] text-[9px] text-slate-400">Ctrl+K</kbd>
        </button>
      </div>
    </div>
  );
};
