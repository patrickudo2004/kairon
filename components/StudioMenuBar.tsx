import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Program } from '../types';
import { resolveInternalAppUrl } from '../utils/url';
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
  ArrowUpCircle,
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
  onOpenUpdateChecker?: () => void;
  hasUpdateAvailable?: boolean;
  latestVersionAvailable?: string;
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
  onOpenUpdateChecker,
  hasUpdateAvailable,
  latestVersionAvailable,
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

  const menus: { key: MenuKey; label: string }[] = [
    { key: 'file', label: 'File' },
    { key: 'edit', label: 'Edit' },
    { key: 'rundown', label: 'Rundown' },
    { key: 'live', label: 'Live' },
    { key: 'displays', label: 'Displays' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'window', label: 'Window' },
    { key: 'help', label: 'Help' },
  ];

  const handleMenuClick = (key: MenuKey) => {
    setOpenMenu(openMenu === key ? null : key);
  };

  const handleMenuHover = (key: MenuKey) => {
    if (openMenu !== null) {
      setOpenMenu(key);
    }
  };

  const MenuItem = ({
    icon: Icon,
    label,
    shortcut,
    onClick,
    disabled = false,
    active = false,
  }: {
    icon?: React.ElementType;
    label: string;
    shortcut?: string;
    onClick?: () => void;
    disabled?: boolean;
    active?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled && onClick) {
          onClick();
          setOpenMenu(null);
        }
      }}
      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors whitespace-nowrap gap-4 ${
        disabled
          ? 'text-slate-400 dark:text-[#6A7382] cursor-not-allowed opacity-50'
          : active
          ? 'bg-[#0EA5E9]/15 text-[#0EA5E9] font-bold'
          : 'text-slate-700 dark:text-[#E1E4EA] hover:bg-slate-100 dark:hover:bg-[#181B22] hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <span className="flex items-center gap-2">
        {Icon ? <Icon size={13} className="shrink-0 text-slate-400 dark:text-[#8A93A4]" /> : <span className="w-3.5" />}
        <span>{label}</span>
      </span>
      {shortcut && (
        <span className="text-[10px] font-mono text-slate-400 dark:text-[#6A7382] shrink-0 tracking-wider">
          {shortcut}
        </span>
      )}
    </button>
  );

  const MenuDivider = () => <div className="h-px my-1 bg-slate-200 dark:bg-[#22262E]" />;

  return (
    <div
      ref={menuBarRef}
      className="hidden md:flex items-center justify-between h-7 px-3 bg-slate-100 dark:bg-[#090A0C] border-b border-slate-200 dark:border-[#22262E] select-none z-50 text-xs no-print"
    >
      {/* Top Menu Dropdowns */}
      <div className="flex items-center gap-0.5">
        {menus.map((m) => (
          <div key={m.key} className="relative">
            <button
              type="button"
              onClick={() => handleMenuClick(m.key)}
              onMouseEnter={() => handleMenuHover(m.key)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                openMenu === m.key
                  ? 'bg-slate-200 dark:bg-[#181B22] text-slate-900 dark:text-white font-bold'
                  : 'text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#121418]'
              }`}
            >
              {m.label}
            </button>

            {openMenu === m.key && (
              <div className="absolute top-full left-0 mt-0.5 min-w-[280px] w-max bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-xl shadow-2xl py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                {m.key === 'file' && (
                  <>
                    <MenuItem icon={Plus} label="New Service Rundown" shortcut="Ctrl+N" onClick={onCreateNewEvent} />
                    <MenuItem icon={FolderOpen} label="Open .kairon File..." shortcut="Ctrl+O" onClick={onOpenKaironFile} />
                    <MenuItem icon={Save} label="Save .kairon File to Local Disk" shortcut="Ctrl+S" onClick={onSaveKaironFile} />
                    <MenuDivider />
                    <MenuItem icon={Download} label="Export Printable PDF..." onClick={onOpenExportPdf} />
                    <MenuItem icon={FileSpreadsheet} label="Export CSV Spreadsheet" onClick={onExportCsv} />
                  </>
                )}

                {m.key === 'edit' && (
                  <>
                    <MenuItem icon={Copy} label="Duplicate Current Event" onClick={onDuplicateEvent} />
                    <MenuItem icon={FastForward} label="Fast Turnaround (Archive & Clone)" onClick={onTurnaroundEvent} />
                  </>
                )}

                {m.key === 'rundown' && (
                  <>
                    <div className="px-3 py-1 text-[10px] font-mono uppercase text-slate-400 dark:text-[#6A7382]">
                      Apply Production Template
                    </div>
                    {PRODUCTION_TEMPLATES.map((tmpl) => (
                      <MenuItem
                        key={tmpl.id}
                        icon={BookOpen}
                        label={`${tmpl.name} (${tmpl.slots.length} slots)`}
                        onClick={() => onApplyTemplate(tmpl.id)}
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
                      onClick={() => window.open(resolveInternalAppUrl(`/stage?programId=${encodeURIComponent(program.id)}`), 'kairon_display_stage', 'width=1280,height=720')}
                    />
                    <MenuItem
                      label="Open Teleprompter Window"
                      onClick={() => window.open(resolveInternalAppUrl(`/prompter?programId=${encodeURIComponent(program.id)}`), 'kairon_display_prompter', 'width=1280,height=720')}
                    />
                    <MenuItem
                      label="Open TV / Overflow Window"
                      onClick={() => window.open(resolveInternalAppUrl(`/tv?programId=${encodeURIComponent(program.id)}`), 'kairon_display_tv', 'width=1280,height=720')}
                    />
                    <MenuItem
                      label="Open Crew Tactical HUD"
                      onClick={() => window.open(resolveInternalAppUrl(`/crew?programId=${encodeURIComponent(program.id)}`), 'kairon_display_crew', 'width=1280,height=720')}
                    />
                    <MenuItem
                      label="Open OBS Lower-Third Overlay"
                      onClick={() => window.open(resolveInternalAppUrl(`/overlay?programId=${encodeURIComponent(program.id)}&layout=lower-third&bg=transparent`), 'kairon_display_overlay', 'width=1280,height=720')}
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
                    {onOpenUpdateChecker && (
                      <>
                        <MenuItem
                          icon={hasUpdateAvailable ? ArrowUpCircle : Sparkles}
                          label={hasUpdateAvailable ? `Update Available (v${latestVersionAvailable})` : "Check for Updates..."}
                          onClick={onOpenUpdateChecker}
                        />
                        <MenuDivider />
                      </>
                    )}
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
