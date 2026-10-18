import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { Program, Slot, SLOT_PRESETS } from '../types';
import { useStageMessages } from '../hooks/useStageMessages';
import { useScreenManagement } from '../hooks/useScreenManagement';
import { getPublicPortalUrl } from '../utils/url';
import { timeToMinutes, minutesToTime } from '../utils/time';
import {
  Monitor,
  Tv,
  MessageSquare,
  Sliders,
  Send,
  Zap,
  Trash2,
  ExternalLink,
  Play,
  Edit3,
  Clock,
  User,
  Volume2,
  Lightbulb,
  Video,
  Check,
  Copy,
  Save,
  Layers,
  ChevronRight,
  FileText,
  Sparkles,
} from 'lucide-react';

interface StudioRightDockProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program;
  editorProgram: Program;
  selectedSlotId: string | null;
  onSelectSlotId: (id: string) => void;
  onUpdateEditorProgram: (p: Program) => void;
  currentSlotIndex: number;
  isTimerActive: boolean;
  onToggleHold: () => void;
  onPlayProgram: (p: Program) => void;
  onSaveKaironFile: (p: Program) => void;
  onOpenIntegrations: () => void;
  isSoundAcked?: boolean;
  isLightsAcked?: boolean;
  isVideoAcked?: boolean;
  isReadOnly?: boolean;
}

