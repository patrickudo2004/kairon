import React, { useEffect, useState, useRef } from 'react';
import { Program, Organization } from '../types';
import { Maximize, Minimize, Sun, Moon, Timer, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDuration } from '../utils/time';
import { useStageMessages } from '../hooks/useStageMessages';
import { useWakeLock } from '../hooks/useWakeLock';
import { useTimerSync } from '../hooks/useTimerSync';

interface TVViewProps {
    program: Program;
    currentSlotIndex: number;
    isTimerActive: boolean;
    secondsElapsed: number;
    timerStartTimestamp?: number | null;
    onToggleTimer?: () => void;
    isDarkMode?: boolean;
    toggleTheme?: () => void;
    activeOrg?: Organization | null;
    isThumbnail?: boolean;
    customTheme?: string;
}

const TVView: React.FC<TVViewProps> = ({
    program,
    currentSlotIndex,
    isTimerActive,
    secondsElapsed,
    timerStartTimestamp = null,
    isDarkMode = true,
    toggleTheme,
    activeOrg,
    isThumbnail = false,
    customTheme
}) => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const isAutoFs = searchParams.get('autofs') === '1';
    const urlTheme = searchParams.get('theme') as 'dark' | 'light' | null;

    const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
        if (urlTheme) return urlTheme;
        if (customTheme === 'dark' || customTheme === 'light') return customTheme;
        const saved = typeof window !== 'undefined' ? localStorage.getItem('kairon_display_theme_tv') : null;
        if (saved === 'dark' || saved === 'light') return saved;
        return isDarkMode ? 'dark' : 'light';
    });

    // Real-time broadcast sync for display theme toggles
    useEffect(() => {
        const channel = new BroadcastChannel('kairon_displays');
        const handleMsg = (e: MessageEvent) => {
            if (e.data && e.data.type === 'toggle_theme' && (e.data.tabId === 'tv' || !e.data.tabId)) {
                setCurrentTheme(prev => {
                    const next = e.data.theme || (prev === 'dark' ? 'light' : 'dark');
                    localStorage.setItem('kairon_display_theme_tv', next);
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

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFsPrompt, setShowFsPrompt] = useState(isAutoFs);
    const { promptMessage } = useStageMessages(program.id);
    const currentSlot = program.slots[currentSlotIndex];
    const nextSlot = program.slots[currentSlotIndex + 1];
    const rundownContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll rundown to keep current slot visible while allowing full scrolling to slot 1
    useEffect(() => {
        if (!rundownContainerRef.current || !program.slots?.[currentSlotIndex]) return;
        const activeElement = document.getElementById(`tv-slot-${program.slots[currentSlotIndex]?.id}`);
        if (activeElement) {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [currentSlotIndex, program.slots]);

    const isVisible = !!promptMessage;

    const localSecondsElapsed = useTimerSync(timerStartTimestamp, isTimerActive, secondsElapsed);
    useWakeLock(true);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setShowFsPrompt(false);
            }).catch(err => {
                console.error("Error attempting to enable fullscreen:", err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);
            if (isFs) setShowFsPrompt(false);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'f' || e.key === 'F' || e.key === 'F11') {
                if (e.key === 'f' || e.key === 'F') e.preventDefault();
                toggleFullscreen();
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
    const timeLeft = durationSeconds - localSecondsElapsed;
    const isOvertime = timeLeft < 0;

    const progressPercent = durationSeconds > 0
        ? Math.min(100, Math.max(0, (timeLeft / durationSeconds) * 100))
        : 0;

    const isThemeLight = currentTheme === 'light';

    return (
        <div 
            onDoubleClick={toggleFullscreen}
            className={`w-screen h-screen ${
                isThemeLight ? 'bg-slate-50 text-slate-900' : 'bg-[#090A0C] text-[#E1E4EA]'
            } flex flex-col justify-between overflow-hidden p-6 md:p-10 select-none font-sans relative transition-colors duration-300`}
        >
            {/* Auto Fullscreen Floating Banner */}
            {showFsPrompt && !isFullscreen && !isThumbnail && (
                <div 
                    onClick={toggleFullscreen}
                    className="cursor-pointer bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-4 py-2 rounded-lg text-center text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl animate-pulse z-50 transition-all shrink-0 mb-3"
                >
                    <Maximize size={14} />
                    <span>⛶ Click anywhere or press F11 to lock Fullscreen</span>
                </div>
            )}

            {/* Subtle Tally Header */}
            <header className={`flex justify-between items-center border-b ${
                isThemeLight ? 'border-slate-200' : 'border-[#22262E]'
            } pb-4 z-10`}>
                <div className="flex items-center gap-3">
                    {activeOrg?.logoUrl ? (
                        <img src={activeOrg.logoUrl} alt={activeOrg.name} className="h-8 object-contain" />
                    ) : (
                        <span className={`text-sm font-mono font-bold tracking-widest ${
                            isThemeLight ? 'text-slate-700' : 'text-[#8A93A4]'
                        } uppercase`}>
                            {program.title}
                        </span>
                    )}
                    <span className={`text-xs font-mono ${isThemeLight ? 'text-slate-300' : 'text-[#6A7382]'}`}>|</span>
                    <span className="text-xs font-mono text-[#0EA5E9] uppercase font-semibold">
                        {program.subtitle || 'Service Schedule'}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {isTimerActive ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-mono font-bold">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-tally"></span>
                            <span>LIVE NOW</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-mono font-bold">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                            <span>STANDBY</span>
                        </div>
                    )}

                    {!isThumbnail && (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => {
                                    const next = isThemeLight ? 'dark' : 'light';
                                    setCurrentTheme(next);
                                    localStorage.setItem('kairon_display_theme_tv', next);
                                }}
                                className={`p-1.5 ${
                                    isThemeLight 
                                        ? 'text-slate-600 hover:text-black hover:bg-slate-200 border border-slate-300' 
                                        : 'text-[#6A7382] hover:text-white hover:bg-[#181B22] border border-[#22262E]'
                                } rounded transition-all`}
                                title="Toggle Theme"
                            >
                                {isThemeLight ? <Moon size={16} /> : <Sun size={16} />}
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className={`p-1.5 ${
                                    isThemeLight 
                                        ? 'text-slate-600 hover:text-black hover:bg-slate-200 border border-slate-300' 
                                        : 'text-[#6A7382] hover:text-white hover:bg-[#181B22] border border-[#22262E]'
                                } rounded transition-all`}
                                title="Toggle Fullscreen"
                            >
                                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Split Screen Layout: Left Rundown Stack / Right Master Focus */}
            <main className="flex-1 grid grid-cols-12 gap-8 my-6 overflow-hidden">
                
                {/* Left Column: Dense Rundown Feed */}
                <div 
                    ref={rundownContainerRef}
                    className="col-span-12 lg:col-span-5 flex flex-col space-y-2.5 overflow-y-auto pr-2 py-1 scroll-smooth"
                >
                    {program.slots.map((slot, idx) => {
                        const isCurrent = idx === currentSlotIndex;
                        const isPast = idx < currentSlotIndex;

                        return (
                            <div
                                key={slot.id}
                                id={`tv-slot-${slot.id}`}
                                className={`p-3.5 rounded-md border transition-all flex items-center justify-between font-mono ${
                                    isCurrent
                                        ? (isThemeLight ? 'bg-white border-[#0EA5E9] text-slate-900 shadow-md ring-1 ring-[#0EA5E9]/30' : 'bg-[#121822] border-[#0EA5E9] text-white shadow-lg')
                                        : isPast
                                            ? (isThemeLight ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 line-through' : 'bg-[#0E1013] border-[#181B22] text-[#4B5563] opacity-50 line-through')
                                            : (isThemeLight ? 'bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-[#121418] border-[#22262E] text-[#8A93A4]')
                                }`}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <span className={`text-xs font-bold ${isCurrent ? 'text-[#0EA5E9]' : (isThemeLight ? 'text-slate-400' : 'text-[#6A7382]')}`}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <div className="truncate">
                                        <div className={`text-sm font-semibold truncate ${isCurrent ? (isThemeLight ? 'text-slate-900 font-bold' : 'text-white') : ''}`}>
                                            {slot.title}
                                        </div>
                                        {slot.speaker && (
                                            <div className={`text-[11px] ${isThemeLight ? 'text-slate-500' : 'text-[#6A7382]'} truncate`}>
                                                {slot.speaker}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right pl-3 shrink-0">
                                    <span className={`text-xs font-bold ${isCurrent ? (isThemeLight ? 'text-slate-900' : 'text-white') : (isThemeLight ? 'text-slate-400' : 'text-[#6A7382]')}`}>
                                        {slot.durationMinutes}m
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Column: Master Focus Card */}
                <div className={`col-span-12 lg:col-span-7 ${
                    isThemeLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#121418] border-[#22262E] shadow-2xl'
                } border rounded-lg p-8 flex flex-col justify-between relative`}>
                    
                    {/* Active Title */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded ${
                                isThemeLight ? 'bg-slate-100 border-slate-200' : 'bg-[#1C2028] border-[#2D333F]'
                            } border text-[10px] font-mono text-[#0EA5E9] uppercase font-bold`}>
                                {currentSlot?.type || 'SESSION'}
                            </span>
                            <span className={`text-xs font-mono ${isThemeLight ? 'text-slate-400' : 'text-[#6A7382]'}`}>
                                SLOT {currentSlotIndex + 1} OF {program.slots.length}
                            </span>
                        </div>
                        <h2 className={`text-3xl md:text-5xl font-bold ${isThemeLight ? 'text-slate-900' : 'text-white'} tracking-tight leading-tight`}>
                            {currentSlot?.title || 'Waiting for start'}
                        </h2>
                        {currentSlot?.speaker && (
                            <p className="text-lg md:text-xl text-[#0EA5E9] font-mono font-medium mt-1">
                                {currentSlot.speaker}
                            </p>
                        )}
                    </div>

                    {/* Digital Countdown */}
                    <div className="my-6">
                        <div className={`text-[15vw] lg:text-[110px] font-mono font-bold leading-none tracking-tight tabular-nums select-none ${
                            isOvertime 
                                ? 'text-[#EF4444] animate-pulse' 
                                : (isTimerActive ? (isThemeLight ? 'text-slate-950' : 'text-white') : (isThemeLight ? 'text-slate-400' : 'text-[#6A7382]'))
                        }`}>
                            {formatDuration(timeLeft)}
                        </div>

                        {/* Progress Bar */}
                        <div className={`w-full h-2 ${
                            isThemeLight ? 'bg-slate-100 border-slate-200' : 'bg-[#090A0C] border-[#22262E]'
                        } border rounded-full overflow-hidden mt-4`}>
                            <div
                                className={`h-full transition-all duration-1000 ease-linear ${
                                    isOvertime ? 'bg-[#EF4444]' : 'bg-[#10B981]'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Up Next Banner */}
                    <div className={`border-t ${isThemeLight ? 'border-slate-200' : 'border-[#22262E]'} pt-4 flex items-center justify-between text-xs font-mono`}>
                        <div className={`flex items-center gap-2 ${isThemeLight ? 'text-slate-600' : 'text-[#8A93A4]'}`}>
                            <span className="font-bold text-[#F59E0B]">UP NEXT:</span>
                            <span className={`${isThemeLight ? 'text-slate-900' : 'text-white'} font-semibold truncate max-w-[280px]`}>
                                {nextSlot ? nextSlot.title : 'End of Service'}
                            </span>
                        </div>
                        {nextSlot?.durationMinutes && (
                            <span className={isThemeLight ? 'text-slate-400' : 'text-[#6A7382]'}>
                                {nextSlot.durationMinutes} min
                            </span>
                        )}
                    </div>

                </div>

            </main>

            {/* Prompt Stage Message Overlay */}
            {isVisible && promptMessage && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
                    <div className={`${isThemeLight ? 'bg-white/95' : 'bg-[#121418]'} border-2 border-[#10B981] rounded-lg px-8 py-3.5 shadow-2xl`}>
                        <span className="text-xl md:text-2xl font-mono font-bold uppercase text-[#10B981]">
                            {promptMessage.text}
                        </span>
                    </div>
                </div>
            )}

            {/* Footer Clock */}
            <footer className={`flex justify-between items-center border-t ${
                isThemeLight ? 'border-slate-200 text-slate-400' : 'border-[#22262E] text-[#6A7382]'
            } pt-4 text-xs font-mono`}>
                <div>KAIRON DIGITAL SIGNAGE • BROADCAST HUD</div>
                <div>ALL SESSIONS AUTO-SYNCED</div>
            </footer>

        </div>
    );
};

export default TVView;
