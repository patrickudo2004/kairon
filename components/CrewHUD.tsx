import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '../hooks/useConvexMock';
import { api } from '../convex/_generated/api';
import { Program } from '../types';
import { formatDuration, timeToMinutes, minutesToTime } from '../utils/time';
import { getUniversalSearchParams, extractPathSlug } from '../utils/url';
import { Mic, Clock, User, Calendar, ExternalLink, ChevronRight, Share2, Timer, Sun, Moon, RefreshCw, Volume2, Lightbulb, Video, CheckCircle2, Activity, Maximize, Minimize, MessageSquare, Send, Radio, Sparkles } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useTimerSync } from '../hooks/useTimerSync';
import {
    KAIRON_IFRAME_SYNC_TYPE,
    TimestampedProgram,
    normalizeProgramId,
    matchesDisplayTarget,
    applyIncomingDisplaySync,
    reconcileDisplayProgram,
} from '../utils/displaySync';

export const CrewHUD: React.FC = () => {
    const routeParams = useParams<{ slug: string }>();
    const searchParams = getUniversalSearchParams();
    const extractedSlug = routeParams.slug || extractPathSlug();
    const slug = extractedSlug || undefined;
    const searchId = searchParams.get('id') || searchParams.get('programId') || searchParams.get('slug');
    const targetId = slug || searchId || '';
    const cleanTargetId = targetId ? targetId.replace(/^local-/, '') : '';
    const isAutoFs = searchParams.get('autofs') === '1';
    const urlTheme = searchParams.get('theme') as 'dark' | 'light' | null;

    const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
        if (urlTheme) return urlTheme;
        const saved = typeof window !== 'undefined' ? localStorage.getItem('kairon_display_theme_crew') : null;
        if (saved === 'dark' || saved === 'light') return saved;
        return 'dark';
    });

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFsPrompt, setShowFsPrompt] = useState(isAutoFs);

    // Real-time broadcast sync for display theme toggles
    useEffect(() => {
        const channel = new BroadcastChannel('kairon_displays');
        const handleMsg = (e: MessageEvent) => {
            if (e.data && e.data.type === 'toggle_theme' && (e.data.tabId === 'crew' || !e.data.tabId)) {
                setCurrentTheme(prev => {
                    const next = e.data.theme || (prev === 'dark' ? 'light' : 'dark');
                    localStorage.setItem('kairon_display_theme_crew', next);
                    return next;
                });
            }
        };
        channel.addEventListener('message', handleMsg);
        return () => {
            channel.removeEventListener('message', handleMsg);
            channel.close();
        };
    }, []);

    // Hardware Fullscreen Toggle
    const toggleFullscreen = useCallback(async () => {
        try {
            const doc = window.document as any;
            const docEl = doc.documentElement as any;

            const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
            const isFs = doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullScreenElement || doc.msFullscreenElement;

            if (!isFs) {
                if (requestFullScreen) await requestFullScreen.call(docEl);
            } else {
                if (cancelFullScreen) await cancelFullScreen.call(doc);
            }
            setShowFsPrompt(false);
        } catch (err) {
            console.error("Error toggling fullscreen in CrewHUD:", err);
        }
    }, []);

    // Track fullscreen changes and keyboard shortcuts
    useEffect(() => {
        const handleFsChange = () => {
            const doc = document as any;
            const isFs = !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
            setIsFullscreen(isFs);
            if (isFs) setShowFsPrompt(false);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'f' || e.key === 'F' || e.key === 'F11') {
                if (e.key === 'f' || e.key === 'F') e.preventDefault();
                toggleFullscreen();
            }
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        document.addEventListener('mozfullscreenchange', handleFsChange);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
            document.removeEventListener('mozfullscreenchange', handleFsChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [toggleFullscreen]);

    // BroadcastChannel Display Telemetry
    useEffect(() => {
        const isThumbnail = new URLSearchParams(window.location.search).get('mode') === 'thumbnail';
        const isIframe = window.self !== window.top;
        if (isThumbnail || isIframe) return;

        const channel = new BroadcastChannel('kairon_displays');
        
        const sendHeartbeat = () => {
            const isBrowserFullscreen = Math.abs(window.screen.width - window.innerWidth) <= 1 && 
                                         Math.abs(window.screen.height - window.innerHeight) <= 1;
            const isFs = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement ||
                isBrowserFullscreen
            );
            const isOnSecondary = Math.abs(window.screenX) >= 100 || Math.abs(window.screenY) >= 100;

            channel.postMessage({
                type: 'heartbeat',
                tabId: 'crew',
                isFullscreen: isFs,
                isOnSecondary
            });
        };
        
        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 1000);
        
        return () => {
            clearInterval(interval);
            channel.close();
        };
    }, []);

    // Convex Reactive Query
    const shouldSkipCloud = !targetId || targetId.startsWith('local-');
    const programData = useQuery(
        api.programs.getProgramBySlug,
        slug ? { slug, includeProductionNotes: true } : (!shouldSkipCloud ? { slug: targetId, includeProductionNotes: true } : "skip")
    );

    const programByIdData = useQuery(
        api.programs.getProgramById,
        !shouldSkipCloud ? { id: targetId as any } : "skip"
    );

    const liveProgramData = useQuery(
        api.programs.getLiveProgram,
        {} // Always poll live channel as fallback
    );

    const liveMatchesTarget = Boolean(
        liveProgramData && cleanTargetId && [
            (liveProgramData as any)._id,
            (liveProgramData as any).id,
            (liveProgramData as any).uuid,
            (liveProgramData as any).slug,
        ].some((v) => normalizeProgramId(v) === cleanTargetId)
    );
    const programRaw = targetId
        ? (programData || programByIdData || (liveMatchesTarget ? liveProgramData : null))
        : liveProgramData;
    const programFromConvex = programRaw ? {
        ...(programRaw as any),
        id: (programRaw as any)._id || (programRaw as any).id
    } as Program : null;

    const programFromConvexRef = useRef(programFromConvex);
    programFromConvexRef.current = programFromConvex;

    const targetIdRef = useRef(targetId);
    targetIdRef.current = targetId;

    const readLocalProgram = useCallback((): Program | null => {
        try {
            const cleanId = targetId ? targetId.replace(/^local-/, '') : null;
            if (targetId) {
                const candidates = [
                    `kairon_offline_cache_${targetId}`,
                    cleanId ? `kairon_offline_cache_${cleanId}` : null,
                    'kairon_offline_cache_live',
                    'kairon_program'
                ].filter(Boolean) as string[];

                for (const key of candidates) {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && (parsed.id === targetId || parsed.id?.replace(/^local-/, '') === cleanId || parsed.slug === cleanId || !targetId)) {
                            return parsed;
                        }
                    }
                }

                const listKeys = ['kairon_offline_programs', 'test_programs', 'programs'];
                for (const key of listKeys) {
                    const allRaw = localStorage.getItem(key);
                    if (allRaw) {
                        const all = JSON.parse(allRaw);
                        if (Array.isArray(all) && all.length > 0) {
                            const match = all.find((p: any) => p.id === targetId || p.id?.replace(/^local-/, '') === cleanId || p.slug === cleanId);
                            if (match) return match;
                            if (!targetId) return all[0];
                        }
                    }
                }
            }

            const liveCache = localStorage.getItem('kairon_offline_cache_live') || localStorage.getItem('kairon_program');
            if (liveCache) {
                const parsed = JSON.parse(liveCache);
                if (parsed && Array.isArray(parsed.slots)) {
                    return parsed;
                }
            }
            return null;
        } catch (e) {
            console.warn("Could not read local fallback program in CrewHUD:", e);
            return null;
        }
    }, [targetId]);

    // Local Program Fallback for offline, electron, or draft IDs
    const [localProgram, setLocalProgram] = useState<TimestampedProgram | null>(() => readLocalProgram());
    const [localUpdatedAt, setLocalUpdatedAt] = useState<number>(0);

    useEffect(() => {
        const found = readLocalProgram();
        if (found) setLocalProgram(found);
    }, [readLocalProgram]);

    useEffect(() => {
        const handleStorage = () => {
            const found = readLocalProgram();
            if (found) {
                setLocalProgram(found);
                setLocalUpdatedAt((found as TimestampedProgram)._syncTimestamp || Date.now());
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [readLocalProgram]);

    const mergeIncomingData = useCallback((data: any) => {
        if (!data) return;
        const currentTarget = targetIdRef.current;
        setLocalProgram((prev) => {
            if (!matchesDisplayTarget(currentTarget, data, prev || programFromConvexRef.current)) {
                return prev;
            }
            const updated = applyIncomingDisplaySync(prev, programFromConvexRef.current, data, currentTarget);
            if (updated) {
                setLocalUpdatedAt(data.syncTimestamp || Date.now());
                try {
                    localStorage.setItem(`kairon_offline_cache_${currentTarget || 'live'}`, JSON.stringify(updated));
                } catch {}
            }
            return updated;
        });
    }, []);

    // Reconcile stale local cache if Convex authoritatively concludes the session remotely
    useEffect(() => {
        if (programFromConvex?.status === 'concluded' && localProgram?.status === 'live') {
            const syncAt = Math.max(localUpdatedAt, localProgram._syncTimestamp || 0);
            const startedFreshly = syncAt > 0 && Date.now() - syncAt < 8000 && Boolean(localProgram.isTimerActive);
            if (!startedFreshly) {
                setLocalProgram({
                    ...localProgram,
                    ...programFromConvex,
                    status: 'concluded',
                    isTimerActive: false,
                    timerStartTimestamp: null,
                    secondsElapsed: 0,
                    isOnHold: false,
                });
            }
        }
    }, [programFromConvex?.status]);

    // Direct parent->iframe postMessage sync (Web & Electron file://)
    useEffect(() => {
        const handleWindowMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === KAIRON_IFRAME_SYNC_TYPE && event.data.payload) {
                mergeIncomingData(event.data.payload);
            }
        };
        window.addEventListener('message', handleWindowMessage);
        return () => window.removeEventListener('message', handleWindowMessage);
    }, [mergeIncomingData]);

    // BroadcastChannel sync effect (same-origin tabs / controller)
    useEffect(() => {
        const offlineChannel = new BroadcastChannel('kairon_offline_sync');
        const handleOfflineMsg = (event: MessageEvent) => {
            if (event.data) mergeIncomingData(event.data);
        };
        offlineChannel.addEventListener('message', handleOfflineMsg);
        return () => {
            offlineChannel.removeEventListener('message', handleOfflineMsg);
            offlineChannel.close();
        };
    }, [mergeIncomingData]);

    // Electron IPC timer relay effect (cross-BrowserWindow secondary projection / HUD)
    useEffect(() => {
        const electronApi = (window as any).electron || (window as any).electronAPI;
        if (!electronApi) return;
        if (typeof electronApi.getLastTimerState === 'function') {
            electronApi.getLastTimerState().then((cached: any) => {
                if (cached) mergeIncomingData(cached);
            }).catch(() => {});
        }
        if (!electronApi.onTimerState) return;
        const remove = electronApi.onTimerState((payload: any) => {
            if (payload) mergeIncomingData(payload);
        });
        return () => { if (remove) remove(); };
    }, [mergeIncomingData]);

    const isBoothOrLocalMode = typeof window !== 'undefined' && (
        localStorage.getItem('kairon_booth_mode') === 'true' ||
        window.location.search.includes('testBypass=true') ||
        localStorage.getItem('testBypass') === 'true' ||
        Boolean(targetId?.startsWith('local-')) ||
        window.self !== window.top
    );

    const program = reconcileDisplayProgram({
        localProgram,
        convexProgram: programFromConvex,
        localUpdatedAt,
        preferLocal: isBoothOrLocalMode,
    });

    // Drift-proof timer sync driven by true system wall-clock
    const derivedSecondsElapsed = useTimerSync(
        program?.timerStartTimestamp ?? null,
        program?.isTimerActive ?? false,
        program?.secondsElapsed ?? 0
    );

    const currentSlotIndex = program?.currentSlotIndex ?? 0;
    const currentSlot = program?.slots?.[currentSlotIndex];
    const nextSlot = program?.slots?.[currentSlotIndex + 1];

    const formatCountdown = (totalSeconds: number) => {
        const abs = Math.abs(totalSeconds);
        const mins = Math.floor(abs / 60);
        const secs = abs % 60;
        return `${totalSeconds < 0 ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const remainingSeconds = currentSlot ? (currentSlot.durationMinutes * 60) - derivedSecondsElapsed : 0;
    const [localAcks, setLocalAcks] = useState<Set<string>>(new Set());
    const programIdentifier = program?.id || targetId || '';
    const cloudAcks = useQuery(
        api.programs.getAcknowledgements,
        programIdentifier ? { programId: String(programIdentifier) } : "skip"
    ) || [];

    const acknowledgeCueMutation = useMutation(api.programs.acknowledgeCue);

    // Crew Tactical Chat State
    const [activeRightTab, setActiveRightTab] = useState<'cues' | 'chat'>('cues');
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [chatInput, setChatInput] = useState('');
    const [selectedRole, setSelectedRole] = useState<'sound' | 'lighting' | 'video' | 'speaker' | 'operator'>('sound');
    const [localMessages, setLocalMessages] = useState<Array<{
        id: string;
        senderName: string;
        senderRole: string;
        message: string;
        timestamp: number;
    }>>([]);

    const cloudMessages = useQuery(
        (api as any).chat?.getMessages,
        programIdentifier ? { programId: String(programIdentifier) } : "skip"
    ) || [];

    const sendChatMessageMutation = useMutation((api as any).chat?.sendMessage);

    const allMessages = React.useMemo(() => {
        const map = new Map<string, any>();
        for (const m of (cloudMessages as any[])) {
            const key = m._id || `${m.timestamp}-${m.message}`;
            map.set(key, {
                id: m._id,
                senderName: m.senderName,
                senderRole: m.senderRole,
                message: m.message,
                timestamp: m.timestamp
            });
        }
        for (const m of localMessages) {
            const key = m.id || `${m.timestamp}-${m.message}`;
            if (!map.has(key)) {
                map.set(key, m);
            }
        }
        return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
    }, [cloudMessages, localMessages]);

    useEffect(() => {
        const channel = new BroadcastChannel('kairon_crew_chat');
        const handleChatMsg = (e: MessageEvent) => {
            if (e.data && e.data.type === 'crew_message' && e.data.payload) {
                setLocalMessages(prev => [...prev, e.data.payload]);
                if (activeRightTab !== 'chat') {
                    setUnreadChatCount(c => c + 1);
                }
            }
        };
        channel.addEventListener('message', handleChatMsg);
        return () => {
            channel.removeEventListener('message', handleChatMsg);
            channel.close();
        };
    }, [activeRightTab]);

    const handleSendChatMessage = async (textToSend?: string) => {
        const text = (textToSend || chatInput).trim();
        if (!text) return;

        const roleLabels: Record<string, string> = {
            sound: 'Sound Crew',
            lighting: 'Lights Crew',
            video: 'Video Crew',
            speaker: 'Speaker / Presenter',
            operator: 'Production Operator'
        };

        const newMsg = {
            id: `local-${Date.now()}-${Math.random()}`,
            senderName: roleLabels[selectedRole] || 'Crew Member',
            senderRole: selectedRole,
            message: text,
            timestamp: Date.now()
        };

        setLocalMessages(prev => [...prev, newMsg]);
        setChatInput('');

        try {
            const channel = new BroadcastChannel('kairon_crew_chat');
            channel.postMessage({ type: 'crew_message', payload: newMsg });
            channel.close();
        } catch (bErr) {
            console.warn('BroadcastChannel error on chat:', bErr);
        }

        try {
            if (programIdentifier && sendChatMessageMutation) {
                await sendChatMessageMutation({
                    programId: String(programIdentifier),
                    senderName: roleLabels[selectedRole] || 'Crew Member',
                    senderRole: selectedRole,
                    message: text
                });
            }
        } catch (e) {
            console.warn("Could not push crew chat message to Convex (local fallback active):", e);
        }
    };

    const QUICK_TACTICAL_CHIPS = [
        { label: '🎤 Mic Low', msg: 'Mic volume is low on pulpit' },
        { label: '⏳ Hold (+2m)', msg: 'Please extend this segment by 2 minutes' },
        { label: '📹 Cam Live', msg: 'Camera 1 is live, please face forward' },
        { label: '💡 Dim Lights', msg: 'Dim house lights for prayer/worship' },
        { label: '🚨 Wrap Up', msg: 'Standby to wrap up in 60 seconds' },
        { label: '✅ All Clear', msg: 'Booth is ready, sound & visuals verified' },
    ];

    // BroadcastChannel for instant local inter-window and multi-tab synchronization
    useEffect(() => {
        const channel = new BroadcastChannel('kairon_acks');
        const handleAckMsg = (e: MessageEvent) => {
            if (e.data && e.data.type === 'crew_ack' && e.data.slotId && e.data.role) {
                setLocalAcks(prev => new Set(prev).add(`${e.data.slotId}-${e.data.role}`));
            }
        };
        channel.addEventListener('message', handleAckMsg);
        return () => {
            channel.removeEventListener('message', handleAckMsg);
            channel.close();
        };
    }, []);

    const handleAck = async (role: 'sound' | 'lighting' | 'video') => {
        if (!program || !currentSlot) return;
        const ackKey = `${currentSlot.id}-${role}`;
        setLocalAcks(prev => new Set(prev).add(ackKey));
        
        // 1. Broadcast locally for immediate reaction across all open displays/monitors
        try {
            const channel = new BroadcastChannel('kairon_acks');
            channel.postMessage({
                type: 'crew_ack',
                programId: programIdentifier,
                slotId: currentSlot.id,
                role,
                timestamp: Date.now()
            });
            channel.close();
        } catch (bErr) {
            console.warn('BroadcastChannel error on ack:', bErr);
        }

        // 2. Persist to Convex cloud
        try {
            if (programIdentifier) {
                await acknowledgeCueMutation({
                    programId: String(programIdentifier),
                    slotId: currentSlot.id,
                    role,
                });
            }
        } catch (e) {
            console.warn("Could not push ACK to Convex (local fallback active):", e);
        }
    };

    const isAcked = (role: string) => {
        if (!currentSlot) return false;
        const key = `${currentSlot.id}-${role}`;
        if (localAcks.has(key)) return true;
        return Array.isArray(cloudAcks) && cloudAcks.some((a: any) => a.slotId === currentSlot.id && a.role === role);
    };

    const isThemeLight = currentTheme === 'light';

    if (!program) {
        return (
            <div className={`min-h-screen ${isThemeLight ? 'bg-slate-50 text-slate-900' : 'bg-[#090A0C] text-white'} flex flex-col items-center justify-center p-6 text-center font-mono`}>
                <div className="w-10 h-10 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mb-4" />
                <p className={`text-xs font-mono ${isThemeLight ? 'text-slate-600' : 'text-[#8A93A4]'} uppercase tracking-widest font-bold`}>Connecting to Tactical Feed...</p>
                <p className="text-[10px] text-slate-400 mt-2">Target ID: {targetId || 'Live Session'}</p>
                <button
                    onClick={() => window.location.reload()}
                    className={`mt-4 px-3.5 py-1.5 ${isThemeLight ? 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100 shadow-sm' : 'bg-[#181B22] border-[#22262E] text-[#0EA5E9] hover:bg-[#22262E]'} border rounded text-xs transition-all`}
                >
                    Refresh Stream
                </button>
            </div>
        );
    }

    if (!program.slots || program.slots.length === 0) {
        return (
            <div className={`min-h-screen ${isThemeLight ? 'bg-slate-50 text-slate-900' : 'bg-[#090A0C] text-white'} flex flex-col font-mono select-none relative transition-colors duration-300`}>
                <header className={`px-6 py-3.5 ${isThemeLight ? 'bg-white border-slate-200' : 'bg-[#121418] border-[#22262E]'} border-b flex items-center justify-between`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="bg-[#F59E0B] text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0">Crew HUD</div>
                        <h1 className={`text-sm font-bold truncate max-w-[300px] ${isThemeLight ? 'text-slate-900' : 'text-white'} uppercase tracking-wider font-mono`}>{program.title}</h1>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STANDBY</span>
                        <button
                            type="button"
                            aria-label={isThemeLight ? "Switch Crew HUD to dark theme" : "Switch Crew HUD to light theme"}
                            onClick={() => setCurrentTheme(t => t === 'dark' ? 'light' : 'dark')}
                            className="p-1.5 border rounded text-xs"
                        >
                            {isThemeLight ? <Moon size={13} aria-hidden="true" /> : <Sun size={13} aria-hidden="true" />}
                        </button>
                    </div>
                </header>
                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-4 text-amber-500">
                        <Clock size={32} aria-hidden="true" />
                    </div>
                    <h2 className="text-xl font-bold uppercase tracking-wide mb-2">Tactical Standby Mode</h2>
                    <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                        Event <span className="text-[#0EA5E9] font-bold">&quot;{program.title}&quot;</span> is connected. Cues and timing will appear automatically once rundown items are loaded in Studio.
                    </p>
                    <span className="px-3 py-1 rounded bg-[#181B22] border border-[#22262E] text-[10px] text-[#10B981] font-bold uppercase tracking-widest">
                        ● Booth Sync Ready
                    </span>
                </main>
            </div>
        );
    }

    return (
        <div 
            onDoubleClick={toggleFullscreen}
            className={`min-h-screen lg:h-screen ${
                isThemeLight ? 'bg-slate-50 text-slate-900' : 'bg-[#090A0C] text-white'
            } overflow-x-hidden lg:overflow-hidden flex flex-col font-mono select-none relative transition-colors duration-300`}
        >
            {/* Auto Fullscreen Floating Banner */}
            {showFsPrompt && !isFullscreen && (
                <div 
                    onClick={toggleFullscreen}
                    className="cursor-pointer bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl animate-pulse z-50 transition-all"
                >
                    <Maximize size={14} />
                    <span>⛶ Click anywhere or press F11 to lock Fullscreen</span>
                </div>
            )}

            {/* Header / Meta */}
            <header className={`px-4 sm:px-6 py-3 ${
                isThemeLight ? 'bg-white border-slate-200' : 'bg-[#121418] border-[#22262E]'
            } border-b flex items-center justify-between gap-3 shrink-0`}>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="bg-[#F59E0B] text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
                        Crew HUD
                    </div>
                    <h1 className={`text-xs sm:text-sm font-bold truncate min-w-0 max-w-[240px] sm:max-w-[400px] ${
                        isThemeLight ? 'text-slate-900' : 'text-white'
                    } uppercase tracking-wider font-mono`}>
                        {program.title}
                    </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${program.isTimerActive ? 'bg-[#10B981] animate-tally' : program.status === 'concluded' ? 'bg-slate-400' : 'bg-[#6A7382]'}`} />
                        <span className={`text-[10px] font-bold ${
                            isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'
                        } uppercase tracking-widest font-mono`}>
                            {program.isTimerActive ? 'ON AIR' : program.status === 'concluded' ? 'CONCLUDED' : 'STANDBY'}
                        </span>
                    </div>
                    <div className={`hidden sm:block text-[10px] font-mono font-bold ${
                        isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'
                    } tracking-widest`}>
                        {new Date().toLocaleTimeString()}
                    </div>
                    <button
                        onClick={() => {
                            const next = isThemeLight ? 'dark' : 'light';
                            setCurrentTheme(next);
                            localStorage.setItem('kairon_display_theme_crew', next);
                        }}
                        className={`p-1.5 ${
                            isThemeLight 
                                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-black' 
                                : 'bg-[#181B22] hover:bg-[#22262E] border-[#22262E] text-[#8A93A4] hover:text-white'
                        } border rounded transition-all`}
                        title="Toggle Theme"
                    >
                        {isThemeLight ? <Moon size={13} /> : <Sun size={13} />}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className={`p-1.5 ${
                            isThemeLight 
                                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-black' 
                                : 'bg-[#181B22] hover:bg-[#22262E] border-[#22262E] text-[#8A93A4] hover:text-white'
                        } border rounded transition-all`}
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen (F)"}
                    >
                        {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
                    </button>
                </div>
            </header>

            <main className={`flex-1 grid grid-cols-12 gap-px ${
                isThemeLight ? 'bg-slate-200' : 'bg-[#22262E]'
            } overflow-visible lg:overflow-hidden`}>
                {/* Left: The "Now" Block */}
                <div className={`col-span-12 lg:col-span-8 ${
                    isThemeLight ? 'bg-white border-slate-200' : 'bg-[#090A0C] border-[#22262E]'
                } p-6 lg:p-10 flex flex-col justify-between border-r`}>
                    {program.status === 'concluded' && !program.isTimerActive ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] mb-6">
                                <CheckCircle2 size={34} />
                            </div>
                            <span className="text-[11px] font-mono font-bold text-[#10B981] uppercase tracking-[0.25em] mb-2">
                                Broadcast Complete
                            </span>
                            <h2 className={`text-3xl lg:text-5xl font-bold uppercase tracking-tight mb-3 ${
                                isThemeLight ? 'text-slate-900' : 'text-white'
                            }`}>
                                Session Concluded
                            </h2>
                            <p className={`text-sm font-mono max-w-md ${
                                isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'
                            }`}>
                                {program.title} has ended. Standby for next session cues.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <div className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-[0.25em] flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-tally" />
                                    Current Slot • {currentSlotIndex + 1} of {program.slots.length}
                                </div>
                                <h2 className={`text-3xl lg:text-5xl font-bold tracking-tight ${
                                    isThemeLight ? 'text-slate-900' : 'text-white'
                                } uppercase font-mono leading-tight`}>
                                    {currentSlot?.title || 'No Active Slot'}
                                </h2>
                                {currentSlot?.speaker && (
                                    <div className="text-lg lg:text-xl text-[#0EA5E9] flex items-center gap-2 font-mono font-medium mt-1">
                                        <User size={16} /> {currentSlot.speaker}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-baseline gap-4 py-6 lg:py-10">
                                <div className={`text-[16vw] lg:text-[140px] font-mono font-bold leading-none tabular-nums tracking-tight ${
                                    remainingSeconds < 0 
                                        ? 'text-[#EF4444] animate-pulse' 
                                        : (remainingSeconds <= 60 ? 'text-[#F59E0B] animate-pulse' : (isThemeLight ? 'text-slate-950' : 'text-white'))
                                }`}>
                                    {formatCountdown(remainingSeconds)}
                                </div>
                                <div className={`text-xl lg:text-2xl font-mono font-bold ${
                                    isThemeLight ? 'text-slate-400' : 'text-[#6A7382]'
                                } uppercase tracking-widest`}>
                                    {remainingSeconds < 0 ? 'Overtime' : 'Remaining'}
                                </div>
                            </div>

                            <div className={`h-3 ${
                                isThemeLight ? 'bg-slate-100 border-slate-200' : 'bg-[#121418] border-[#22262E]'
                            } rounded-full overflow-hidden border p-0.5`}>
                                <div
                                    className="h-full bg-[#0EA5E9] rounded-full transition-all duration-1000 ease-linear"
                                    style={{ width: `${Math.min(100, (derivedSecondsElapsed / ((currentSlot?.durationMinutes || 1) * 60)) * 100)}%` }}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Technical Cues & ACKs + Tactical Comms */}
                <div className={`col-span-12 lg:col-span-4 flex flex-col ${
                    isThemeLight ? 'bg-slate-50' : 'bg-[#121418]'
                }`}>
                    {/* Tab Navigation Switcher */}
                    <div className={`flex items-center border-b shrink-0 ${isThemeLight ? 'border-slate-200 bg-slate-100' : 'border-[#22262E] bg-[#181B22]'}`}>
                        <button
                            onClick={() => setActiveRightTab('cues')}
                            className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
                                activeRightTab === 'cues'
                                    ? 'border-[#0EA5E9] text-[#0EA5E9] bg-white dark:bg-[#121418]'
                                    : `${isThemeLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#8A93A4] hover:text-white'} border-transparent`
                            }`}
                        >
                            <Activity size={14} />
                            <span>Technical Cues</span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveRightTab('chat');
                                setUnreadChatCount(0);
                            }}
                            className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all relative ${
                                activeRightTab === 'chat'
                                    ? 'border-[#0EA5E9] text-[#0EA5E9] bg-white dark:bg-[#121418]'
                                    : `${isThemeLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#8A93A4] hover:text-white'} border-transparent`
                            }`}
                        >
                            <MessageSquare size={14} />
                            <span>Crew Comms</span>
                            {unreadChatCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                                    {unreadChatCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {activeRightTab === 'cues' ? (
                        <div className="flex-1 overflow-y-auto">
                        {/* Active Cue Block */}
                        <div className={`p-6 space-y-3 border-b ${
                            isThemeLight ? 'border-slate-200' : 'border-[#22262E]'
                        }`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-[0.2em]">Active Production Cue</span>
                                <Activity size={12} className="text-[#10B981]" />
                            </div>
                            <div className={`${
                                isThemeLight ? 'bg-white border-slate-200' : 'bg-[#181B22] border-[#22262E]'
                            } border rounded-md p-4`}>
                                {currentSlot?.productionNotes ? (
                                    <p className={`text-base ${
                                        isThemeLight ? 'text-slate-800' : 'text-[#E1E4EA]'
                                    } leading-snug font-mono`}>
                                        "{currentSlot.productionNotes}"
                                    </p>
                                ) : (
                                    <p className={`${
                                        isThemeLight ? 'text-slate-400' : 'text-[#6A7382]'
                                    } text-xs font-mono italic`}>No cues entered for current slot.</p>
                                )}
                            </div>
                        </div>

                        {/* Next Prep Block */}
                        <div className="p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono font-bold text-[#F59E0B] uppercase tracking-[0.2em]">Upcoming Standby</span>
                                    <span className={`text-[9px] ${
                                        isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'
                                    } font-mono font-semibold uppercase truncate max-w-[200px]`}>Next: {nextSlot?.title || 'Conclude'}</span>
                                </div>
                                <Clock size={12} className="text-[#F59E0B]" />
                            </div>
                            <div className={`${
                                isThemeLight ? 'bg-white border-slate-200' : 'bg-[#181B22] border-[#22262E]'
                            } border rounded-md p-4 relative overflow-hidden`}>
                                {nextSlot?.productionNotes ? (
                                    <p className="text-base text-[#F59E0B] leading-snug font-mono">
                                        "{nextSlot.productionNotes}"
                                    </p>
                                ) : (
                                    <p className={`${
                                        isThemeLight ? 'text-slate-400' : 'text-[#6A7382]'
                                    } text-xs font-mono italic`}>No advance cues required.</p>
                                )}
                            </div>
                        </div>

                        {/* ACK Section */}
                        <div className={`p-6 space-y-3 border-t ${
                            isThemeLight ? 'border-slate-200' : 'border-[#22262E]'
                        }`}>
                            <span className={`text-[10px] font-mono font-bold ${
                                isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'
                            } uppercase tracking-[0.2em]`}>Confirm Readiness</span>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleAck('sound')}
                                    className={`flex flex-col items-center justify-center py-3.5 rounded-md border transition-all ${
                                        isAcked('sound') 
                                            ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' 
                                            : (isThemeLight ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300' : 'bg-[#181B22] border-[#22262E] text-[#8A93A4] hover:text-white hover:border-[#2D333F]')
                                    }`}
                                >
                                    <Volume2 size={18} className="mb-1" />
                                    <span className="text-[9px] font-mono font-bold uppercase">Sound</span>
                                    {isAcked('sound') && <CheckCircle2 size={10} className="mt-1" />}
                                </button>
                                <button
                                    onClick={() => handleAck('lighting')}
                                    className={`flex flex-col items-center justify-center py-3.5 rounded-md border transition-all ${
                                        isAcked('lighting') 
                                            ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' 
                                            : (isThemeLight ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300' : 'bg-[#181B22] border-[#22262E] text-[#8A93A4] hover:text-white hover:border-[#2D333F]')
                                    }`}
                                >
                                    <Lightbulb size={18} className="mb-1" />
                                    <span className="text-[9px] font-mono font-bold uppercase">Lights</span>
                                    {isAcked('lighting') && <CheckCircle2 size={10} className="mt-1" />}
                                </button>
                                <button
                                    onClick={() => handleAck('video')}
                                    className={`flex flex-col items-center justify-center py-3.5 rounded-md border transition-all ${
                                        isAcked('video') 
                                            ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' 
                                            : (isThemeLight ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300' : 'bg-[#181B22] border-[#22262E] text-[#8A93A4] hover:text-white hover:border-[#2D333F]')
                                    }`}
                                >
                                    <Video size={18} className="mb-1" />
                                    <span className="text-[9px] font-mono font-bold uppercase">Video</span>
                                    {isAcked('video') && <CheckCircle2 size={10} className="mt-1" />}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Role selector bar */}
                            <div className={`px-4 py-2.5 border-b shrink-0 flex items-center justify-between ${
                                isThemeLight ? 'bg-slate-100 border-slate-200' : 'bg-[#181B22] border-[#22262E]'
                            }`}>
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Radio size={12} className="text-[#0EA5E9] animate-pulse" />
                                    Your Role:
                                </span>
                                <div className="flex items-center gap-1 font-mono text-[10px]">
                                    {(['sound', 'lighting', 'video', 'speaker', 'operator'] as const).map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setSelectedRole(role)}
                                            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                                                selectedRole === role
                                                    ? 'bg-[#0EA5E9] text-white shadow-sm'
                                                    : isThemeLight
                                                        ? 'bg-slate-200 text-slate-600 hover:text-slate-900'
                                                        : 'bg-[#121418] text-[#8A93A4] hover:text-white'
                                            }`}
                                        >
                                            {role === 'speaker' ? 'Speaker' : role === 'lighting' ? 'Lights' : role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Messages stream */}
                            <div role="log" aria-live="polite" aria-label="Production crew comms" className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
                                {allMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 opacity-60">
                                        <MessageSquare size={32} className="mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-wider">No Crew Messages Yet</p>
                                        <p className="text-[10px] mt-1">Tap a quick chip below or type a message to silently ping the booth & stage.</p>
                                    </div>
                                ) : (
                                    allMessages.map((msg, i) => {
                                        const isSpeaker = msg.senderRole === 'speaker';
                                        const isAudio = msg.senderRole === 'sound';
                                        const isLights = msg.senderRole === 'lighting';
                                        const isVideo = msg.senderRole === 'video';

                                        return (
                                            <div
                                                key={msg.id || i}
                                                className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                                                    isSpeaker 
                                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                                        : isAudio
                                                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                                                            : isLights
                                                                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                                                                : isVideo
                                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                                                    : (isThemeLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#181B22] border-[#22262E] text-slate-200')
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1 text-[9px] font-bold uppercase tracking-wider opacity-80">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                        {msg.senderName}
                                                    </span>
                                                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                </div>
                                                <div className="text-xs font-sans font-medium">{msg.message}</div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* 1-Tap Quick Comms Radio Chips */}
                            <div className={`p-2.5 border-t shrink-0 ${
                                isThemeLight ? 'bg-slate-100 border-slate-200' : 'bg-[#181B22] border-[#22262E]'
                            }`}>
                                <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                    <Sparkles size={10} className="text-[#0EA5E9]" />
                                    <span>Quick Radio Chips:</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {QUICK_TACTICAL_CHIPS.map((chip, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendChatMessage(chip.msg)}
                                            className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold text-left truncate transition-all ${
                                                isThemeLight
                                                    ? 'bg-white border-slate-200 text-slate-700 hover:border-[#0EA5E9] hover:text-[#0EA5E9]'
                                                    : 'bg-[#121418] border-[#22262E] text-[#8A93A4] hover:border-[#0EA5E9] hover:text-white'
                                            }`}
                                            title={chip.msg}
                                        >
                                            {chip.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chat Input Bar */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendChatMessage();
                                }}
                                className={`p-3 border-t shrink-0 flex items-center gap-2 ${
                                    isThemeLight ? 'bg-white border-slate-200' : 'bg-[#121418] border-[#22262E]'
                                }`}
                            >
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Send tactical note to crew..."
                                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono outline-none border transition-all ${
                                        isThemeLight
                                            ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#0EA5E9]'
                                            : 'bg-[#181B22] border-[#22262E] text-white focus:border-[#0EA5E9]'
                                    }`}
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="p-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-40 text-white rounded-xl transition-all shadow-sm"
                                    title="Send Message"
                                >
                                    <Send size={14} />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Meta Footer */}
                    <div className={`p-4 ${
                        isThemeLight ? 'bg-white border-slate-200' : 'bg-[#181B22] border-[#22262E]'
                    } border-t`}>
                        <div className={`flex items-center justify-between text-[10px] font-mono font-bold ${
                            isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'
                        }`}>
                            <span className="uppercase tracking-widest">Tactical HUD</span>
                            <span className="tabular-nums uppercase tracking-widest">
                                {new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Status Footer */}
            <footer className={`px-6 py-2 ${
                isThemeLight ? 'bg-white border-slate-200' : 'bg-[#121418] border-[#22262E]'
            } border-t flex items-center justify-between text-[9px] font-mono`}>
                <div className={`${isThemeLight ? 'text-slate-400' : 'text-[#6A7382]'} uppercase font-bold tracking-widest`}>Kairon HUD // Ref: {targetId || 'Live'}</div>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className={`${isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'} font-bold uppercase`}>Sync Live</span>
                </div>
            </footer>
        </div>
    );
};
