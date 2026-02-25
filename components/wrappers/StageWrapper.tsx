import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Program, Organization } from '../../types';
import { getProgramById, getPublicProgram } from '../../services/programService';
import { getOrganizationById } from '../../services/orgService';
import { RealtimeService, TimerState } from '../../services/realtimeService';
import { AlertCircle, RefreshCw } from 'lucide-react';
import StageDisplay from '../StageDisplay';

const StageWrapper: React.FC = () => {
    const [searchParams] = useSearchParams();
    const programId = searchParams.get('id');

    const [program, setProgram] = useState<Program | null>(null);
    const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [networkError, setNetworkError] = useState<string | null>(null);

    // Live State
    const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [timerStartTimestamp, setTimerStartTimestamp] = useState<number | null>(null);
    const [lastPulseTime, setLastPulseTime] = useState<number | null>(null);
    const [isAdminOnline, setIsAdminOnline] = useState(true);
    const [realtime] = useState(() => new RealtimeService());

    // Initial Load with Resilience
    useEffect(() => {
        if (!programId) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        const connectionTimeout = setTimeout(() => {
            if (loading && isMounted) {
                console.warn("StageWrapper: Connection timeout reached.");
                setNetworkError("Sync Timeout: The stage monitor is taking too long to connect.");
                setLoading(false);
            }
        }, 10000);

        const fetchData = async () => {
            try {
                // Try private fetch first
                let data = await getProgramById(programId);

                // If private fails (e.g. unauthenticated), try public fallback
                if (!data) {
                    console.log("StageWrapper: Private access failed, trying public fallback...");
                    data = await getPublicProgram(programId);
                }

                if (data && isMounted) {
                    setProgram(data);
                    setCurrentSlotIndex(data.currentSlotIndex ?? 0);
                    setIsTimerActive(data.isTimerActive ?? false);
                    setSecondsElapsed(data.secondsElapsed ?? 0);
                    setTimerStartTimestamp(data.timerStartTimestamp ?? null);
                    setNetworkError(null);

                    // Load Branding efficiently
                    if (data.organizationId) {
                        const org = await getOrganizationById(data.organizationId);
                        if (org && isMounted) setActiveOrg(org);
                    }
                } else if (isMounted) {
                    setNetworkError("Monitor Target Invalid: The program link is incorrect.");
                }
            } catch (err) {
                console.error("StageWrapper: Load failed:", err);
                if (isMounted) setNetworkError("Sync Failure: Connection lost during heartbeat.");
            } finally {
                if (isMounted) {
                    setLoading(false);
                    clearTimeout(connectionTimeout);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            clearTimeout(connectionTimeout);
        };
    }, [programId]);

    // Realtime Subscription
    useEffect(() => {
        if (!programId) return;

        console.log('StageWrapper: Subscribing to:', programId);
        const unsubscribe = realtime.subscribe(
            programId,
            (state: TimerState) => {
                setLastPulseTime(Date.now());
                setCurrentSlotIndex(state.currentSlotIndex);
                setIsTimerActive(state.isTimerActive);
                setTimerStartTimestamp(state.timerStartTimestamp);

                if (state.hasOwnProperty('isOnHold')) {
                    setProgram(prev => prev ? ({ ...prev, isOnHold: state.isOnHold, holdMessage: state.holdMessage }) : null);
                }

                if (state.isTimerActive && state.timerStartTimestamp) {
                    const elapsed = Math.floor((Date.now() - state.timerStartTimestamp) / 1000);
                    setSecondsElapsed(elapsed);
                } else {
                    setSecondsElapsed(state.secondsElapsed);
                }
            },
            (updatedProgram) => {
                setProgram(updatedProgram);
            },
            undefined,
            (payload) => {
                setLastPulseTime(Date.now());
                const state = payload.state;
                setCurrentSlotIndex(state.currentSlotIndex);
                setIsTimerActive(state.isTimerActive);
                setTimerStartTimestamp(state.timerStartTimestamp);

                if (state.isTimerActive && state.timerStartTimestamp) {
                    const elapsed = Math.floor((Date.now() - state.timerStartTimestamp) / 1000);
                    setSecondsElapsed(elapsed);
                } else {
                    setSecondsElapsed(state.secondsElapsed);
                }
            },
            (presence) => {
                const onlineAdmins = Object.values(presence).flat().filter((p: any) => p.role === 'admin');
                setIsAdminOnline(onlineAdmins.length > 0);
            }
        );

        return () => {
            console.log('StageWrapper: Unsubscribing');
            unsubscribe();
        };
    }, [programId]);

    // Derived state for sync resilience (Self-Healing)
    const isSyncGraceActive = lastPulseTime ? (Date.now() - lastPulseTime < 60000) : false;
    const isSyncEffective = isAdminOnline || isSyncGraceActive;

    // Tick Logic
    useEffect(() => {
        let interval: number;
        if (isTimerActive && timerStartTimestamp && isSyncEffective) {
            interval = window.setInterval(() => {
                const now = Date.now();
                const exactElapsed = Math.floor((now - timerStartTimestamp) / 1000);
                setSecondsElapsed(exactElapsed);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, timerStartTimestamp, isSyncEffective]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium tracking-[0.3em] uppercase text-[10px]">Syncing Stage Pulse...</p>
            </div>
        );
    }

    if (networkError || !program) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <AlertCircle className="text-emerald-500" size={40} />
                    </div>

                    <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase tracking-tighter">Stage Disconnected</h1>
                    <p className="text-slate-400 mb-10 leading-relaxed text-xs uppercase tracking-widest">
                        {networkError || "Pulse connection failed. Verify program settings in the Admin console."}
                    </p>

                    <div className="text-left bg-black/40 p-5 rounded-2xl mb-10 border border-slate-800/50">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Technical Context</h3>
                        <p className="text-[10px] text-slate-600 font-mono break-all mb-1">
                            P_ID: {programId}
                        </p>
                        <p className="text-[10px] text-slate-600 font-mono break-all uppercase">
                            SRV: {import.meta.env.VITE_SUPABASE_URL?.replace('https://', '')}
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

    return (
        <StageDisplay
            program={program}
            currentSlotIndex={currentSlotIndex}
            isTimerActive={isTimerActive}
            secondsElapsed={secondsElapsed}
            activeOrg={activeOrg}
        />
    );
};

export default StageWrapper;
