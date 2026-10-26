import React, { useState } from 'react';
import { Program } from '../types';
import {
  X,
  Tv,
  Radio,
  Cpu,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Wifi,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Sparkles,
} from 'lucide-react';
import {
  getProPresenterConfig,
  saveProPresenterConfig,
  testProPresenterConnection,
  ProPresenterConfig,
} from '../services/proPresenterBridge';
import { getShareableDisplayUrl, resolveInternalAppUrl } from '../utils/url';

interface BroadcastIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program;
}

export const BroadcastIntegrationsModal: React.FC<BroadcastIntegrationsModalProps> = ({
  isOpen,
  onClose,
  program,
}) => {
  const [activeTab, setActiveTab] = useState<'obs-atem' | 'propresenter' | 'companion'>('obs-atem');
  const [overlayLayout, setOverlayLayout] = useState<'lower-third' | 'corner-timer' | 'full-bug'>('lower-third');
  const [overlayBg, setOverlayBg] = useState<'transparent' | 'green' | 'magenta' | 'black'>('transparent');
  const [showCues, setShowCues] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [ppConfig, setPpConfig] = useState<ProPresenterConfig>(() => getProPresenterConfig());
  const [ppTestStatus, setPpTestStatus] = useState<{
    testing: boolean;
    ok?: boolean;
    message?: string;
  }>({ testing: false });

  if (!isOpen) return null;

  const overlayRelativePath = `/overlay?programId=${encodeURIComponent(program.id)}&layout=${overlayLayout}&bg=${overlayBg}${showCues ? '&showCues=true' : ''}`;
  const isLocalOrigin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file:') && !window.location.origin.includes('null');
  const isLocalProgram = program.id.startsWith('local-');
  const overlayFullUrl = (isLocalOrigin && isLocalProgram)
    ? `${window.location.origin}${overlayRelativePath}`
    : getShareableDisplayUrl(overlayRelativePath);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveProPresenter = (next: Partial<ProPresenterConfig>) => {
    const updated = { ...ppConfig, ...next };
    setPpConfig(updated);
    saveProPresenterConfig(updated);
  };

  const handleTestProPresenter = async () => {
    setPpTestStatus({ testing: true });
    const res = await testProPresenterConnection(ppConfig.host, ppConfig.port);
    setPpTestStatus({
      testing: false,
      ok: res.ok,
      message: res.ok ? `Connected: ${res.version}` : res.error || 'Connection failed',
    });
  };

  const openOverlayWindow = () => {
    window.open(
      resolveInternalAppUrl(overlayRelativePath),
      'kairon_display_overlay',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#22262E] bg-slate-50 dark:bg-[#090A0C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 flex items-center justify-center text-[#0EA5E9]">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Broadcast Hardware & Software Bridges
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8A93A4]">
                Connect Kairon to OBS Studio, vMix, Blackmagic ATEM, ProPresenter 7, NDI & Elgato Stream Deck
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#181B22] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-[#22262E] bg-slate-50/50 dark:bg-[#0D0E12] flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('obs-atem')}
            className={`px-3.5 py-2 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'obs-atem'
                ? 'border-[#0EA5E9] text-[#0EA5E9]'
                : 'border-transparent text-slate-500 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tv size={14} />
            <span>OBS / vMix / ATEM Overlay</span>
          </button>
          <button
            onClick={() => setActiveTab('propresenter')}
            className={`px-3.5 py-2 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'propresenter'
                ? 'border-[#0EA5E9] text-[#0EA5E9]'
                : 'border-transparent text-slate-500 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio size={14} />
            <span>ProPresenter 7 Bridge</span>
          </button>
          <button
            onClick={() => setActiveTab('companion')}
            className={`px-3.5 py-2 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'companion'
                ? 'border-[#0EA5E9] text-[#0EA5E9]'
                : 'border-transparent text-slate-500 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu size={14} />
            <span>Stream Deck & NDI Setup</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'obs-atem' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-[#8A93A4] mb-1.5">
                    1. Overlay Graphic Layout
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'lower-third', label: 'Lower-Third' },
                      { id: 'corner-timer', label: 'Corner Bug' },
                      { id: 'full-bug', label: 'Bottom Strip' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setOverlayLayout(opt.id as any)}
                        className={`px-2.5 py-2 rounded border text-xs font-mono font-semibold transition-all ${
                          overlayLayout === opt.id
                            ? 'bg-[#0EA5E9]/15 border-[#0EA5E9] text-[#0EA5E9]'
                            : 'bg-slate-50 dark:bg-[#090A0C] border-slate-200 dark:border-[#22262E] text-slate-700 dark:text-[#8A93A4]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-[#8A93A4] mb-1.5">
                    2. Keyer Background Mode
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'transparent', label: 'Alpha (OBS)' },
                      { id: 'green', label: 'Chroma (#00FF00)' },
                      { id: 'magenta', label: 'Magenta (#FF00FF)' },
                      { id: 'black', label: 'Luma (ATEM)' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setOverlayBg(opt.id as any)}
                        className={`px-2 py-2 rounded border text-xs font-mono font-semibold transition-all ${
                          overlayBg === opt.id
                            ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                            : 'bg-slate-50 dark:bg-[#090A0C] border-slate-200 dark:border-[#22262E] text-slate-700 dark:text-[#8A93A4]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safety Option: Broadcast Stage Cues */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                    Overlay Stage Cues
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-[#8A93A4]">
                    Display internal booth alerts to the stream. Recommended: Keep OFF so booth cues to the pulpit are hidden from stream viewers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCues(!showCues)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                    showCues
                      ? 'bg-[#EF4444]/20 border border-[#EF4444] text-[#EF4444]'
                      : 'bg-slate-200 dark:bg-[#181B22] border border-transparent text-slate-600 dark:text-[#8A93A4]'
                  }`}
                >
                  {showCues ? 'CUES ON' : 'CUES OFF (SAFE)'}
                </button>
              </div>

              {/* Generated Browser Source URL */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#0EA5E9]">
                    Generated Browser Source URL (1920 × 1080)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Zero-latency reactive sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={overlayFullUrl}
                    className="flex-1 bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(overlayFullUrl, 'overlay-url')}
                    className="px-3.5 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 shrink-0"
                  >
                    {copiedKey === 'overlay-url' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'overlay-url' ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <button
                    onClick={openOverlayWindow}
                    className="px-3 py-2 bg-slate-200 dark:bg-[#181B22] hover:bg-slate-300 dark:hover:bg-[#22262E] text-slate-800 dark:text-white rounded text-xs font-mono font-semibold flex items-center gap-1.5 shrink-0"
                    title="Open clean overlay window for HDMI or NDI Window Capture"
                  >
                    <ExternalLink size={13} />
                    <span>Launch</span>
                  </button>
                </div>
              </div>

              {/* Instructions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-[#22262E] bg-slate-50/50 dark:bg-[#0D0E12]">
                  <div className="font-mono font-bold text-slate-900 dark:text-white mb-1">OBS Studio / vMix</div>
                  <p className="text-slate-500 dark:text-[#8A93A4] text-[11px] leading-relaxed">
                    Add a <strong>Browser Source</strong> (`1920x1080`) with the Alpha URL above. Kairon renders with a transparent background automatically.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-[#22262E] bg-slate-50/50 dark:bg-[#0D0E12]">
                  <div className="font-mono font-bold text-slate-900 dark:text-white mb-1">Blackmagic ATEM</div>
                  <p className="text-slate-500 dark:text-[#8A93A4] text-[11px] leading-relaxed">
                    Select <strong>Luma (ATEM)</strong>, <strong>Chroma (#00FF00)</strong>, or <strong>Magenta (#FF00FF)</strong>. Project to an HDMI out into your ATEM switcher and enable Upstream Key 1.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-[#22262E] bg-slate-50/50 dark:bg-[#0D0E12]">
                  <div className="font-mono font-bold text-slate-900 dark:text-white mb-1">ProPresenter 7 Web Fill</div>
                  <p className="text-slate-500 dark:text-[#8A93A4] text-[11px] leading-relaxed">
                    In ProPresenter 7 Stage Editor, add a <strong>Web Fill</strong> element and paste the Alpha URL to embed Kairon inside your stage layout.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'propresenter' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                    Enable ProPresenter 7 Local REST Bridge
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#8A93A4] mt-0.5">
                    Forwards Kairon Stage Cues directly to ProPresenter 7's Stage Display API over your local booth LAN.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveProPresenter({ enabled: !ppConfig.enabled })}
                  className={`px-3.5 py-1.5 rounded font-mono text-xs font-bold border transition-all ${
                    ppConfig.enabled
                      ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]'
                      : 'bg-slate-200 dark:bg-[#181B22] border-slate-300 dark:border-[#2D333F] text-slate-600 dark:text-[#8A93A4]'
                  }`}
                >
                  {ppConfig.enabled ? 'BRIDGE ENABLED' : 'DISABLED'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-[#8A93A4] mb-1">
                    ProPresenter Machine IP / Hostname
                  </label>
                  <input
                    type="text"
                    value={ppConfig.host}
                    onChange={(e) => handleSaveProPresenter({ host: e.target.value.trim() })}
                    placeholder="127.0.0.1 or 192.168.1.50"
                    className="w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-[#8A93A4] mb-1">
                    Network Port (Default 1025)
                  </label>
                  <input
                    type="number"
                    value={ppConfig.port}
                    onChange={(e) => handleSaveProPresenter({ port: Number(e.target.value) || 1025 })}
                    className="w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestProPresenter}
                  disabled={ppTestStatus.testing}
                  className="px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded text-xs font-mono font-bold flex items-center gap-2"
                >
                  <Wifi size={13} />
                  <span>{ppTestStatus.testing ? 'Testing ProPresenter API...' : 'Test Connection'}</span>
                </button>

                {ppTestStatus.message && (
                  <div
                    className={`flex items-center gap-1.5 text-xs font-mono ${
                      ppTestStatus.ok ? 'text-[#10B981]' : 'text-[#F59E0B]'
                    }`}
                  >
                    {ppTestStatus.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    <span>{ppTestStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'companion' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900 dark:text-white">
                  <Terminal size={14} className="text-[#0EA5E9]" />
                  <span>Elgato Stream Deck & Bitfocus Companion Hotkey Mapping</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#8A93A4]">
                  Map physical Stream Deck buttons to Kairon's single-key broadcast hotkeys or trigger via Companion HTTP requests:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E]">
                    <span className="text-[#0EA5E9] font-bold">SPACE</span> • Play / Pause
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E]">
                    <span className="text-[#0EA5E9] font-bold">N / P</span> • Next / Prev Slot
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E]">
                    <span className="text-[#0EA5E9] font-bold">+ / -</span> • Nudge ±1 Min
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E]">
                    <span className="text-[#F59E0B] font-bold">H</span> • Hold for Cue
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] space-y-2">
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  NDI® Screen Capture & OBS Window Capture Titles
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#8A93A4]">
                  Every Kairon output window uses a deterministic title so NDI Screen Capture and OBS Window Capture lock onto the exact feed across reboots:
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-[#10B981]">
                  <div className="p-2 rounded bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E]">
                    • Kairon Output [STAGE]
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E]">
                    • Kairon Output [PROMPTER]
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E]">
                    • Kairon Output [TV]
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E]">
                    • Kairon Output [OVERLAY]
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-[#22262E] bg-slate-50 dark:bg-[#090A0C] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400">
            Active Event: {program.title}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-[#181B22] hover:bg-slate-800 dark:hover:bg-[#22262E] text-white rounded text-xs font-mono font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
