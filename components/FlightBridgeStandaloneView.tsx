import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlightBridge } from './FlightBridge';
import { Program } from '../types';
import { useTimerSync } from '../hooks/useTimerSync';
import { useUIStore } from '../store/uiStore';
import { useQuery } from '../hooks/useConvexMock';
import { api } from '../convex/_generated/api';
import { GripHorizontal, X, Sun, Moon } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

export const FlightBridgeStandaloneView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const hashParams = typeof window !== 'undefined' && window.location.hash.includes('?')
        ? new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf('?')))
        : null;
    const programId = searchParams.get('id') || searchParams.get('programId') || hashParams?.get('id') || hashParams?.get('programId');

    const globalDarkMode = useUIStore((state) => state.isDarkMode);
    const toggleGlobalTheme = useUIStore((state) => state.toggleTheme);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(globalDarkMode);

    const toggleTheme = () => {
        setIsDarkMode(prev => {
            const next = !prev;
            toggleGlobalTheme();
            return next;
        });
    };

    // Convex queries if online
    const specificProgram = useQuery(
        api.programs.getProgramById,
        programId ? { id: programId as any } : "skip"
    );

    const liveProgram = useQuery(
        api.programs.getLiveProgram,
        {}
    );

    // Local offline program fallback
    const [localProgram, setLocalProgram] = useState<Program | null>(() => {
        try {
            const cleanId = programId ? programId.replace(/^local-/, '') : null;
            const candidates = [
                programId ? `kairon_offline_cache_${programId}` : null,
                cleanId ? `kairon_offline_cache_${cleanId}` : null,
                'kairon_offline_cache_live',
                'kairon_program'
            ].filter(Boolean) as string[];

            for (const key of candidates) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed && (parsed.id === programId || parsed.id?.replace(/^local-/, '') === cleanId || !programId || parsed.status === 'live')) {
                        return parsed;
                    }
                }
            }

            const listKeys = ['test_programs', 'kairon_offline_programs', 'programs'];
            for (const key of listKeys) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const list = JSON.parse(raw);
                    if (Array.isArray(list) && list.length > 0) {
                        if (programId) {
                            const found = list.find((p: any) => p.id === programId || p.id?.replace(/^local-/, '') === cleanId || p.slug === cleanId);
                            if (found) return found;
                        }
                        return list[0];
                    }
                }
            }
            return {
                id: programId || 'local-default',
                title: 'Live Service Rundown',
                subtitle: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                slots: [],
                status: 'draft',
                createdAt: new Date().toISOString()
            } as Program;
        } catch {
            return {
                id: programId || 'local-default',
                title: 'Live Service Rundown',
                subtitle: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '09:00',
                slots: [],
                status: 'draft',
                createdAt: new Date().toISOString()
            } as Program;
        }
    });

    const activeConvexData = (programId && specificProgram) ? specificProgram : liveProgram;
    const programFromConvex = activeConvexData ? {
        ...(activeConvexData as any),
        id: (activeConvexData as any)._id || (activeConvexData as any).id
    } as Program : null;

    const programFromConvexRef = useRef(programFromConvex);
    programFromConvexRef.current = programFromConvex;

    const [currentSlotIndex, setCurrentSlotIndex] = useState<number>(() => {
        return localProgram?.currentSlotIndex ?? 0;
    });
    const [isTimerActive, setIsTimerActive] = useState<boolean>(() => {
        return localProgram?.isTimerActive ?? false;
    });
    const [timerStartTimestamp, setTimerStartTimestamp] = useState<number | null>(() => {
        return localProgram?.timerStartTimestamp ?? null;
    });
    const [storedSecondsElapsed, setStoredSecondsElapsed] = useState<number>(() => {
        return localProgram?.secondsElapsed ?? 0;
    });

    // Realtime Drift-Proof Timer
    const calculatedElapsed = useTimerSync(timerStartTimestamp, isTimerActive, storedSecondsElapsed);

    // Merge incoming real-time timer state from Electron IPC & BroadcastChannel
    const mergeIncomingData = useCallback((data: any) => {
        if (!data) return;
        const inc = data.program || data;
        
        if (data.currentSlotIndex !== undefined) setCurrentSlotIndex(data.currentSlotIndex);
        if (data.isTimerActive !== undefined) setIsTimerActive(Boolean(data.isTimerActive));
        if (data.timerStartTimestamp !== undefined) setTimerStartTimestamp(data.timerStartTimestamp);
        if (data.secondsElapsed !== undefined) setStoredSecondsElapsed(data.secondsElapsed);

        setLocalProgram(prev => {
            const base = prev || programFromConvexRef.current;
            if (!base) return inc;
            return {
                ...base,
                ...(data.program || {}),
                currentSlotIndex: data.currentSlotIndex !== undefined ? data.currentSlotIndex : base.currentSlotIndex,
                isTimerActive: data.isTimerActive !== undefined ? Boolean(data.isTimerActive) : base.isTimerActive,
                timerStartTimestamp: data.timerStartTimestamp !== undefined ? data.timerStartTimestamp : base.timerStartTimestamp,
                secondsElapsed: data.secondsElapsed !== undefined ? data.secondsElapsed : base.secondsElapsed,
                isOnHold: data.isOnHold !== undefined ? data.isOnHold : (inc.isOnHold !== undefined ? inc.isOnHold : base.isOnHold),
                isManualMode: data.isManualMode !== undefined ? data.isManualMode : (inc.isManualMode !== undefined ? inc.isManualMode : base.isManualMode),
                status: data.status || inc.status || base.status,
            };
        });
    }, []);

    // Request initial state from controller on mount
    useEffect(() => {
        try {
            const controlChan = new BroadcastChannel('kairon_control_sync');
            controlChan.postMessage({ type: 'TIMER_CONTROL', action: 'REQUEST_SYNC' });
            controlChan.close();
        } catch {}
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.sendTimerControl === 'function') {
            electron.sendTimerControl({ action: 'REQUEST_SYNC' });
        }
    }, []);

    // Subscribe to Electron IPC timer push
    useEffect(() => {
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.getLastTimerState === 'function') {
            electron.getLastTimerState().then((cached: any) => {
                if (cached) mergeIncomingData(cached);
            }).catch(() => {});
        }
        if (electron && typeof electron.onTimerState === 'function') {
            const unsub = electron.onTimerState((payload: any) => {
                mergeIncomingData(payload);
            });
            return () => {
                if (typeof unsub === 'function') unsub();
            };
        }
    }, [mergeIncomingData]);

    // Subscribe to BroadcastChannel kairon_offline_sync
    useEffect(() => {
        const channel = new BroadcastChannel('kairon_offline_sync');
        const handleMsg = (e: MessageEvent) => {
            if (e.data) {
                mergeIncomingData(e.data);
            }
        };
        channel.addEventListener('message', handleMsg);
        return () => {
            channel.removeEventListener('message', handleMsg);
            channel.close();
        };
    }, [mergeIncomingData]);

    // Dispatcher for timer controls back to the controller window
    const sendControl = useCallback((action: string, payload: Record<string, any> = {}) => {
        const msg = { action, ...payload };
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.sendTimerControl === 'function') {
            electron.sendTimerControl(msg);
        }
        try {
            const controlChan = new BroadcastChannel('kairon_control_sync');
            controlChan.postMessage({ type: 'TIMER_CONTROL', ...msg });
            controlChan.close();
        } catch {}
    }, []);

    // Control Handlers
    const handleToggleTimer = useCallback((target?: Program, force?: boolean, seconds?: number) => {
        const nextState = force !== undefined ? force : !isTimerActive;
        setIsTimerActive(nextState);
        if (nextState) {
            setTimerStartTimestamp(Date.now() - ((seconds ?? calculatedElapsed) * 1000));
        } else {
            setStoredSecondsElapsed(seconds ?? calculatedElapsed);
            setTimerStartTimestamp(null);
        }
        sendControl('TOGGLE_TIMER', { force: nextState, seconds: seconds ?? calculatedElapsed });
    }, [isTimerActive, calculatedElapsed, sendControl]);

    const handleToggleHold = useCallback((nextState?: boolean, targetId?: string) => {
        setLocalProgram(prev => prev ? { ...prev, isOnHold: nextState ?? !prev.isOnHold } : prev);
        sendControl('HOLD', { nextState, targetId });
    }, [sendControl]);

    const handleNext = useCallback((targetId?: string) => {
        setCurrentSlotIndex(prev => prev + 1);
        sendControl('NEXT', { targetId });
    }, [sendControl]);

    const handlePrev = useCallback((targetId?: string) => {
        setCurrentSlotIndex(prev => Math.max(0, prev - 1));
        sendControl('PREV', { targetId });
    }, [sendControl]);

    const handleNudge = useCallback((minutes: number) => {
        sendControl('NUDGE', { minutes });
    }, [sendControl]);

    const [isEndModalOpen, setIsEndModalOpen] = useState(false);
    const handleEndEvent = useCallback((targetId?: string) => {
        setIsTimerActive(false);
        setTimerStartTimestamp(null);
        sendControl('END_EVENT', { targetId });
    }, [sendControl]);

    const handleRequestEndEvent = useCallback(() => {
        setIsEndModalOpen(true);
    }, []);

    const handleToggleManualMode = useCallback(() => {
        setLocalProgram(prev => prev ? { ...prev, isManualMode: !prev.isManualMode } : prev);
        sendControl('TOGGLE_MANUAL', {});
    }, [sendControl]);

    const handleCloseWindow = () => {
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.closeFlightBridge === 'function') {
            electron.closeFlightBridge();
        } else {
            window.close();
        }
    };

    const effectiveProgram = localProgram || programFromConvex;

    if (!effectiveProgram) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#090A0C] text-slate-400 p-4 font-mono text-xs">
                <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-emerald-500 animate-spin mb-3" />
                <span>CONNECTING TO KAIRON ENGINE...</span>
            </div>
        );
    }

    return (
        <div className={`h-screen w-screen flex flex-col ${isDarkMode ? 'dark bg-[#090A0C] text-white' : 'bg-slate-50 text-slate-900'} select-none overflow-hidden`}>
            {/* Native OS Frameless Drag Header */}
            <div 
                style={{ WebkitAppRegion: 'drag' } as any}
                className="h-8 px-3 bg-slate-900 border-b border-slate-800 text-slate-400 text-xs font-mono flex items-center justify-between shrink-0 select-none cursor-move"
                title="Drag to position Flight Bridge anywhere across your desktop or monitors"
            >
                <div className="flex items-center gap-2 pointer-events-none">
                    <GripHorizontal size={13} className="text-slate-500" />
                    <span className={`w-2 h-2 rounded-full ${
                        effectiveProgram.isOnHold ? 'bg-amber-500 animate-pulse' : (isTimerActive ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500')
                    }`} />
                    <span className="font-bold text-[10px] tracking-wider text-slate-200">
                        FLIGHT BRIDGE HUD
                    </span>
                </div>

                <div 
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                    className="flex items-center gap-1 cursor-default pointer-events-auto"
                >
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                        title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                    >
                        {isDarkMode ? <Sun size={12} /> : <Moon size={12} />}
                    </button>
                    <button
                        type="button"
                        onClick={handleCloseWindow}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Close Flight Bridge"
                    >
                        <X size={13} />
                    </button>
                </div>
            </div>

            {/* Main Flight Bridge Content */}
            <div className="flex-1 overflow-hidden">
                <FlightBridge
                    program={effectiveProgram}
                    currentSlotIndex={currentSlotIndex}
                    isTimerActive={isTimerActive}
                    secondsElapsed={calculatedElapsed}
                    isDarkMode={isDarkMode}
                    onToggleTheme={toggleTheme}
                    onToggleTimer={handleToggleTimer}
                    onToggleHold={handleToggleHold}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onNudge={handleNudge}
                    onEndEvent={handleEndEvent}
                    onRequestEndEvent={handleRequestEndEvent}
                    isManualMode={Boolean(effectiveProgram.isManualMode)}
                    onToggleManualMode={handleToggleManualMode}
                />
            </div>

            {/* In-Window Confirmation Modal for End Event */}
            <ConfirmationModal
                isOpen={isEndModalOpen}
                title="End Live Service?"
                message="Are you sure you want to conclude the live event from Flight Bridge? This will stop the active broadcast timer and freeze displays."
                confirmText="Conclude Service"
                cancelText="Cancel"
                type="danger"
                onConfirm={() => {
                    setIsEndModalOpen(false);
                    handleEndEvent(effectiveProgram.id);
                }}
                onClose={() => setIsEndModalOpen(false)}
            />
        </div>
    );
};
export default FlightBridgeStandaloneView;
