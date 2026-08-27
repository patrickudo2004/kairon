import React, { useEffect, useState } from 'react';
import { Program, Organization } from '../types';
import { CheckCircle, Sun, Moon, Maximize, Minimize, AlertTriangle, Pause } from 'lucide-react';
import { useTimerSync } from '../hooks/useTimerSync';
import { formatDuration } from '../utils/time';
import { useStageMessages } from '../hooks/useStageMessages';
import { useWakeLock } from '../hooks/useWakeLock';

interface StageDisplayProps {
    program: Program;
    timerStartTimestamp: number | null;
    secondsElapsed?: number;
    isTimerActive: boolean;
    currentSlotIndex: number;
    activeOrg?: Organization | null;
    isDarkMode?: boolean;
    toggleTheme?: () => void;
    isThumbnail?: boolean;
    customTheme?: string;
}

const StageDisplay: React.FC<StageDisplayProps> = ({
    program,
    timerStartTimestamp,
    secondsElapsed = 0,
    isTimerActive,
    currentSlotIndex,
    activeOrg,
    isDarkMode = true,
    toggleTheme,
    isThumbnail = false,
    customTheme
}) => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const isAutoFs = searchParams.get('autofs') === '1';
    const urlTheme = searchParams.get('theme') as 'dark' | 'light' | null;

    const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => {
        if (urlTheme) return urlTheme;
        if (customTheme === 'dark' || customTheme === 'light') return customTheme;
        const saved = typeof window !== 'undefined' ? localStorage.getItem('kairon_display_theme_stage') : null;
        if (saved === 'dark' || saved === 'light') return saved;
        return isDarkMode ? 'dark' : 'light';
    });

    // Real-time broadcast sync for display theme toggles
    useEffect(() => {
        const channel = new BroadcastChannel('kairon_displays');
        const handleMsg = (e: MessageEvent) => {
            if (e.data && e.data.type === 'toggle_theme' && (e.data.tabId === 'stage' || !e.data.tabId)) {
                setCurrentTheme(prev => {
                    const next = e.data.theme || (prev === 'dark' ? 'light' : 'dark');
                    localStorage.setItem('kairon_display_theme_stage', next);
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

    useWakeLock(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFsPrompt, setShowFsPrompt] = useState(isAutoFs);

    const toggleFullscreen = async () => {
        try {
            const doc = window.document as any;
            const docEl = doc.documentElement as any;

            const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
            const isFullScreen = doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullScreenElement || doc.msFullscreenElement;

            if (!isFullScreen) {
                if (requestFullScreen) await requestFullScreen.call(docEl);
            } else {
                if (cancelFullScreen) await cancelFullScreen.call(doc);
            }
            setShowFsPrompt(false);
        } catch (err) {
            console.error("Error toggling fullscreen:", err);
        }
    };

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
        document.addEventListener('MSFullscreenChange', handleFsChange);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
            document.removeEventListener('mozfullscreenchange', handleFsChange);
            document.removeEventListener('MSFullscreenChange', handleFsChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const { promptMessage } = useStageMessages(program.id);
    const currentSlot = program.slots[currentSlotIndex];
    const [isVisible, setIsVisible] = useState(false);

    // Stage Messaging Expiry Logic
    useEffect(() => {
        if (promptMessage) {
            setIsVisible(true);
            const now = Date.now();
            const delay = (promptMessage.expiresAt + 1000) - now;

            if (delay > 0) {
                const timer = setTimeout(() => setIsVisible(false), delay);
                return () => clearTimeout(timer);
            } else {
                setIsVisible(false);
            }
        } else {
            setIsVisible(false);
        }
    }, [promptMessage]);

    // Sync the timer heart-beat with the global anchor
    const elapsed = useTimerSync(timerStartTimestamp, isTimerActive, secondsElapsed);
    const timeLeft = (currentSlot ? currentSlot.durationMinutes * 60 : 0) - elapsed;

    // Concluded State
    if (program.status === 'concluded') {
        return (
            <div className="w-screen h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-8 text-center font-sans select-none">
                <div className="p-6 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl mb-6 animate-pulse">
                    <CheckCircle size={64} className="text-[#10B981]" />
                </div>
                <h1 className="text-[8vw] font-mono font-bold uppercase tracking-tight text-white mb-2">STANDBY</h1>
                <p className="text-[#8A93A4] font-mono text-xl uppercase tracking-widest">SESSION CONCLUDED</p>
            </div>
        );
    }

    // Draft / Waiting State
    if (program.status === 'draft' || !currentSlot) {
        return (
            <div className="w-screen h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-8 text-center font-sans select-none">
                <div className="text-[8vw] font-mono font-bold tracking-tight text-white mb-4">STANDBY</div>
                <div className="w-20 h-1 bg-[#0EA5E9] rounded-full animate-pulse mb-6" />
                <p className="text-[#8A93A4] font-mono text-xl uppercase tracking-widest">{program.title}</p>
            </div>
        );
    }

    const isOvertime = timeLeft < 0;
    const isWarning = timeLeft >= 0 && timeLeft <= 60;
    const isThemeLight = currentTheme === 'light';

    return (
        <div 
            onDoubleClick={toggleFullscreen}
            className={`w-screen h-screen ${
                isThemeLight ? 'bg-white text-slate-900' : 'bg-[#000000] text-white'
            } overflow-hidden flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans select-none relative box-border transition-colors duration-300`}
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
            
            {/* Perimeter Tally Flash Border on Overtime / Hold */}
            {isOvertime && (
                <div className="absolute inset-0 border-4 sm:border-8 md:border-[16px] border-[#EF4444] pointer-events-none z-50 animate-pulse" />
            )}
            {program.isOnHold && !isOvertime && (
                <div className="absolute inset-0 border-4 sm:border-8 md:border-[16px] border-[#F59E0B] pointer-events-none z-50 animate-pulse" />
            )}

            {/* Controls Container */}
            {!isThumbnail && (
                <div className="absolute top-3 right-3 z-50 flex items-center gap-2 opacity-20 hover:opacity-100 transition-opacity p-2 rounded">
                    <button
                        onClick={() => {
                            const next = isThemeLight ? 'dark' : 'light';
                            setCurrentTheme(next);
                            localStorage.setItem('kairon_display_theme_stage', next);
                        }}
                        className={`p-2 sm:p-2.5 rounded border transition-all ${
                            isThemeLight 
                                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black' 
                                : 'bg-[#121418] border-[#22262E] text-[#8A93A4] hover:text-white'
                        }`}
                        title="Toggle Theme"
                    >
                        {isThemeLight ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className={`p-2 sm:p-2.5 rounded border transition-all ${
                            isThemeLight 
                                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:text-black' 
                                : 'bg-[#121418] border-[#22262E] text-[#8A93A4] hover:text-white'
                        }`}
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                </div>
            )}

            {/* Top Bar: Current Item + Speaker */}
            <div className={`flex justify-between items-start z-10 border-b ${
                isThemeLight ? 'border-slate-200' : 'border-[#22262E]/60'
            } pb-3 sm:pb-5 shrink-0`}>
                <div className="max-w-[70%]">
                    <div className={`text-[10px] sm:text-xs md:text-sm font-mono ${
                        isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'
                    } uppercase tracking-widest mb-0.5 sm:mb-1 flex items-center gap-1.5 sm:gap-2`}>
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#0EA5E9]" />
                        <span>CURRENT ITEM • SLOT {currentSlotIndex + 1} OF {program.slots.length}</span>
                    </div>
                    <h1 className={`text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight ${
                        isThemeLight ? 'text-slate-900' : 'text-white'
                    } leading-tight truncate`}>
                        {currentSlot.title}
                    </h1>
                    {currentSlot.speaker && (
                        <p className="text-sm sm:text-lg md:text-2xl text-[#0EA5E9] font-mono font-medium mt-0.5 sm:mt-1 truncate">
                            {currentSlot.speaker}
                        </p>
                    )}
                </div>

                <div className="text-right shrink-0">
                    <div className={`text-[10px] sm:text-xs md:text-sm font-mono ${
                        isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'
                    } uppercase tracking-widest mb-0.5 sm:mb-1`}>STATUS</div>
                    {isTimerActive ? (
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#10B981]/10 border border-[#10B981]/30 rounded text-[#10B981] font-mono text-xs sm:text-base md:text-xl font-bold tracking-wider">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#10B981] animate-tally" />
                            <span>ON AIR</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded text-[#F59E0B] font-mono text-xs sm:text-base md:text-xl font-bold tracking-wider">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#F59E0B]" />
                            <span>STANDBY</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Center Massive Countdown Readout */}
            <div className="flex-1 flex flex-col items-center justify-center relative my-auto min-h-0 overflow-hidden">
                <div className={`font-mono font-black leading-none tracking-tight tabular-nums select-none transition-colors ${
                    isOvertime 
                        ? 'text-[#EF4444] animate-pulse' 
                        : (isWarning ? 'text-[#F59E0B] animate-pulse' : (isThemeLight ? 'text-slate-950' : 'text-white'))
                }`}
                style={{
                    fontSize: isVisible && !promptMessage?.isStrobe 
                        ? 'clamp(3rem, 14vw, 18vh)' 
                        : 'clamp(4.5rem, min(28vw, 42vh), 34vw)',
                    transform: isVisible && !promptMessage?.isStrobe ? 'translateY(-3vh)' : 'none'
                }}>
                    {formatDuration(timeLeft)}
                </div>

                {isOvertime && (
                    <div className="text-xs sm:text-lg md:text-2xl font-mono text-[#EF4444] font-bold uppercase tracking-widest mt-1 sm:mt-2 animate-bounce shrink-0">
                        OVERTIME • PLEASE WRAP UP
                    </div>
                )}
            </div>

            {/* Prompt Stage Message Overlay */}
            {isVisible && promptMessage && !promptMessage.isStrobe && (
                <div className="absolute top-[50vh] left-0 right-0 z-40 flex justify-center px-4 sm:px-8 animate-in slide-in-from-bottom-6 duration-300">
                    <div className={`${isThemeLight ? 'bg-white/95 border-[#10B981]' : 'bg-[#121418]/95 border-[#10B981]'} border-2 rounded-xl px-4 sm:px-8 py-2 sm:py-4 shadow-2xl`}>
                        <h2 className="text-lg sm:text-[4vw] font-mono font-bold uppercase text-[#10B981] tracking-tight text-center">
                            {promptMessage.text}
                        </h2>
                    </div>
                </div>
            )}

            {/* Strobe Emergency Message Overlay */}
            {isVisible && promptMessage && promptMessage.isStrobe && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-8"
                    style={{
                        animation: 'strobe 0.2s steps(2, start) infinite',
                        backgroundColor: '#EF4444'
                    }}
                >
                    <style>{`
                        @keyframes strobe {
                            0% { opacity: 1; background-color: #EF4444; }
                            50% { opacity: 0.85; background-color: #991B1B; }
                        }
                    `}</style>
                    <h2 className="text-[10vw] font-mono font-black uppercase text-center text-white tracking-tight drop-shadow-2xl">
                        {promptMessage.text}
                    </h2>
                </div>
            )}

            {/* Bottom Strip: Duration Target & Up Next */}
            <div className={`flex justify-between items-end border-t ${
                isThemeLight ? 'border-slate-200' : 'border-[#22262E]/60'
            } pt-3 sm:pt-5 z-10 shrink-0 gap-2`}>
                <div className="shrink-0">
                    <span className={`text-[9px] sm:text-xs font-mono ${
                        isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'
                    } uppercase tracking-widest block mb-0.5`}>PLANNED DURATION</span>
                    <span className={`text-sm sm:text-xl md:text-3xl font-mono font-bold ${
                        isThemeLight ? 'text-slate-900' : 'text-white'
                    }`}>{currentSlot.durationMinutes}m</span>
                </div>

                {!isThumbnail && program.slots[currentSlotIndex + 1] && (
                    <div className="text-center px-2 max-w-sm md:max-w-xl truncate">
                        <span className="text-[9px] sm:text-xs font-mono text-[#F59E0B] uppercase tracking-widest block mb-0.5">UP NEXT</span>
                        <p className={`text-xs sm:text-base md:text-2xl font-bold ${
                            isThemeLight ? 'text-slate-900' : 'text-white'
                        } uppercase truncate`}>
                            {program.slots[currentSlotIndex + 1].title}
                        </p>
                    </div>
                )}

                <div className="text-right shrink-0">
                    <span className={`text-[9px] sm:text-xs font-mono ${
                        isThemeLight ? 'text-slate-500' : 'text-[#8A93A4]'
                    } uppercase tracking-widest block mb-0.5`}>EVENT</span>
                    <span className={`text-xs sm:text-base md:text-2xl font-bold ${
                        isThemeLight ? 'text-slate-900' : 'text-white'
                    } uppercase truncate max-w-[140px] sm:max-w-[260px] block`}>{program.title}</span>
                </div>
            </div>

            {/* Hold Banner Overlay */}
            {program.isOnHold && (
                <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                    <div className="p-6 bg-[#F59E0B]/10 border-2 border-[#F59E0B] rounded-2xl mb-8">
                        <Pause size={80} className="text-[#F59E0B] animate-pulse" />
                    </div>
                    <h2 className="text-[8vw] font-mono font-black uppercase text-[#F59E0B] tracking-tight mb-4 leading-none">
                        {program.holdMessage || 'WAITING FOR CUE'}
                    </h2>
                    <div className="text-2xl font-mono uppercase tracking-[0.3em] text-[#8A93A4]">
                        STAND BY
                    </div>
                </div>
            )}

        </div>
    );
};

export default StageDisplay;
