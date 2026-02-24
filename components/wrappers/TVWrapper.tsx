import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Program, Organization } from '../../types';
import { getProgramById } from '../../services/programService';
import { getOrganizationById } from '../../services/orgService';
import { RealtimeService, TimerState } from '../../services/realtimeService';
import TVView from '../TVView';

const TVWrapper: React.FC = () => {
    const [searchParams] = useSearchParams();
    const programId = searchParams.get('id');

    const [program, setProgram] = useState<Program | null>(null);
    const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark for TV

    // Live State
    const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [timerStartTimestamp, setTimerStartTimestamp] = useState<number | null>(null);
    const [lastPulseTime, setLastPulseTime] = useState<number | null>(null);
    const [isAdminOnline, setIsAdminOnline] = useState(true);
    const [realtime] = useState(() => new RealtimeService());

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    // Initial Load
    useEffect(() => {
        if (!programId) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const data = await getProgramById(programId);
                if (data) {
                    setProgram(data);
                    setCurrentSlotIndex(data.currentSlotIndex ?? 0);
                    setIsTimerActive(data.isTimerActive ?? false);
                    setSecondsElapsed(data.secondsElapsed ?? 0);
                    setTimerStartTimestamp(data.timerStartTimestamp ?? null);
                }
            } catch (err) {
                console.error("TVWrapper: Failed to load program:", err);
            } finally {
                setLoading(false);
            }
        };

        const loadBranding = async () => {
            try {
                const data = await getProgramById(programId);
                if (data?.organizationId) {
                    const org = await getOrganizationById(data.organizationId);
                    if (org) setActiveOrg(org);
                }
            } catch (err) {
                console.error("TVWrapper: Branding fetch failed:", err);
            }
        };

        loadData();
        loadBranding();
    }, [programId]);

    // Realtime Subscription
    useEffect(() => {
        if (!programId) return;

        console.log('TVWrapper: Subscribing to:', programId);
        const unsubscribe = realtime.subscribe(
            programId,
            (state: TimerState) => {
                setLastPulseTime(Date.now());
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
            console.log('TVWrapper: Unsubscribing');
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
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Connecting to Kairon Sync...</p>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Display Not Configured</h1>
                <p className="text-slate-400 max-w-md"> Please use a link provided by the Admin to launch this projector. </p>
            </div>
        );
    }

    return (
        <TVView
            program={program}
            currentSlotIndex={currentSlotIndex}
            isTimerActive={isTimerActive}
            secondsElapsed={secondsElapsed}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            activeOrg={activeOrg}
        />
    );
};

export default TVWrapper;
