import React, { useState, useEffect, useRef } from 'react';
import { Program, Organization } from '../types';
import { Monitor, Tv, Smartphone, MessageSquare, Send, ExternalLink, AlertCircle, Trash2, Zap, Activity, Crown, Copy, Check, QrCode, AppWindow, Moon, Sun, Cast, CheckCircle2, Sliders, Shield, Maximize } from 'lucide-react';
import { useStageMessages } from '../hooks/useStageMessages';
import { useScreenManagement } from '../hooks/useScreenManagement';
import QRCode from 'react-qr-code';

const LiveThumbnail: React.FC<{
    path: string;
    title: string;
    theme: string;
    isLocked?: boolean;
}> = ({ path, title, theme, isLocked }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.18);

    useEffect(() => {
        if (!containerRef.current) return;
        const updateScale = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                if (width > 0) {
                    setScale(width / 1920);
                }
            }
        };
        updateScale();
        const observer = new ResizeObserver(updateScale);
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden">
            <iframe
                src={`${path}${path.includes('?') ? '&' : '?'}mode=thumbnail&theme=${theme}`}
                className="pointer-events-none opacity-85 absolute top-0 left-0"
                title={title}
                style={{
                    width: '1920px',
                    height: '1080px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    border: 'none'
                }}
            />
        </div>
    );
};

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

    const handleOpenAsWindow = (path: string, tabId?: string) => {
        const width = 1280;
        const height = 720;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        const targetName = `kairon_display_${tabId || 'window'}`;
        window.open(
            path,
            targetName,
            `width=${width},height=${height},left=${left},top=${top},menubar=no,status=no,toolbar=no,location=no`
        );
    };

    const handleOpenFullscreen = async (path: string, tabId?: string) => {
        const fullPath = `${path}${path.includes('?') ? '&' : '?'}autofs=1`;
        const targetName = `kairon_display_${tabId || 'fullscreen'}`;
        if (hasSecondaryScreen) {
            await openOnSecondaryScreen(fullPath, targetName);
        } else {
            const width = window.screen.availWidth || 1920;
            const height = window.screen.availHeight || 1080;
            window.open(
                fullPath,
                targetName,
                `width=${width},height=${height},left=0,top=0,menubar=no,status=no,toolbar=no,location=no`
            );
        }
    };

    const handleSendCustom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customMessage.trim()) return;
        sendStageMessage(customMessage.trim(), isStrobe ? 'strobe' : 'custom');
        setCustomMessage('');
    };

    const handleSendQuick = (text: string, type: 'warning' | 'custom' | 'strobe') => {
        sendStageMessage(text, type);
    };

    const quickCues = [
        { label: '⚠️ WRAP UP IN 1 MINUTE', text: 'PLEASE WRAP UP IN 1 MINUTE', type: 'warning' as const },
        { label: '🛑 STOP IMMEDIATELY', text: 'TIME IS UP - PLEASE CONCLUDE NOW', type: 'strobe' as const },
        { label: '🎤 ADJUST MIC CLOSER', text: 'PLEASE HOLD MIC CLOSER', type: 'custom' as const },
        { label: '⚡ SPEED UP TEMPO', text: 'SPEED UP - RUNNING BEHIND SCHEDULE', type: 'warning' as const },
    ];

    const displayOptions = [
        {
            title: 'Stage & Pulpit Display',
            icon: Monitor,
            description: 'Ultra-high contrast countdown timer with tally borders.',
            path: `/stage?id=${program.id}`,
            badgeColor: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30',
            tabId: 'stage'
        },
        {
            title: 'TV / Overflow Screen',
            icon: Tv,
            description: 'Full-service rundown on the left + on-air clock on the right.',
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
            path: `/crew?id=${program.id}`,
            badgeColor: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
            tabId: 'crew'
        },
        {
            title: 'Public Portal',
            icon: Smartphone,
            description: 'Mobile web schedule for audience & guests.',
            path: `/public?id=${program.id}`,
            badgeColor: 'text-[#64748B] bg-[#64748B]/10 border-[#64748B]/30',
            tabId: 'public'
        }
    ];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300 font-sans">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#22262E] pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1C2028] border border-slate-200 dark:border-[#2D333F] text-[10px] font-mono tracking-widest text-slate-600 dark:text-[#9BA3AF] uppercase">Display Hub</span>
                        <span className="text-xs text-[#0EA5E9] font-mono font-medium">Multi-Screen Management</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">Monitors & Live Cues</h1>
                    <p className="text-xs text-slate-500 dark:text-[#8A93A4]">Route video outputs to HDMI stage screens, TVs, teleprompters, and tactical crew HUDs.</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {isFlightBridgeSupported && (
                        <button
                            onClick={onLaunchFlightBridge}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-white dark:bg-[#16191F] hover:bg-slate-100 dark:hover:bg-[#1E232B] text-slate-900 dark:text-white border border-slate-200 dark:border-[#2A303C] text-xs font-semibold font-mono transition-all active:scale-95 shadow-sm"
                            title="Launch Always-on-Top Floating PiP Window"
                        >
                            <AppWindow size={14} className="text-[#0EA5E9]" />
                            <span>Floating PiP Timer</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Hardware Screen Topology Strip */}
            <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#282D37] text-[#0EA5E9]">
                        <Cast size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">Display Hardware Topology</h4>
                            {hasSecondaryScreen ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[10px] font-mono font-bold text-[#10B981]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-tally"></span>
                                    SECONDARY DISPLAY DETECTED
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#64748B]/10 border border-slate-200 dark:border-[#64748B]/30 text-[10px] font-mono text-slate-500 dark:text-[#8A93A4]">
                                    SINGLE DISPLAY (PRIMARY ONLY)
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#8A93A4] mt-0.5">
                            {hasSecondaryScreen 
                                ? "HDMI / External output is ready. Use 'Project to Display 2' on any feed below."
                                : "Plug in an HDMI or USB-C cable to enable instant 1-click stage projection."}
                        </p>
                    </div>
                </div>

                {isScreenApiSupported && !screens.length && (
                    <button
                        onClick={() => requestScreenAccess()}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-[#1C2028] hover:bg-slate-200 dark:hover:bg-[#252B37] border border-slate-300 dark:border-[#2D333F] text-xs font-mono text-slate-800 dark:text-[#E1E4EA] rounded-md transition-all whitespace-nowrap"
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
                        const currentTheme = status?.isDarkMode !== undefined
                            ? (status.isDarkMode ? 'dark' : 'light')
                            : (localThemes[opt.tabId || 'stage'] || 'dark');

                        return (
                            <div key={opt.title} className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] hover:border-slate-300 dark:hover:border-[#2D333F] rounded-md p-4 shadow-sm transition-all flex flex-col justify-between">
                                
                                <div>
                                    <div className="flex items-start justify-between mb-3 gap-2">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <div className="p-2 rounded bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-slate-900 dark:text-white">
                                                <opt.icon size={16} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{opt.title}</h3>
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
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-[#6A7382]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#3B4252]"></span>
                                                            Offline
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {!isLocked && (
                                                <>
                                                    {/* Individual Display Theme Toggle */}
                                                    <button
                                                        onClick={() => handleRemoteToggleTheme(opt.tabId || 'stage')}
                                                        className={`p-1.5 rounded border transition-all ${
                                                            currentTheme === 'light'
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                                : 'bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#22262E]'
                                                        }`}
                                                        title={`Display Theme: ${currentTheme.toUpperCase()} (Click to toggle)`}
                                                    >
                                                        {currentTheme === 'light' ? <Sun size={13} /> : <Moon size={13} />}
                                                    </button>

                                                    <button
                                                        onClick={() => handleCopyLink(opt.path, opt.title)}
                                                        className="p-1.5 bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#22262E] rounded transition-all"
                                                        title="Copy Sharing Link"
                                                    >
                                                        {copiedPath === opt.title ? <Check size={13} className="text-[#10B981]" /> : <Copy size={13} />}
                                                    </button>

                                                    <button
                                                        onClick={() => handleToggleQr(opt.title)}
                                                        className={`p-1.5 rounded border transition-all ${
                                                            openQrCodes[opt.title]
                                                                ? 'bg-[#0EA5E9] text-white border-[#0EA5E9]'
                                                                : 'bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-[#22262E]'
                                                        }`}
                                                        title="Toggle QR Code"
                                                    >
                                                        <QrCode size={13} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleOpenAsWindow(opt.path, opt.tabId)}
                                                        className="p-1.5 bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#22262E] rounded transition-all"
                                                        title="Open in Clean Popout Window"
                                                    >
                                                        <AppWindow size={13} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-500 dark:text-[#8A93A4] mb-3 leading-relaxed">{opt.description}</p>

                                    {/* Live 16:9 Multiviewer Thumbnail */}
                                    <div className="aspect-video bg-slate-900 dark:bg-[#090A0C] rounded border border-slate-200 dark:border-[#1E222A] overflow-hidden relative mb-3 group shadow-inner">
                                        <div className={`w-full h-full ${isLocked ? 'blur-sm grayscale opacity-30' : ''}`}>
                                            <LiveThumbnail
                                                path={opt.path}
                                                title={opt.title}
                                                theme={currentTheme}
                                                isLocked={isLocked}
                                            />
                                        </div>
                                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 border border-white/10 text-[9px] font-mono text-white pointer-events-none">
                                            FEED #{opt.tabId?.toUpperCase()} • {currentTheme.toUpperCase()}
                                        </div>
                                        {!isLocked && (
                                            <div className="absolute inset-0 bg-transparent flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => window.open(opt.path, `kairon_display_${opt.tabId || 'feed'}`)}
                                                    className="bg-white/95 dark:bg-[#121418]/95 border border-slate-300 dark:border-[#2D333F] text-slate-900 dark:text-white px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1.5 shadow-xl hover:bg-slate-100 dark:hover:bg-[#1E232B] transition-all"
                                                >
                                                    <ExternalLink size={12} />
                                                    <span>Open Full View</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Projection Buttons */}
                                <div className="flex items-center gap-1.5 sm:gap-2 pt-2.5 border-t border-slate-200 dark:border-[#1E222A] mt-auto">
                                    <button
                                        onClick={() => openOnSecondaryScreen(`${opt.path}${opt.path.includes('?') ? '&' : '?'}autofs=1`, `kairon_display_${opt.tabId || 'screen2'}`)}
                                        disabled={isLocked}
                                        className="flex-1 py-2 px-2 bg-slate-100 dark:bg-[#1C2028] hover:bg-slate-200 dark:hover:bg-[#252B37] disabled:opacity-40 text-slate-800 dark:text-[#E1E4EA] border border-slate-300 dark:border-[#2D333F] rounded-md text-[11px] sm:text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap min-w-0"
                                        title="Automatically position and fullscreen on HDMI secondary screen"
                                    >
                                        <Cast size={13} className="text-[#0EA5E9] shrink-0" />
                                        <span className="truncate">
                                            <span className="hidden xl:inline">Project to </span>Display 2
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleOpenFullscreen(opt.path, opt.tabId)}
                                        disabled={isLocked}
                                        className="py-2 px-2.5 bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] disabled:opacity-40 text-slate-700 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#22262E] rounded-md text-[11px] sm:text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                                        title="Open directly in Fullscreen mode"
                                    >
                                        <Maximize size={13} className="text-[#F59E0B] shrink-0" />
                                        <span className="hidden sm:inline">Fullscreen</span>
                                    </button>
                                    <button
                                        onClick={() => window.open(opt.path, `kairon_display_${opt.tabId || 'view'}`)}
                                        disabled={isLocked}
                                        className="py-2 px-2.5 sm:px-3 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-40 text-white rounded-md text-[11px] sm:text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                                        title="Open view in target tab"
                                    >
                                        <ExternalLink size={13} className="shrink-0" />
                                        <span className="hidden xs:inline">Open</span>
                                    </button>
                                </div>

                                {/* QR Code Drawer */}
                                {!isLocked && openQrCodes[opt.title] && (
                                    <div className="mt-3 p-3 bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded flex flex-col items-center justify-center animate-in fade-in duration-200">
                                        <div className="bg-white p-2.5 rounded border border-slate-200 dark:border-white/10 shadow-sm">
                                            <QRCode value={window.location.origin + opt.path} size={110} />
                                        </div>
                                        <p className="mt-2 text-[10px] font-mono text-slate-500 dark:text-[#8A93A4] text-center">
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
                    <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-md p-5 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-4 border-b border-slate-200 dark:border-[#22262E] pb-3">
                            <div className="p-1.5 bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] rounded">
                                <MessageSquare size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight font-mono uppercase">Stage Cue Dispatcher</h3>
                                <p className="text-[10px] text-slate-500 dark:text-[#8A93A4]">Instant banner overlay on pulpit & stage displays.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSendCustom} className="mb-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-mono font-bold text-slate-600 dark:text-[#8A93A4] uppercase tracking-wider">Custom Message</label>
                                <button
                                    type="button"
                                    onClick={() => setIsStrobe(!isStrobe)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all ${isStrobe
                                        ? 'bg-[#EF4444] text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-[#1C2028] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#2D333F]'
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
                                    className="flex-1 bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0EA5E9] placeholder:text-slate-400 dark:placeholder:text-[#4B5563]"
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
                            <label className="block text-[10px] font-mono font-bold text-slate-600 dark:text-[#8A93A4] uppercase tracking-wider mb-2.5">
                                Tactical 1-Click Cues
                            </label>
                            <div className="grid grid-cols-1 gap-1.5">
                                {quickCues.map((cue) => (
                                    <button
                                        key={cue.label}
                                        onClick={() => handleSendQuick(cue.text, cue.type)}
                                        className="w-full text-left px-3 py-2 bg-slate-50 dark:bg-[#181B22] hover:bg-slate-100 dark:hover:bg-[#20252E] border border-slate-200 dark:border-[#22262E] hover:border-slate-300 dark:hover:border-[#2D333F] rounded text-xs font-mono font-semibold transition-all flex items-center justify-between text-slate-800 dark:text-[#E1E4EA] group"
                                    >
                                        <span>{cue.label}</span>
                                        <span className="text-[10px] font-mono text-slate-400 dark:text-[#6A7382] group-hover:text-[#0EA5E9]">
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

                    <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-md p-4 text-xs font-mono text-slate-600 dark:text-[#8A93A4] shadow-sm">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold mb-1">
                            <Shield size={14} className="text-[#0EA5E9]" />
                            <span>Broadcast Safety Tip</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-[#6A7382]">
                            Keep the Stage Monitor open on the pulpit TV. All cues auto-dismiss after 10 seconds to avoid distracting speakers.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};
