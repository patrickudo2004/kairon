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
    const themeToUse = customTheme || (isDarkMode ? 'dark' : 'light');
    useWakeLock(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = async () => {
        try {
            const doc = window.document as any;
            const docEl = doc.documentElement as any;

            const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
            const isFullScreen = doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullScreenElement || doc.msFullscreenElement;

            if (!isFullScreen) {
                await requestFullScreen.call(docEl);
            } else {
                await cancelFullScreen.call(doc);
            }
        } catch (err) {
            console.error("Error toggling fullscreen:", err);
        }
    };

    useEffect(() => {
        const handleFsChange = () => {
            const doc = document as any;
            const isFs = !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
            setIsFullscreen(isFs);
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        document.addEventListener('webkitfullscreenchange', handleFsChange);
        document.addEventListener('mozfullscreenchange', handleFsChange);
        document.addEventListener('MSFullscreenChange', handleFsChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            document.removeEventListener('webkitfullscreenchange', handleFsChange);
            document.removeEventListener('mozfullscreenchange', handleFsChange);
            document.removeEventListener('MSFullscreenChange', handleFsChange);
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

    return (
        <div className="w-screen h-screen bg-[#000000] text-white overflow-hidden flex flex-col justify-between p-6 md:p-12 font-sans select-none relative">
            
            {/* Perimeter Tally Flash Border on Overtime / Hold */}
            {isOvertime && (
                <div className="absolute inset-0 border-8 md:border-[16px] border-[#EF4444] pointer-events-none z-50 animate-pulse" />
            )}
            {program.isOnHold && !isOvertime && (
                <div className="absolute inset-0 border-8 md:border-[16px] border-[#F59E0B] pointer-events-none z-50 animate-pulse" />
            )}

            {/* Controls Container */}
            {!isThumbnail && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 opacity-10 hover:opacity-100 transition-opacity p-2 rounded">
                    {toggleTheme && (
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 bg-[#121418] border border-[#22262E] rounded text-[#8A93A4] hover:text-white"
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    )}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2.5 bg-[#121418] border border-[#22262E] rounded text-[#8A93A4] hover:text-white"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                </div>
            )}

            {/* Top Bar: Current Item + Speaker */}
            <div className="flex justify-between items-start z-10 border-b border-[#22262E]/60 pb-6">
                <div className="max-w-[70%]">
                    <div className="text-xs md:text-sm font-mono text-[#8A93A4] uppercase tracking-widest mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                        <span>CURRENT ITEM • SLOT {currentSlotIndex + 1} OF {program.slots.length}</span>
                    </div>
                    <h1 className="text-3xl md:text-6xl font-bold uppercase tracking-tight text-white leading-tight">
                        {currentSlot.title}
                    </h1>
                    {currentSlot.speaker && (
                        <p className="text-lg md:text-2xl text-[#0EA5E9] font-mono font-medium mt-1">
                            {currentSlot.speaker}
                        </p>
                    )}
                </div>

                <div className="text-right">
                    <div className="text-xs md:text-sm font-mono text-[#8A93A4] uppercase tracking-widest mb-1">STATUS</div>
                    {isTimerActive ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#10B981]/10 border border-[#10B981]/30 rounded text-[#10B981] font-mono text-base md:text-xl font-bold tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-tally" />
                            <span>ON AIR</span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded text-[#F59E0B] font-mono text-base md:text-xl font-bold tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                            <span>STANDBY</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Center Massive Countdown Readout */}
            <div className="flex-1 flex flex-col items-center justify-center relative my-4">
                <div className={`font-mono font-bold leading-none tracking-tight tabular-nums select-none transition-colors ${
                    isOvertime 
                        ? 'text-[#EF4444] animate-pulse' 
                        : (isWarning ? 'text-[#F59E0B] animate-pulse' : 'text-white')
                }`}
                style={{
                    fontSize: isVisible && !promptMessage?.isStrobe ? '12vw' : '32vw',
                    transform: isVisible && !promptMessage?.isStrobe ? 'translateY(-8vh)' : 'none'
                }}>
                    {formatDuration(timeLeft)}
                </div>

                {isOvertime && (
                    <div className="text-xl md:text-3xl font-mono text-[#EF4444] font-bold uppercase tracking-widest mt-2 animate-bounce">
                        OVERTIME • PLEASE WRAP UP
                    </div>
                )}
            </div>

            {/* Prompt Stage Message Overlay */}
            {isVisible && promptMessage && !promptMessage.isStrobe && (
                <div className="absolute top-[55vh] left-0 right-0 z-40 flex justify-center px-8 animate-in slide-in-from-bottom-6 duration-300">
                    <div className="bg-[#121418]/95 border-2 border-[#10B981] rounded-xl px-8 py-4 shadow-2xl">
                        <h2 className="text-[6vw] font-mono font-bold uppercase text-[#10B981] tracking-tight text-center">
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
            <div className="flex justify-between items-end border-t border-[#22262E]/60 pt-6 z-10">
                <div>
                    <span className="text-[10px] md:text-xs font-mono text-[#8A93A4] uppercase tracking-widest block mb-1">PLANNED DURATION</span>
                    <span className="text-xl md:text-3xl font-mono font-bold text-white">{currentSlot.durationMinutes}m</span>
                </div>

                {!isThumbnail && program.slots[currentSlotIndex + 1] && (
                    <div className="text-center px-4 max-w-xl">
                        <span className="text-[10px] md:text-xs font-mono text-[#F59E0B] uppercase tracking-widest block mb-1">UP NEXT</span>
                        <p className="text-lg md:text-2xl font-bold text-white uppercase truncate">
                            {program.slots[currentSlotIndex + 1].title}
                        </p>
                    </div>
                )}

                <div className="text-right">
                    <span className="text-[10px] md:text-xs font-mono text-[#8A93A4] uppercase tracking-widest block mb-1">EVENT</span>
                    <span className="text-lg md:text-2xl font-bold text-white uppercase">{program.title}</span>
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
