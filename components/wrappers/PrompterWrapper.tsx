import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '../../hooks/useConvexMock';
import { api } from '../../convex/_generated/api';
import { Program, Organization } from '../../types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { PrompterDisplay } from '../PrompterDisplay';

const PrompterWrapper: React.FC = () => {
    const [searchParams] = useSearchParams();
    const programId = searchParams.get('id');
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

    const [localOfflineProgram, setLocalOfflineProgram] = useState<Program | null>(() => {
        try {
            const cached = localStorage.getItem(`kairon_offline_cache_${programId || 'live'}_prompter`);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        const offlineChannel = new BroadcastChannel('kairon_offline_sync');
        const handleOfflineMsg = (event: MessageEvent) => {
            const data = event.data;
            if (data.id === programId || (!programId && (data.program?.status === 'live' || localOfflineProgram?.status === 'live'))) {
                setLocalOfflineProgram(prev => {
                    let updated: Program | null = null;
                    if (data.program) {
                        updated = { ...data.program, id: data.id };
                    } else if (prev) {
                        updated = {
                            ...prev,
                            ...data
                        } as Program;
                    }
                    if (updated) {
                        try {
                            localStorage.setItem(`kairon_offline_cache_${programId || 'live'}_prompter`, JSON.stringify(updated));
                        } catch (err) {
                            console.error("Failed to cache program locally:", err);
                        }
                    }
                    return updated;
                });
            }
        };
        offlineChannel.addEventListener('message', handleOfflineMsg);
        return () => {
            offlineChannel.removeEventListener('message', handleOfflineMsg);
            offlineChannel.close();
        };
    }, [programId, localOfflineProgram]);

    // Prioritize specific ID, but fallback to live session if ID not found
    const activeData = (programId && specificProgram) ? specificProgram : liveProgram;

    // Derive the program object with explicit ID mapping
    const programFromConvex = activeData ? {
        ...(activeData as any),
        id: (activeData as any)._id || (activeData as any).id
    } as Program : null;

    // Fallback logic: use Convex if online and loaded, otherwise use offline broadcast cache
    const isOfflineMode = typeof window !== 'undefined' && !window.navigator.onLine;
    const program = (isOfflineMode && localOfflineProgram) 
        ? localOfflineProgram 
        : (programFromConvex || localOfflineProgram);

    // Organization Branding Query
    const activeOrg = useQuery(
        api.orgs.getOrganizationById,
        program?.organizationId ? { id: program.organizationId } : "skip"
    ) as Organization | null;

    // Use a simple ticker to force re-render every second for the countdown
    const [, setTick] = useState(0);

    // BroadcastChannel Display Telemetry & Remote Actions
    useEffect(() => {
        // Detect if inside an iframe or in thumbnail mode
        const isThumbnail = new URLSearchParams(window.location.search).get('mode') === 'thumbnail';
        const isIframe = window.self !== window.top;
        if (isThumbnail || isIframe) return;

        const channel = new BroadcastChannel('kairon_displays');
        
        const handleMessage = (event: MessageEvent) => {
            const { type, tabId: targetTabId } = event.data;
            if (type === 'toggle_theme' && targetTabId === 'prompter') {
                toggleTheme();
            }
        };
        channel.addEventListener('message', handleMessage);
        
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
                isDarkMode
            });
        };
        
        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 1000);
        
        return () => {
            clearInterval(interval);
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, [toggleTheme, isDarkMode]);

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

    if (networkError || !program) {
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
