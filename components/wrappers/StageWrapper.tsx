import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getUniversalSearchParams } from '../../utils/url';
import { useQuery } from '../../hooks/useConvexMock';
import { api } from '../../convex/_generated/api';
import { Program, Organization } from '../../types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import StageDisplay from '../StageDisplay';
import {
    KAIRON_IFRAME_SYNC_TYPE,
    TimestampedProgram,
    normalizeProgramId,
    matchesDisplayTarget,
    applyIncomingDisplaySync,
    reconcileDisplayProgram,
} from '../../utils/displaySync';

const StageWrapper: React.FC = () => {
    const [routerSearchParams] = useSearchParams();
    const searchParams = getUniversalSearchParams(routerSearchParams);
    const programId = searchParams.get('id') || searchParams.get('programId');
    const themeParam = searchParams.get('theme');

    const globalDarkMode = useUIStore((state) => state.isDarkMode);
    const isDarkMode = themeParam ? (themeParam === 'dark') : globalDarkMode;
    const toggleTheme = useUIStore((state) => state.toggleTheme);

    const specificProgram = useQuery(
        api.programs.getProgramById,
        programId ? { id: programId as any } : "skip"
    );

    const liveProgram = useQuery(
        api.programs.getLiveProgram,
        {} // Always poll the live channel as a secondary fallback
    );

    const [localOfflineProgram, setLocalOfflineProgram] = useState<TimestampedProgram | null>(() => {
        try {
            const cleanId = programId ? programId.replace(/^local-/, '') : null;
            if (programId) {
                const candidates = [
                    `kairon_offline_cache_${programId}`,
                    cleanId ? `kairon_offline_cache_${cleanId}` : null,
                    'kairon_offline_cache_live',
                ].filter(Boolean) as string[];

                for (const key of candidates) {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        if (parsed && (parsed.id === programId || parsed.id?.replace(/^local-/, '') === cleanId || parsed.slug === cleanId)) {
                            return parsed;
                        }
                    }
                }

                const local = localStorage.getItem('kairon_offline_programs') || ((typeof window !== 'undefined' && (window.location.search.includes('testBypass=true') || sessionStorage.getItem('testBypass') === 'true')) ? localStorage.getItem('test_programs') : null);
                if (local) {
                    const list = JSON.parse(local);
                    if (Array.isArray(list) && list.length > 0) {
                        const found = list.find((p: any) => p.id === programId || p.id?.replace('local-', '') === cleanId || p.slug === cleanId);
                        if (found) return found;
                    }
                }
                return null;
            }

            // If NO programId specified, ONLY show if an event is actively broadcasting live and not stale
            const liveCache = localStorage.getItem('kairon_offline_cache_live');
            if (liveCache) {
                const parsed = JSON.parse(liveCache);
                const isStale = parsed?.timerStartTimestamp && (Date.now() - parsed.timerStartTimestamp > 2 * 60 * 60 * 1000);
                if (parsed && (parsed.status === 'live' || parsed.status === 'concluded') && parsed.slots && parsed.slots.length > 0 && !isStale) {
                    return parsed;
                }
            }
            return null;
        } catch {
            return null;
        }
    });
    const [localUpdatedAt, setLocalUpdatedAt] = useState<number>(0);

    // References so IPC, postMessage & BroadcastChannel callbacks always see latest values without re-subscribing
    const programIdRef = useRef(programId);
    programIdRef.current = programId;

    const cleanRequestedId = normalizeProgramId(programId);
    const liveMatchesRequested = Boolean(
        liveProgram && cleanRequestedId && [
            (liveProgram as any)._id,
            (liveProgram as any).id,
            (liveProgram as any).uuid,
            (liveProgram as any).slug,
        ].some((v) => normalizeProgramId(v) === cleanRequestedId)
    );
    const activeData = programId
        ? (specificProgram || (liveMatchesRequested ? liveProgram : null))
        : liveProgram;

    const programFromConvex = activeData ? {
        ...(activeData as any),
        id: (activeData as any)._id || (activeData as any).id
    } as Program : null;

    const programFromConvexRef = useRef(programFromConvex);
    programFromConvexRef.current = programFromConvex;

    const mergeIncomingData = (data: any) => {
        if (!data) return;
        const pid = programIdRef.current;
        setLocalOfflineProgram((prev) => {
            if (!matchesDisplayTarget(pid, data, prev || programFromConvexRef.current)) {
                return prev;
            }
            const updated = applyIncomingDisplaySync(prev, programFromConvexRef.current, data, pid);
            if (updated) {
                setLocalUpdatedAt(data.syncTimestamp || Date.now());
                try {
                    localStorage.setItem(`kairon_offline_cache_${pid || 'live'}`, JSON.stringify(updated));
                } catch {}
            }
            return updated;
        });
    };

    // Reconcile stale local cache if Convex authoritatively concludes the session remotely
    useEffect(() => {
        if (programFromConvex?.status === 'concluded' && localOfflineProgram?.status === 'live') {
            const syncAt = Math.max(localUpdatedAt, localOfflineProgram._syncTimestamp || 0);
            const startedFreshly = syncAt > 0 && Date.now() - syncAt < 8000 && Boolean(localOfflineProgram.isTimerActive);
            if (!startedFreshly) {
                setLocalOfflineProgram({
                    ...localOfflineProgram,
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

    useEffect(() => {
        const handleStorage = () => {
            const pid = programIdRef.current;
            const cleanPid = normalizeProgramId(pid);
            const candidates = [
                pid ? `kairon_offline_cache_${pid}` : null,
                cleanPid ? `kairon_offline_cache_${cleanPid}` : null,
                'kairon_offline_cache_live',
                'kairon_program'
            ].filter(Boolean) as string[];
            for (const key of candidates) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed && (!pid || parsed.id === pid || normalizeProgramId(parsed.id) === cleanPid || normalizeProgramId(parsed.slug) === cleanPid)) {
                            setLocalOfflineProgram(parsed);
                            setLocalUpdatedAt(parsed._syncTimestamp || Date.now());
                            break;
                        }
                    } catch {}
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [programId]);

    // Direct parent->iframe postMessage sync (guaranteed 0ms delivery on Web & Electron file://)
    useEffect(() => {
        const handleWindowMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === KAIRON_IFRAME_SYNC_TYPE && event.data.payload) {
                mergeIncomingData(event.data.payload);
            }
        };
        window.addEventListener('message', handleWindowMessage);
        return () => window.removeEventListener('message', handleWindowMessage);
    }, []);

    // BroadcastChannel sync effect (same-origin tabs / same renderer process)
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
    }, [programId]);

    // Electron IPC relay effect (cross-BrowserWindow — separate process timer sync)
    useEffect(() => {
        const electronApi = (window as any).electron || (window as any).electronAPI;
        if (!electronApi) return;
        if (typeof electronApi.getLastTimerState === 'function') {
            electronApi.getLastTimerState().then((cached: any) => {
                if (cached) mergeIncomingData(cached);
            }).catch(() => {});
        }
        if (!electronApi.onTimerState) return;
        const remove = electronApi.onTimerState((data: any) => {
            if (data) mergeIncomingData(data);
        });
        return () => { if (remove) remove(); };
    }, []);

    const isBoothOrLocalMode = typeof window !== 'undefined' && (
        localStorage.getItem('kairon_booth_mode') === 'true' ||
        window.location.search.includes('testBypass=true') ||
        localStorage.getItem('testBypass') === 'true' ||
        Boolean(programId?.startsWith('local-')) ||
        window.self !== window.top
    );
    const program = reconcileDisplayProgram({
        localProgram: localOfflineProgram,
        convexProgram: programFromConvex,
        localUpdatedAt,
        preferLocal: isBoothOrLocalMode,
    });

    // Organization Branding Query
    const activeOrg = useQuery(
        api.orgs.getOrganizationById,
        program?.organizationId ? { id: program.organizationId } : "skip"
    ) as Organization | null;

    // Use a simple ticker to force re-render every second for the countdown
    const [, setTick] = useState(0);

    const isDarkModeRef = useRef(isDarkMode);
    isDarkModeRef.current = isDarkMode;

    // BroadcastChannel Display Telemetry
    useEffect(() => {
        // Detect if inside an iframe or in thumbnail mode
        const isThumbnail = new URLSearchParams(window.location.search).get('mode') === 'thumbnail';
        const isIframe = window.self !== window.top;
        if (isThumbnail || isIframe) return;

        const channel = new BroadcastChannel('kairon_displays');
        
        const sendHeartbeat = () => {
            const isBrowserFullscreen = Math.abs(window.screen.width - window.innerWidth) <= 1 && 
                                         Math.abs(window.screen.height - window.innerHeight) <= 1;
            const isFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement ||
                isBrowserFullscreen
            );
            const isOnSecondary = Math.abs(window.screenX) >= 100 || Math.abs(window.screenY) >= 100;

            channel.postMessage({
                type: 'heartbeat',
                tabId: 'stage',
                isFullscreen,
                isOnSecondary,
                isDarkMode: isDarkModeRef.current
            });
        };
        
        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 1000);
        
        return () => {
            clearInterval(interval);
            channel.close();
        };
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const nowTime = Date.now();
    const derivedSecondsElapsed = (program?.isTimerActive && program?.timerStartTimestamp)
        ? Math.max(0, Math.floor((nowTime - program.timerStartTimestamp) / 1000))
        : (program?.secondsElapsed || 0);


    // Handle Loading State (bypass if we have local offline program cached)
    const loading = (programId
        ? (specificProgram === undefined)
        : (liveProgram === undefined)) && !localOfflineProgram;

    // FIX: Treat 'null' as STANDBY, not a network error. 
    // This resolves the "Sync Lost" false positive when no session is live.
    const networkError = false;

    if (loading) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-slate-50'} flex flex-col items-center justify-center transition-colors duration-500`}>
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium tracking-[0.3em] uppercase text-[10px]">Syncing Stage Pulse...</p>
            </div>
        );
    }

    if (networkError || !program || !program.slots || program.slots.length === 0) {
        // If it's a network error, show the diagnostic screen
        if (networkError) {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <AlertCircle className="text-emerald-500" size={40} />
                        </div>

                        <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase tracking-tighter">Sync Lost</h1>
                        <p className="text-slate-400 mb-10 leading-relaxed text-xs uppercase tracking-widest">
                            {"Pulse connection failed. Verify your internet connection."}
                        </p>

                        <div className="text-left bg-black/40 p-5 rounded-2xl mb-10 border border-slate-800/50">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Technical Context</h3>
                            <p className="text-[10px] text-slate-600 font-mono break-all mb-1">
                                P_ID: {programId || 'GLOBAL_LIVE_FEED'}
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                        >
                            <RefreshCw size={18} />
                            Reconnect Pulse
                        </button>
                    </div>
                </div>
            );
        }

        // If no program found (and no network error), show STANDBY
        return (
            <div className={`w-screen h-screen ${isDarkMode ? 'bg-black' : 'bg-slate-50'} flex flex-col items-center justify-center p-12 text-center transition-colors duration-500`}>
                <h1 className={`${isDarkMode ? 'text-white' : 'text-slate-900'} text-[12vw] font-black uppercase tracking-tighter leading-none mb-8 font-sans`}>Stand By</h1>
                <div className="w-24 h-1 bg-emerald-500/50 rounded-full animate-pulse" />
            </div>
        );
    }

    return (
        <StageDisplay
            program={program}
            timerStartTimestamp={program.timerStartTimestamp ?? null}
            currentSlotIndex={program.currentSlotIndex ?? 0}
            isTimerActive={program.isTimerActive ?? false}
            secondsElapsed={derivedSecondsElapsed}
            activeOrg={activeOrg}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            isThumbnail={searchParams.get('mode') === 'thumbnail'}
            customTheme={themeParam || undefined}
        />
    );
};

export default StageWrapper;
