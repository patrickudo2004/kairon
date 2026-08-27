import React, { useState } from 'react';
import { Program, Organization } from '../types';
import { Monitor, Tv, Smartphone, MessageSquare, Send, ExternalLink, AlertCircle, Trash2, Zap, Activity, Crown, Copy, Check, QrCode, AppWindow, Moon, Sun, Cast, CheckCircle2, Sliders, Shield, Maximize } from 'lucide-react';
import { useStageMessages } from '../hooks/useStageMessages';
import { useScreenManagement } from '../hooks/useScreenManagement';
import QRCode from 'react-qr-code';

interface MonitorDashboardProps {
    program: Program;
    activeOrg: Organization | null;
    onLaunchFlightBridge: () => void;
    isFlightBridgeSupported: boolean;
    isPro?: boolean;
    displayStatuses?: Record<string, { isFullscreen: boolean; isOnSecondary: boolean; timestamp: number; isDarkMode?: boolean }>;
}

export const MonitorDashboard: React.FC<MonitorDashboardProps> = ({
    program,
    activeOrg,
    onLaunchFlightBridge,
    isFlightBridgeSupported,
    isPro = false,
    displayStatuses = {}
}) => {
    const { sendStageMessage, clearStageMessage } = useStageMessages(program.id);
    const { isSupported: isScreenApiSupported, screens, hasSecondaryScreen, requestScreenAccess, openOnSecondaryScreen } = useScreenManagement();

    const [customMessage, setCustomMessage] = useState('');
    const [isStrobe, setIsStrobe] = useState(false);
    const [copiedPath, setCopiedPath] = useState<string | null>(null);
    const [openQrCodes, setOpenQrCodes] = useState<Record<string, boolean>>({});
    const [localThemes, setLocalThemes] = useState<Record<string, 'dark' | 'light'>>({
        stage: 'dark',
        tv: 'dark',
        public: 'dark',
        prompter: 'dark'
    });

    const handleCopyLink = (path: string, key: string) => {
        const fullUrl = window.location.origin + path;
        navigator.clipboard.writeText(fullUrl).then(() => {
            setCopiedPath(key);
            setTimeout(() => setCopiedPath(null), 2000);
        }).catch(err => {
            console.error('Failed to copy link: ', err);
        });
    };

    const handleToggleQr = (key: string) => {
        setOpenQrCodes(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleRemoteToggleTheme = (tabId: string) => {
        const currentTheme = displayStatuses?.[tabId]?.isDarkMode !== undefined
            ? (displayStatuses[tabId].isDarkMode ? 'dark' : 'light')
            : localThemes[tabId];
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

        setLocalThemes(prev => ({
            ...prev,
            [tabId]: nextTheme
        }));

        const channel = new BroadcastChannel('kairon_displays');
        channel.postMessage({
            type: 'toggle_theme',
            tabId
        });
        channel.close();
    };

    const handleOpenAsWindow = (path: string) => {
        const width = 1280;
        const height = 720;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(
            path,
            '_blank',
            `width=${width},height=${height},left=${left},top=${top},menubar=no,status=no,toolbar=no,location=no`
        );
    };

    const handleOpenFullscreen = (path: string) => {
        const width = window.screen.availWidth || 1920;
        const height = window.screen.availHeight || 1080;
        const newWin = window.open(
            path,
            '_blank',
            `width=${width},height=${height},left=0,top=0,menubar=no,status=no,toolbar=no,location=no`
        );
        if (newWin) {
            newWin.onload = () => {
                try {
                    newWin.document.documentElement.requestFullscreen().catch(() => {});
                } catch (e) {}
            };
        }
    };

    const quickCues = [
        { label: '5 Mins Left', text: '5 MINS LEFT', type: 'alert' },
        { label: 'Wrap Up', text: 'WRAP UP', type: 'alert' },
        { label: 'Mic Close', text: 'MIC CLOSE', type: 'info' },
        { label: 'Wait for Cue', text: 'WAIT FOR CUE', type: 'info' },
        { label: 'Next Ready', text: 'NEXT READY', type: 'info' },
    ];

    const handleSendQuick = (text: string, type: string) => {
        sendStageMessage(text, type, isStrobe, 10000); // 10s auto-clear
    };

    const handleSendCustom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customMessage.trim()) return;
        sendStageMessage(customMessage.trim().toUpperCase(), 'alert', isStrobe, 15000); // 15s auto-clear
        setCustomMessage('');
    };

    const displayOptions = [
        {
            title: 'Stage Monitor',
            icon: Monitor,
            description: 'Massive high-contrast countdown for pulpit / speakers.',
            path: `/stage?id=${program.id}`,
            badgeColor: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
            tabId: 'stage'
        },
        {
            title: 'TV / Overflow',
            icon: Tv,
            description: 'Public rundown display for confidence & overflow screens.',
            path: `/tv?id=${program.id}`,
            badgeColor: 'text-[#0EA5E9] bg-[#0EA5E9]/10 border-[#0EA5E9]/30',
            tabId: 'tv'
        },
        {
            title: 'Integrated Teleprompter',
            icon: AppWindow,
            description: 'Synced autoscrolling script + live timing readout.',
            path: `/prompter?id=${program.id}`,
            badgeColor: 'text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/30',
            tabId: 'prompter'
        },
        {
            title: 'Crew Tactical HUD',
            icon: Activity,
            description: 'Live cue acknowledgements for Sound, Light, and Video.',
            path: `/p/${program.slug || program.id}/crew`,
            badgeColor: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
            tabId: 'crew'
        },
        {
            title: 'Public Portal',
            icon: Smartphone,
            description: 'Mobile web schedule for audience & guests.',
            path: `/p/${program.slug || program.id}`,
            badgeColor: 'text-[#64748B] bg-[#64748B]/10 border-[#64748B]/30',
            tabId: 'public'
        }
    ];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 font-sans">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#22262E] pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#1C2028] border border-[#2D333F] text-[10px] font-mono tracking-widest text-[#9BA3AF] uppercase">Display Hub</span>
                        <span className="text-xs text-[#0EA5E9] font-mono font-medium">Multi-Screen Management</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Monitors & Live Cues</h1>
                    <p className="text-xs text-[#8A93A4]">Route video outputs to HDMI stage screens, TVs, teleprompters, and tactical crew HUDs.</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {isFlightBridgeSupported && (
                        <button
                            onClick={onLaunchFlightBridge}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#16191F] hover:bg-[#1E232B] text-white border border-[#2A303C] text-xs font-semibold font-mono transition-all active:scale-95 shadow-sm"
                            title="Launch Always-on-Top Floating PiP Window"
                        >
                            <AppWindow size={14} className="text-[#0EA5E9]" />
                            <span>Floating PiP Timer</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Hardware Screen Topology Strip */}
            <div className="bg-[#121418] border border-[#22262E] rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded bg-[#181B22] border border-[#282D37] text-[#0EA5E9]">
                        <Cast size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Display Hardware Topology</h4>
                            {hasSecondaryScreen ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[10px] font-mono font-bold text-[#10B981]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-tally"></span>
                                    SECONDARY DISPLAY DETECTED
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#64748B]/10 border border-[#64748B]/30 text-[10px] font-mono text-[#8A93A4]">
                                    SINGLE DISPLAY (PRIMARY ONLY)
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-[#8A93A4] mt-0.5">
                            {hasSecondaryScreen 
                                ? "HDMI / External output is ready. Use 'Project to Display 2' on any feed below."
                                : "Plug in an HDMI or USB-C cable to enable instant 1-click stage projection."}
                        </p>
                    </div>
                </div>

                {isScreenApiSupported && !screens.length && (
                    <button
                        onClick={() => requestScreenAccess()}
                        className="px-3 py-1.5 bg-[#1C2028] hover:bg-[#252B37] border border-[#2D333F] text-xs font-mono text-[#E1E4EA] rounded-md transition-all whitespace-nowrap"
                    >
                        Auto-Detect Displays
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Secondary Screen Launch Cards */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayOptions.map((opt) => {
                        const isCrewHUD = opt.title === 'Crew Tactical HUD';
                        const isLocked = isCrewHUD && !isPro;
                        const status = opt.tabId ? displayStatuses?.[opt.tabId] : null;

                        return (
                            <div key={opt.title} className="bg-[#121418] border border-[#22262E] hover:border-[#2D333F] rounded-md p-4 shadow-sm transition-all flex flex-col justify-between">
                                
                                <div>
                                    <div className="flex items-start justify-between mb-3 gap-2">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <div className="p-2 rounded bg-[#181B22] border border-[#22262E] text-white">
                                                <opt.icon size={16} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-white tracking-tight">{opt.title}</h3>
                                                    {isLocked && (
                                                        <span className="bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                                                            PRO
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {status ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#10B981]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-tally"></span>
                                                            {status.isOnSecondary ? 'HDMI Screen 2' : 'Window Active'}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6A7382]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B4252]"></span>
                                                            Offline
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {!isLocked && (
                                                <>
                                                    <button
                                                        onClick={() => handleCopyLink(opt.path, opt.title)}
                                                        className="p-1.5 bg-[#181B22] hover:bg-[#22262E] text-[#8A93A4] hover:text-white border border-[#22262E] rounded transition-all"
                                                        title="Copy Sharing Link"
                                                    >
                                                        {copiedPath === opt.title ? <Check size={13} className="text-[#10B981]" /> : <Copy size={13} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleQr(opt.title)}
                                                        className={`p-1.5 rounded border transition-all ${
                                                            openQrCodes[opt.title]
                                                                ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                                                                : 'bg-[#181B22] hover:bg-[#22262E] text-[#8A93A4] hover:text-white border-[#22262E]'
                                                        }`}
                                                        title="Toggle QR Code"
                                                    >
                                                        <QrCode size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenAsWindow(opt.path)}
                                                        className="p-1.5 bg-[#181B22] hover:bg-[#22262E] text-[#8A93A4] hover:text-white border border-[#22262E] rounded transition-all"
                                                        title="Open in Clean Popout Window"
                                                    >
                                                        <AppWindow size={13} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-[#8A93A4] mb-3 leading-relaxed">{opt.description}</p>

                                    {/* Live 16:9 Multiviewer Thumbnail */}
                                    <div className="aspect-video bg-[#090A0C] rounded border border-[#1E222A] overflow-hidden relative mb-3 group">
                                        <div className={`w-full h-full ${isLocked ? 'blur-sm grayscale opacity-30' : ''}`} style={{ overflow: 'hidden' }}>
                                            {(() => {
                                                const activeTheme = status?.isDarkMode !== undefined
                                                    ? (status.isDarkMode ? 'dark' : 'light')
                                                    : localThemes[opt.tabId || 'stage'];
                                                return (
                                                    <iframe
                                                        src={`${opt.path}${opt.path.includes('?') ? '&' : '?'}mode=thumbnail&theme=${activeTheme}`}
                                                        className="pointer-events-none opacity-85"
                                                        title={opt.title}
                                                        style={{
                                                            width: '1920px',
                                                            height: '1080px',
                                                            transform: 'scale(0.18)',
                                                            transformOrigin: 'top left',
                                                            border: 'none'
                                                        }}
                                                    />
                                                );
                                            })()}
                                        </div>
                                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#090A0C]/90 border border-[#22262E] text-[9px] font-mono text-[#8A93A4]">
                                            FEED #{opt.tabId?.toUpperCase()}
                                        </div>
                                        {!isLocked && (
                                            <div className="absolute inset-0 bg-transparent flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => window.open(opt.path, '_blank')}
                                                    className="bg-[#121418]/95 border border-[#2D333F] text-white px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 shadow-xl"
                                                >
                                                    <ExternalLink size={12} />
                                                    <span>Open Full View</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Projection Buttons */}
                                <div className="flex items-center gap-2 pt-2 border-t border-[#1E222A]">
                                    <button
                                        onClick={() => openOnSecondaryScreen(opt.path)}
                                        disabled={isLocked}
                                        className="flex-1 py-1.5 px-2 bg-[#1C2028] hover:bg-[#252B37] disabled:opacity-40 text-[#E1E4EA] border border-[#2D333F] rounded text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
                                        title="Automatically position and fullscreen on HDMI secondary screen"
                                    >
                                        <Cast size={12} className="text-[#0EA5E9]" />
                                        <span>Project to Display 2</span>
                                    </button>
                                    <button
                                        onClick={() => handleOpenFullscreen(opt.path)}
                                        disabled={isLocked}
                                        className="py-1.5 px-2.5 bg-[#181B22] hover:bg-[#22262E] disabled:opacity-40 text-[#8A93A4] hover:text-white border border-[#22262E] rounded text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1"
                                        title="Open directly in Fullscreen mode"
                                    >
                                        <Maximize size={12} className="text-[#F59E0B]" />
                                        <span>Fullscreen</span>
                                    </button>
                                    <button
                                        onClick={() => window.open(opt.path, '_blank')}
                                        disabled={isLocked}
                                        className="py-1.5 px-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-40 text-white rounded text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1"
                                    >
                                        <ExternalLink size={12} />
                                        <span>Open</span>
                                    </button>
                                </div>

                                {/* QR Code Drawer */}
                                {!isLocked && openQrCodes[opt.title] && (
                                    <div className="mt-3 p-3 bg-[#090A0C] border border-[#22262E] rounded flex flex-col items-center justify-center animate-in fade-in duration-200">
                                        <div className="bg-white p-2.5 rounded border border-white/10">
                                            <QRCode value={window.location.origin + opt.path} size={110} />
                                        </div>
                                        <p className="mt-2 text-[10px] font-mono text-[#8A93A4] text-center">
                                            Scan on iPad / Teleprompter Rig
                                        </p>
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>

                {/* Tactical Messaging Console */}
                <div className="space-y-4">
                    <div className="bg-[#121418] border border-[#22262E] rounded-md p-5 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-4 border-b border-[#22262E] pb-3">
                            <div className="p-1.5 bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] rounded">
                                <MessageSquare size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white tracking-tight font-mono uppercase">Stage Cue Dispatcher</h3>
                                <p className="text-[10px] text-[#8A93A4]">Instant banner overlay on pulpit & stage displays.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSendCustom} className="mb-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-mono font-bold text-[#8A93A4] uppercase tracking-wider">Custom Message</label>
                                <button
                                    type="button"
                                    onClick={() => setIsStrobe(!isStrobe)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all ${isStrobe
                                        ? 'bg-[#EF4444] text-white shadow-sm'
                                        : 'bg-[#1C2028] text-[#8A93A4] hover:text-white border border-[#2D333F]'
                                        }`}
                                >
                                    <Zap size={10} fill={isStrobe ? "currentColor" : "none"} />
                                    <span>Strobe Mode: {isStrobe ? 'ON' : 'OFF'}</span>
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder="TYPE CUE (E.G. 'WRAP UP NOW')..."
                                    className="flex-1 bg-[#090A0C] border border-[#22262E] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0EA5E9] placeholder:text-[#4B5563]"
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] rounded text-white font-mono text-xs font-bold transition-all"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>

                        <div>
                            <label className="block text-[10px] font-mono font-bold text-[#8A93A4] uppercase tracking-wider mb-2.5">
                                Tactical 1-Click Cues
                            </label>
                            <div className="grid grid-cols-1 gap-1.5">
                                {quickCues.map((cue) => (
                                    <button
                                        key={cue.label}
                                        onClick={() => handleSendQuick(cue.text, cue.type)}
                                        className="w-full text-left px-3 py-2 bg-[#181B22] hover:bg-[#20252E] border border-[#22262E] hover:border-[#2D333F] rounded text-xs font-mono font-semibold transition-all flex items-center justify-between text-[#E1E4EA] group"
                                    >
                                        <span>{cue.label}</span>
                                        <span className="text-[10px] font-mono text-[#6A7382] group-hover:text-[#0EA5E9]">
                                            TRIGGER ❯
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={clearStageMessage}
                                className="w-full mt-3 px-3 py-2 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 rounded text-[#EF4444] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                            >
                                <Trash2 size={13} />
                                <span>Clear Stage Overlay</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#121418] border border-[#22262E] rounded-md p-4 text-xs font-mono text-[#8A93A4]">
                        <div className="flex items-center gap-2 text-white font-bold mb-1">
                            <Shield size={14} className="text-[#0EA5E9]" />
                            <span>Broadcast Safety Tip</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#6A7382]">
                            Keep the Stage Monitor open on the pulpit TV. All cues auto-dismiss after 10 seconds to avoid distracting speakers.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};