export const StudioRightDock: React.FC<StudioRightDockProps> = ({
  isOpen,
  program,
  editorProgram,
  selectedSlotId,
  onSelectSlotId,
  onUpdateEditorProgram,
  currentSlotIndex,
  isTimerActive,
  onToggleHold,
  onPlayProgram,
  onSaveKaironFile,
  onOpenIntegrations,
  isSoundAcked,
  isLightsAcked,
  isVideoAcked,
  isReadOnly = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditorRoute = location.pathname.startsWith('/editor');
  const isDashboardOrCalendar = location.pathname === '/' || location.pathname.startsWith('/calendar');

  const targetProgram = isEditorRoute ? editorProgram : program;
  const { sendStageMessage, clearStageMessage, promptMessage } = useStageMessages(program.id);
  const { openOnTargetScreen } = useScreenManagement();

  // Top Preview Monitor Tab
  const [previewTab, setPreviewTab] = useState<'stage' | 'tv' | 'prompter' | 'overlay' | 'qr'>('stage');
  // Bottom Context Mode ('inspector' vs 'cues')
  const [bottomTab, setBottomTab] = useState<'inspector' | 'cues'>('inspector');

  // Auto-switch bottom tab based on route while allowing manual override
  useEffect(() => {
    if (location.pathname.startsWith('/live') || location.pathname.startsWith('/monitors') || location.pathname.startsWith('/command')) {
      setBottomTab('cues');
    } else {
      setBottomTab('inspector');
    }
  }, [location.pathname]);

  // Stage Cue Dispatcher state
  const [cueText, setCueText] = useState('');
  const [isStrobe, setIsStrobe] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  // Mini Preview Iframe Scaling
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.15);

  useEffect(() => {
    if (!previewContainerRef.current) return;
    const updateScale = () => {
      if (previewContainerRef.current) {
        const w = previewContainerRef.current.clientWidth;
        if (w > 0) setPreviewScale(w / 1920);
      }
    };
    updateScale();
    const obs = new ResizeObserver(updateScale);
    obs.observe(previewContainerRef.current);
    return () => obs.disconnect();
  }, [isOpen]);

  if (!isOpen) return null;

  const activePreviewPath =
    previewTab === 'stage'
      ? `/stage?programId=${program.id}&mode=thumbnail`
      : previewTab === 'tv'
      ? `/tv?programId=${program.id}&mode=thumbnail`
      : previewTab === 'prompter'
      ? `/prompter?programId=${program.id}&mode=thumbnail`
      : `/overlay?programId=${program.id}&layout=lower-third&bg=black`;

  const publicPortalUrl = getPublicPortalUrl(targetProgram);

  // Determine the inspected slot in Editor or Live
  const inspectedSlot: Slot | undefined =
    targetProgram.slots.find((s) => s.id === selectedSlotId) ||
    targetProgram.slots[isEditorRoute ? 0 : currentSlotIndex] ||
    targetProgram.slots[0];

  const handleSlotFieldUpdate = (field: keyof Slot, val: any) => {
    if (!inspectedSlot || isReadOnly) return;
    const updatedSlots = editorProgram.slots.map((s) =>
      s.id === inspectedSlot.id ? { ...s, [field]: val } : s
    );
    onUpdateEditorProgram({ ...editorProgram, slots: updatedSlots });
  };

  const handleFireCue = (text: string) => {
    if (!text.trim()) return;
    sendStageMessage(text.trim(), isStrobe ? 'strobe' : 'custom', isStrobe);
    setCueText('');
  };

  const startMinutes = timeToMinutes(targetProgram.startTime || '09:00');
  const getSlotTime = (idx: number) => {
    let mins = startMinutes;
    for (let i = 0; i < idx; i++) {
      mins += targetProgram.slots[i]?.durationMinutes || 0;
    }
    return minutesToTime(mins);
  };

  return (
    <aside className="hidden lg:flex w-80 xl:w-[340px] shrink-0 h-full bg-white dark:bg-[#0D0E12] border-l border-slate-200 dark:border-[#22262E] flex-col select-none z-30 no-print font-sans overflow-hidden">
      {/* =========================================================
          TOP MODULE: 16:9 LIVE OUTPUT PREVIEW & 1-CLICK PROJECTION
         ========================================================= */}
      <div className="p-3 border-b border-slate-200 dark:border-[#22262E] bg-slate-50/60 dark:bg-[#090A0C]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8A93A4] flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isTimerActive ? 'bg-[#10B981] animate-tally' : 'bg-[#F59E0B]'}`} />
            Output Monitor
          </span>

          {/* Output Feed Selector Pills */}
          <div className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-[#121418] p-0.5 rounded border border-slate-300/60 dark:border-[#22262E] font-mono text-[9px] font-bold">
            {(['stage', 'tv', 'prompter', 'overlay', 'qr'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreviewTab(tab)}
                className={`px-1.5 py-0.5 rounded uppercase transition-all ${
                  previewTab === tab
                    ? 'bg-[#0EA5E9] text-white'
                    : 'text-slate-500 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab === 'prompter' ? 'PRMP' : tab === 'overlay' ? 'KEY' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* 16:9 Mini Monitor Viewport */}
        <div
          ref={previewContainerRef}
          className="w-full aspect-video rounded-lg bg-[#090A0C] border border-slate-300 dark:border-[#22262E] relative overflow-hidden shadow-inner"
        >
          {previewTab === 'qr' ? (
            <div className="w-full h-full flex items-center justify-center gap-3 p-3 bg-[#090A0C] text-white">
              <div className="bg-white p-1.5 rounded shrink-0">
                <QRCode value={publicPortalUrl || 'https://kairon.app'} size={84} />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-[10px] font-mono font-bold text-[#0EA5E9] uppercase">Public Attendee QR</div>
                <p className="text-[9px] text-[#8A93A4] leading-tight">
                  Scan for live mobile schedule & notes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicPortalUrl);
                    setCopiedQr(true);
                    setTimeout(() => setCopiedQr(false), 2000);
                  }}
                  className="px-2 py-1 rounded bg-[#181B22] hover:bg-[#22262E] border border-[#2D333F] text-[9px] font-mono font-bold text-white flex items-center gap-1"
                >
                  {copiedQr ? <Check size={10} className="text-[#10B981]" /> : <Copy size={10} />}
                  <span>{copiedQr ? 'Copied URL' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          ) : (
            <iframe
              src={activePreviewPath}
              title="Studio Live Output Preview"
              className="pointer-events-none absolute top-0 left-0"
              style={{
                width: '1920px',
                height: '1080px',
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                border: 'none',
              }}
            />
          )}

          {/* Live Tally Corner Badge */}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 border border-white/15 text-[9px] font-mono font-bold text-white uppercase flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isTimerActive ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
            <span>{previewTab.toUpperCase()}</span>
          </div>
        </div>

        {/* 1-Click Hardware Display Routing Strip */}
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          <button
            type="button"
            onClick={() => openOnTargetScreen(`/stage?programId=${program.id}&autofs=1`, 2, 'kairon_display_stage')}
            className="px-2 py-1.5 rounded bg-white dark:bg-[#121418] hover:bg-[#0EA5E9]/10 hover:border-[#0EA5E9] border border-slate-200 dark:border-[#22262E] text-[10px] font-mono font-bold text-slate-700 dark:text-[#E1E4EA] flex items-center justify-center gap-1 transition-all"
            title="Project Stage Timer to Screen 2 (Pulpit Confidence Monitor)"
          >
            <Monitor size={11} className="text-[#0EA5E9]" />
            <span>Screen 2</span>
          </button>
          <button
            type="button"
            onClick={() => openOnTargetScreen(`/tv?programId=${program.id}&autofs=1`, 3, 'kairon_display_tv')}
            className="px-2 py-1.5 rounded bg-white dark:bg-[#121418] hover:bg-[#0EA5E9]/10 hover:border-[#0EA5E9] border border-slate-200 dark:border-[#22262E] text-[10px] font-mono font-bold text-slate-700 dark:text-[#E1E4EA] flex items-center justify-center gap-1 transition-all"
            title="Project TV Schedule to Screen 3 (Lobby / Overflow)"
          >
            <Tv size={11} className="text-[#10B981]" />
            <span>Screen 3</span>
          </button>
          <button
            type="button"
            onClick={onOpenIntegrations}
            className="px-2 py-1.5 rounded bg-white dark:bg-[#121418] hover:bg-[#0EA5E9]/10 hover:border-[#0EA5E9] border border-slate-200 dark:border-[#22262E] text-[10px] font-mono font-bold text-slate-700 dark:text-[#E1E4EA] flex items-center justify-center gap-1 transition-all"
            title="Configure OBS / vMix / ATEM / ProPresenter 7 Bridges"
          >
            <Layers size={11} className="text-[#A855F7]" />
            <span>OBS/ATEM</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          MIDDLE MODE SWITCHER: INSPECTOR vs. STAGE CUE DISPATCHER
         ========================================================= */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-[#22262E] bg-slate-100/60 dark:bg-[#121418] flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setBottomTab('inspector')}
          className={`flex-1 py-1.5 px-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            bottomTab === 'inspector'
              ? 'bg-white dark:bg-[#181B22] text-[#0EA5E9] border border-slate-300 dark:border-[#2D333F] shadow-xs'
              : 'text-slate-500 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders size={11} />
          <span>{isDashboardOrCalendar ? 'Event Inspector' : 'Slot Inspector'}</span>
        </button>
        <button
          type="button"
          onClick={() => setBottomTab('cues')}
          className={`flex-1 py-1.5 px-2 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            bottomTab === 'cues'
              ? 'bg-white dark:bg-[#181B22] text-[#F59E0B] border border-slate-300 dark:border-[#2D333F] shadow-xs'
              : 'text-slate-500 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare size={11} />
          <span>Stage Cues</span>
        </button>
      </div>

      {/* =========================================================
          BOTTOM CONTEXT-AWARE PANEL
         ========================================================= */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {bottomTab === 'cues' ? (
          /* --- STAGE CUE & EMERGENCY STROBE DISPATCHER --- */
          <div className="space-y-3">
            {/* Active Stage Alert Indicator */}
            {promptMessage && (
              <div className="p-2.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[9px] font-mono font-bold uppercase text-[#EF4444]">
                    Active Stage Banner
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                    {promptMessage.text}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => clearStageMessage()}
                  className="px-2 py-1 rounded bg-[#EF4444] text-white text-[10px] font-mono font-bold shrink-0"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Mode Toggle: Standard Banner vs Emergency Strobe */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E]">
              <button
                type="button"
                onClick={() => setIsStrobe(false)}
                className={`py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                  !isStrobe
                    ? 'bg-white dark:bg-[#181B22] text-[#0EA5E9] border border-slate-200 dark:border-[#2D333F]'
                    : 'text-slate-500 dark:text-[#6A7382]'
                }`}
              >
                Standard Banner
              </button>
              <button
                type="button"
                onClick={() => setIsStrobe(true)}
                className={`py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                  isStrobe
                    ? 'bg-[#EF4444] text-white shadow-sm'
                    : 'text-slate-500 dark:text-[#6A7382]'
                }`}
              >
                <Zap size={11} />
                <span>Emergency Strobe</span>
              </button>
            </div>

            {/* Custom Cue Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFireCue(cueText);
              }}
              className="space-y-2"
            >
              <textarea
                value={cueText}
                onChange={(e) => setCueText(e.target.value)}
                placeholder="Type silent message to pulpit / stage screen..."
                rows={2}
                className="w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded-lg p-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0EA5E9] resize-none"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={!cueText.trim()}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 ${
                    isStrobe ? 'bg-[#EF4444] hover:bg-red-600' : 'bg-[#0EA5E9] hover:bg-[#0284C7]'
                  }`}
                >
                  <Send size={12} />
                  <span>{isStrobe ? 'Fire Strobe Alert' : 'Send Stage Cue'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => clearStageMessage()}
                  className="px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] border border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] text-xs font-mono"
                  title="Clear Stage Message"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </form>

            {/* Quick-Fire Preset Cues */}
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#6A7382] mb-1.5">
                Quick-Fire Stage Cues
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  'WRAP UP IN 1 MINUTE',
                  'TIME IS UP — PLEASE CONCLUDE',
                  'HOLD FOR PROP / ALTAR CALL',
                  'ADJUST MIC CLOSER',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleFireCue(preset)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#121418] hover:bg-[#0EA5E9]/10 hover:border-[#0EA5E9] border border-slate-200 dark:border-[#22262E] text-left text-[11px] font-mono font-semibold text-slate-800 dark:text-[#E1E4EA] flex items-center justify-between transition-all"
                  >
                    <span className="truncate">{preset}</span>
                    <Send size={11} className="text-[#0EA5E9] shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Hold for Cue Standby Freeze Toggle */}
            <div className="pt-2 border-t border-slate-200 dark:border-[#22262E]">
              <button
                type="button"
                onClick={onToggleHold}
                className={`w-full py-2.5 px-3 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                  program.isOnHold
                    ? 'bg-[#F59E0B] text-black border-[#F59E0B] shadow-md'
                    : 'bg-slate-50 dark:bg-[#121418] text-[#F59E0B] border-[#F59E0B]/40 hover:bg-[#F59E0B]/10'
                }`}
              >
                <Clock size={13} />
                <span>{program.isOnHold ? 'RESUME FROM HOLD' : 'HOLD FOR CUE (STANDBY)'}</span>
              </button>
            </div>

            {/* Crew Readiness Tally */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E]">
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#6A7382] mb-2">
                Crew Tactical HUD Readiness
              </div>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                <div
                  className={`p-1.5 rounded border flex items-center justify-center gap-1 ${
                    isSoundAcked
                      ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981] font-bold'
                      : 'border-slate-200 dark:border-[#22262E] text-slate-400'
                  }`}
                >
                  <Volume2 size={11} />
                  <span>SOUND</span>
                </div>
                <div
                  className={`p-1.5 rounded border flex items-center justify-center gap-1 ${
                    isLightsAcked
                      ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981] font-bold'
                      : 'border-slate-200 dark:border-[#22262E] text-slate-400'
                  }`}
                >
                  <Lightbulb size={11} />
                  <span>LIGHTS</span>
                </div>
                <div
                  className={`p-1.5 rounded border flex items-center justify-center gap-1 ${
                    isVideoAcked
                      ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981] font-bold'
                      : 'border-slate-200 dark:border-[#22262E] text-slate-400'
                  }`}
                >
                  <Video size={11} />
                  <span>VIDEO</span>
                </div>
              </div>
            </div>
          </div>
        ) : isDashboardOrCalendar ? (
          /* --- DASHBOARD / CALENDAR: MASTER-DETAIL EVENT RUNDOWN INSPECTOR --- */
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E]">
              <div className="text-[10px] font-mono font-bold uppercase text-[#0EA5E9]">
                Selected Event Rundown
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {targetProgram.title}
              </h3>
              {targetProgram.subtitle && (
                <p className="text-xs text-slate-500 dark:text-[#8A93A4] truncate">{targetProgram.subtitle}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500 dark:text-[#8A93A4]">
                <span>{targetProgram.date}</span>
                <span>•</span>
                <span>{targetProgram.startTime}</span>
                <span>•</span>
                <span className="text-[#10B981] font-bold">{targetProgram.slots.length} Slots</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => navigate(`/editor?id=${targetProgram.id}`)}
                  className="py-1.5 px-2 rounded bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                >
                  <Edit3 size={11} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPlayProgram(targetProgram)}
                  className="py-1.5 px-2 rounded bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                >
                  <Play size={11} fill="currentColor" />
                  <span>Go Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSaveKaironFile(targetProgram)}
                  className="py-1.5 px-2 rounded bg-slate-200 dark:bg-[#181B22] hover:bg-slate-300 dark:hover:bg-[#22262E] text-slate-800 dark:text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                  title="Save portable .kairon file"
                >
                  <Save size={11} />
                  <span>.kairon</span>
                </button>
              </div>
            </div>

            {/* Slot Breakdown List */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#6A7382] px-1">
                Schedule Breakdown ({targetProgram.slots.reduce((a, b) => a + b.durationMinutes, 0)}m total)
              </div>
              {targetProgram.slots.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 dark:border-[#22262E] rounded-lg">
                  No slots in this event yet.
                </div>
              ) : (
                targetProgram.slots.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectSlotId(s.id);
                      navigate(`/editor?id=${targetProgram.id}`);
                    }}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-[#121418] hover:border-[#0EA5E9] border border-slate-200 dark:border-[#22262E] cursor-pointer transition-all flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                        <span>#{idx + 1}</span>
                        <span>{getSlotTime(idx)}</span>
                        <span className="text-[#0EA5E9] font-semibold">{s.type}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {s.title}
                      </div>
                      {s.speaker && (
                        <div className="text-[10px] text-slate-500 dark:text-[#8A93A4] truncate">
                          {s.speaker}
                        </div>
                      )}
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-[#090A0C] text-[10px] font-mono font-bold text-[#10B981] shrink-0 tabular-nums">
                      {s.durationMinutes}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* --- EDITOR / LIVE: SLOT INSPECTOR (CUES & TELEPROMPTER SCRIPT) --- */
          <div className="space-y-3">
            {/* Slot Selector Dropdown */}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 dark:text-[#6A7382] mb-1">
                Inspecting Rundown Slot
              </label>
              <select
                value={inspectedSlot?.id || ''}
                onChange={(e) => onSelectSlotId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0EA5E9]"
              >
                {targetProgram.slots.map((s, i) => (
                  <option key={s.id} value={s.id}>
                    #{i + 1} ({getSlotTime(i)}) — {s.title} ({s.durationMinutes}m)
                  </option>
                ))}
              </select>
            </div>

            {inspectedSlot ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 dark:text-[#6A7382] mb-1">
                      Duration (Mins)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      readOnly={isReadOnly}
                      value={inspectedSlot.durationMinutes}
                      onChange={(e) => handleSlotFieldUpdate('durationMinutes', Math.max(1, Number(e.target.value.replace(/[^0-9]/g, '')) || 1))}
                      className="w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded px-2.5 py-1.5 text-xs font-mono font-bold text-[#10B981] tabular-nums focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 dark:text-[#6A7382] mb-1">
                      Category Tag
                    </label>
                    <select
                      disabled={isReadOnly}
                      value={inspectedSlot.type}
                      onChange={(e) => handleSlotFieldUpdate('type', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded px-2 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0EA5E9]"
                    >
                      {SLOT_PRESETS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase text-slate-400 dark:text-[#6A7382] mb-1">
                    Speaker / Minister / Presenter
                  </label>
                  <input
                    type="text"
                    readOnly={isReadOnly}
                    value={inspectedSlot.speaker}
                    onChange={(e) => handleSlotFieldUpdate('speaker', e.target.value)}
                    placeholder="Assign Speaker / Minister"
                    className="w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase text-[#F59E0B] mb-1 flex items-center gap-1">
                    <Sparkles size={10} />
                    <span>Crew Production Cues (Sound / Lights / Video)</span>
                  </label>
                  <textarea
                    rows={3}
                    readOnly={isReadOnly}
                    value={inspectedSlot.productionNotes || ''}
                    onChange={(e) => handleSlotFieldUpdate('productionNotes', e.target.value)}
                    placeholder="SOUND: Mic 1 | LIGHTS: Warm Wash | VIDEO: Cam 1 + Lower-Third..."
                    className="w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0EA5E9] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold uppercase text-[#0EA5E9] mb-1 flex items-center gap-1">
                    <FileText size={10} />
                    <span>Stage Teleprompter Script (/prompter)</span>
                  </label>
                  <textarea
                    rows={5}
                    readOnly={isReadOnly}
                    value={inspectedSlot.prompterText || ''}
                    onChange={(e) => handleSlotFieldUpdate('prompterText', e.target.value)}
                    placeholder="Enter speaker script, announcements, or sermon outline for the auto-scrolling Stage Teleprompter..."
                    className="w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded-lg p-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0EA5E9] resize-y"
                  />
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-xs font-mono text-slate-400">
                Select or add a slot to inspect its Crew Cues and Teleprompter script.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
