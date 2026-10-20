import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '../../hooks/useConvexMock';
import { api } from '../../convex/_generated/api';
import { Program, Organization } from '../../types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { PrompterDisplay } from '../PrompterDisplay';

const PrompterWrapper: React.FC = () => {
    const [searchParams] = useSearchParams();
    // Accept both ?id= (canonical) and ?programId= (legacy callers from MenuBar / RightDock)
    const hashParams = typeof window !== 'undefined' && window.location.hash.includes('?')
        ? new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf('?')))
        : null;
    const programId = searchParams.get('id') || searchParams.get('programId') || hashParams?.get('id') || hashParams?.get('programId');
    const themeParam = searchParams.get('theme') || hashParams?.get('theme');

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

    const [localOfflineProgram, setLocalOfflineProgram] = useState<Program | null>(() => {
        try {
            const cleanId = programId ? programId.replace(/^local-/, '') : null;
            if (programId) {
                const candidates = [
                    `kairon_offline_cache_${programId}`,
                    cleanId ? `kairon_offline_cache_${cleanId}` : null,
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
                if (parsed && parsed.status === 'live' && parsed.slots && parsed.slots.length > 0 && !isStale) {
                    return parsed;
                }
            }
            return null;
        } catch {
            return null;
        }
    });

    // References so IPC & BroadcastChannel callbacks always see latest values without re-subscribing
    const programIdRef = useRef(programId);
    programIdRef.current = programId;

    // Prioritize specific ID, but fallback to live session if ID not found
    const activeData = (programId && specificProgram) ? specificProgram : liveProgram;

    // Derive the program object with explicit ID mapping
    const programFromConvex = activeData ? {
        ...(activeData as any),
        id: (activeData as any)._id || (activeData as any).id
    } as Program : null;

    const programFromConvexRef = useRef(programFromConvex);
    programFromConvexRef.current = programFromConvex;

    const mergeIncomingData = (data: any) => {
        const pid = programIdRef.current;
        const cleanPid = pid?.replace(/^local-/, '');
        const cleanDataId = data.id?.replace(/^local-/, '');
        const isMatch = (cleanPid && cleanDataId === cleanPid) || data.id === pid;

        if (isMatch || (!pid && (data.program?.status === 'live' || data.status === 'live' || data.isTimerActive))) {
            setLocalOfflineProgram(prev => {
                let base = prev || programFromConvexRef.current;
                if (!base) {
                    try {
                        const candidates = [
                            pid ? `kairon_offline_cache_${pid}_prompter` : null,
                            cleanPid ? `kairon_offline_cache_${cleanPid}_prompter` : null,
                            pid ? `kairon_offline_cache_${pid}` : null,
                            cleanPid ? `kairon_offline_cache_${cleanPid}` : null,
                            'kairon_offline_cache_live',
                            'kairon_program'
                        ].filter(Boolean) as string[];
                        for (const key of candidates) {
                            const cached = localStorage.getItem(key);
                            if (cached) {
                                base = JSON.parse(cached);
                                break;
                            }
                        }
                    } catch {}
                }
                let updated: Program | null = null;

                if (data.program) {
                    const inc = data.program;
                    const incomingTimerActive = inc.isTimerActive !== undefined ? inc.isTimerActive : data.isTimerActive;
                    const isIncomingTimerSet = incomingTimerActive !== undefined;
                    const incomingStatus = data.status || inc.status;
                    const isConcluded = incomingStatus === 'concluded' || inc.status === 'concluded';

                    const preservedIsActive = isConcluded
                        ? false
                        : (isIncomingTimerSet ? Boolean(incomingTimerActive) : (base?.isTimerActive ?? false));
                    const preservedTimestamp = isConcluded
                        ? null
                        : ((data.timerStartTimestamp !== undefined ? data.timerStartTimestamp : inc.timerStartTimestamp) !== undefined
                            ? (data.timerStartTimestamp !== undefined ? data.timerStartTimestamp : inc.timerStartTimestamp)
                            : (base?.timerStartTimestamp ?? null));
                    const preservedSlotIdx = (data.currentSlotIndex !== undefined ? data.currentSlotIndex : inc.currentSlotIndex) !== undefined
                        ? (data.currentSlotIndex !== undefined ? data.currentSlotIndex : inc.currentSlotIndex)
                        : (base?.currentSlotIndex ?? 0);
                    const preservedSeconds = (data.secondsElapsed !== undefined ? data.secondsElapsed : inc.secondsElapsed) !== undefined
                        ? (data.secondsElapsed !== undefined ? data.secondsElapsed : inc.secondsElapsed)
                        : (base?.secondsElapsed ?? 0);
                    const isNowLive = !isConcluded && (preservedIsActive || incomingStatus === 'live' || (base?.status === 'live' && incomingStatus !== 'draft'));

                    const effectiveStatus = isConcluded ? 'concluded' : (isNowLive ? 'live' : (incomingStatus || base?.status || 'draft'));

                    if (base &&
                        base.isTimerActive === preservedIsActive &&
                        base.timerStartTimestamp === preservedTimestamp &&
                        base.currentSlotIndex === preservedSlotIdx &&
                        base.secondsElapsed === preservedSeconds &&
                        base.status === effectiveStatus &&
                        base.isOnHold === (inc.isOnHold ?? data.isOnHold ?? base.isOnHold)
                    ) {
                        return base;
                    }

                    updated = {
                        ...(base || {}),
                        ...inc,
                        id: data.id || inc.id || base?.id,
                        isTimerActive: preservedIsActive,
                        timerStartTimestamp: preservedTimestamp,
                        currentSlotIndex: preservedSlotIdx,
                        secondsElapsed: preservedSeconds,
                        status: effectiveStatus,
                        isOnHold: inc.isOnHold ?? data.isOnHold ?? false
                    };
                } else if (base) {
                    const incomingStatus = data.status;
                    const isConcluded = incomingStatus === 'concluded';
                    const isIncomingTimerSet = data.isTimerActive !== undefined;
                    const effectiveIsActive = isConcluded ? false : (isIncomingTimerSet ? Boolean(data.isTimerActive) : (base.isTimerActive ?? false));
                    const effectiveStatus = isConcluded ? 'concluded' : (data.status || (effectiveIsActive ? 'live' : base.status));

                    if (
                        (incomingStatus === undefined || incomingStatus === base.status) &&
                        (data.isTimerActive === undefined || data.isTimerActive === base.isTimerActive) &&
                        (data.currentSlotIndex === undefined || data.currentSlotIndex === base.currentSlotIndex) &&
                        (data.isOnHold === undefined || data.isOnHold === base.isOnHold) &&
                        (data.secondsElapsed === undefined || data.secondsElapsed === base.secondsElapsed) &&
                        (data.timerStartTimestamp === undefined || data.timerStartTimestamp === base.timerStartTimestamp)
                    ) {
                        return base;
                    }
                    updated = {
                        ...base,
                        ...data,
                        isTimerActive: effectiveIsActive,
                        status: effectiveStatus
                    } as Program;
                }

                if (updated) {
                    try { localStorage.setItem(`kairon_offline_cache_${pid || 'live'}_prompter`, JSON.stringify(updated)); } catch {}
                }
                return updated || prev;
            });
        }
    };

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

    // Booth mode / test bypass always uses local BroadcastChannel/IPC data — never stale Convex queries
    const isBoothMode = typeof window !== 'undefined' && (
        localStorage.getItem('kairon_booth_mode') === 'true' ||
        window.location.search.includes('testBypass=true') ||
        localStorage.getItem('testBypass') === 'true' ||
        Boolean((window as any).electron?.isElectron || (window as any).electronAPI?.isElectron)
    );
    const candidateProg = programFromConvex || localOfflineProgram;
    const program = (() => {
        if (!candidateProg) return null;
        if (!localOfflineProgram) return candidateProg;
        if (!programFromConvex) return localOfflineProgram;

        // Determine if there is an active live timer anywhere
        const isActivelyLive = Boolean(
            localOfflineProgram.isTimerActive ||
            programFromConvex.isTimerActive ||
            localOfflineProgram.status === 'live' ||
            programFromConvex.status === 'live'
        );

        // High-precision live timer telemetry resolution:
        // Always prioritize the active running timer timestamp from whichever source is actively ticking
        const resolveLiveTiming = (isActive: boolean) => {
            if (!isActive) return { timestamp: null, seconds: localOfflineProgram.secondsElapsed || programFromConvex.secondsElapsed || 0 };
            const activeSource = (localOfflineProgram.isTimerActive && localOfflineProgram.timerStartTimestamp)
                ? localOfflineProgram
                : (programFromConvex.isTimerActive && programFromConvex.timerStartTimestamp
                    ? programFromConvex
                    : (localOfflineProgram.timerStartTimestamp ? localOfflineProgram : programFromConvex));
            return {
                timestamp: activeSource.timerStartTimestamp ?? null,
                seconds: activeSource.secondsElapsed ?? 0
            };
        };

        // If in booth / offline / test bypass mode, local offline program takes precedence for runtime state
        if (isBoothMode) {
            const effectiveStatus = isActivelyLive
                ? 'live'
                : ((localOfflineProgram.status === 'concluded' || programFromConvex.status === 'concluded')
                    ? 'concluded'
                    : (programFromConvex.status || localOfflineProgram.status || 'draft'));

            const effectiveIsTimerActive = effectiveStatus === 'concluded'
                ? false
                : Boolean(localOfflineProgram.isTimerActive ?? programFromConvex.isTimerActive ?? false);

            const timing = resolveLiveTiming(effectiveIsTimerActive);

            return {
                ...programFromConvex,
                ...localOfflineProgram,
                slots: (localOfflineProgram.slots && localOfflineProgram.slots.length > 0)
                    ? localOfflineProgram.slots
                    : (programFromConvex.slots || []),
                isTimerActive: effectiveIsTimerActive,
                status: effectiveStatus,
                currentSlotIndex: localOfflineProgram.currentSlotIndex ?? 0,
                timerStartTimestamp: timing.timestamp,
                secondsElapsed: timing.seconds,
            };
        }

        const isLocalLiveOrConcluded = localOfflineProgram.status === 'live' || localOfflineProgram.status === 'concluded' || Boolean(localOfflineProgram.isTimerActive);
        const isConvexLiveOrConcluded = programFromConvex.status === 'live' || programFromConvex.status === 'concluded' || Boolean(programFromConvex.isTimerActive);

        if (isLocalLiveOrConcluded && !isConvexLiveOrConcluded) {
            const effectiveStatus = isActivelyLive ? 'live' : (localOfflineProgram.status || (localOfflineProgram.isTimerActive ? 'live' : 'draft'));
            const effectiveIsTimerActive = effectiveStatus === 'concluded' ? false : Boolean(localOfflineProgram.isTimerActive);
            const timing = resolveLiveTiming(effectiveIsTimerActive);
            return {
                ...programFromConvex,
                ...localOfflineProgram,
                slots: (localOfflineProgram.slots && localOfflineProgram.slots.length > 0)
                    ? localOfflineProgram.slots
                    : (programFromConvex.slots || []),
                isTimerActive: effectiveIsTimerActive,
                status: effectiveStatus,
                currentSlotIndex: localOfflineProgram.currentSlotIndex ?? 0,
                timerStartTimestamp: timing.timestamp,
                secondsElapsed: timing.seconds,
            };
        }

        if (isConvexLiveOrConcluded && !isLocalLiveOrConcluded) {
            const effectiveStatus = isActivelyLive ? 'live' : (programFromConvex.status || 'live');
            const effectiveIsTimerActive = effectiveStatus === 'concluded' ? false : Boolean(programFromConvex.isTimerActive);
            const timing = resolveLiveTiming(effectiveIsTimerActive);
            return {
                ...localOfflineProgram,
                ...programFromConvex,
                slots: (programFromConvex.slots && programFromConvex.slots.length > 0)
                    ? programFromConvex.slots
                    : (localOfflineProgram.slots || []),
                isTimerActive: effectiveIsTimerActive,
                status: effectiveStatus,
                currentSlotIndex: programFromConvex.currentSlotIndex ?? 0,
                timerStartTimestamp: timing.timestamp,
                secondsElapsed: timing.seconds,
            };
        }

        const convexSlot = programFromConvex.currentSlotIndex ?? 0;
        const localSlot = localOfflineProgram.currentSlotIndex ?? 0;

        // Slot Resolution:
        // If an active session has restarted at Slot 0, honor the live restarted slot rather than forcing Math.max
        const isRewound = isActivelyLive && (convexSlot === 0 || localSlot === 0) && Math.max(convexSlot, localSlot) > 0;
        const effectiveSlot = isRewound
            ? (localOfflineProgram.isTimerActive ? localSlot : (programFromConvex.isTimerActive ? convexSlot : 0))
            : (convexSlot >= localSlot ? convexSlot : localSlot);

        const preferred = convexSlot >= localSlot ? programFromConvex : localOfflineProgram;
        const fallback = convexSlot >= localSlot ? localOfflineProgram : programFromConvex;

        const effectiveStatus = isActivelyLive
            ? 'live'
            : ((programFromConvex.status === 'concluded' || localOfflineProgram.status === 'concluded')
                ? 'concluded'
                : preferred.status);

        const effectiveIsTimerActive = effectiveStatus === 'concluded'
            ? false
            : Boolean(programFromConvex.isTimerActive || localOfflineProgram.isTimerActive);

        const timing = resolveLiveTiming(effectiveIsTimerActive);

        return {
            ...fallback,
            ...preferred,
            slots: (preferred.slots && preferred.slots.length > 0)
                ? preferred.slots
                : (fallback.slots || []),
            isTimerActive: effectiveIsTimerActive,
            currentSlotIndex: effectiveSlot,
            timerStartTimestamp: timing.timestamp,
            secondsElapsed: timing.seconds,
            status: effectiveStatus as any,
        };
    })() as Program | null;


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
                tabId: 'prompter',
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

    const networkError = false;

    if (loading) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-slate-50'} flex flex-col items-center justify-center transition-colors duration-500`}>
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium tracking-[0.3em] uppercase text-[10px]">Loading Prompter Outline...</p>
            </div>
        );
    }

    if (networkError || !program || !program.slots || program.slots.length === 0) {
        return (
            <div className={`w-screen h-screen ${isDarkMode ? 'bg-black' : 'bg-slate-50'} flex flex-col items-center justify-center p-12 text-center transition-colors duration-500`}>
                <h1 className={`${isDarkMode ? 'text-white' : 'text-slate-900'} text-[12vw] font-black uppercase tracking-tighter leading-none mb-8 font-sans`}>Stand By</h1>
                <div className="w-24 h-1 bg-purple-500/50 rounded-full animate-pulse" />
            </div>
        );
    }

    return (
        <PrompterDisplay
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

export default PrompterWrapper;
