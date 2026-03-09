import React, { useEffect, useState } from 'react';
import { Program, Organization } from '../types';
import { Maximize, Minimize, Sun, Moon, Timer } from 'lucide-react';
import { formatDuration } from '../utils/time';
import { useStageMessages } from '../hooks/useStageMessages';
import { useWakeLock } from '../hooks/useWakeLock';

interface TVViewProps {
    program: Program;
    currentSlotIndex: number;
    isTimerActive: boolean;
    secondsElapsed: number;
    onToggleTimer?: () => void; // Optional, maybe for testing
    isDarkMode?: boolean;
    toggleTheme?: () => void;
    activeOrg?: Organization | null;
    isThumbnail?: boolean;
}

const TVView: React.FC<TVViewProps> = ({
    program,
    currentSlotIndex,
    isTimerActive,
    secondsElapsed,
    isDarkMode = true, // Default to dark if not provided
    toggleTheme,
    activeOrg,
    isThumbnail = false
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { promptMessage } = useStageMessages(program.id);
    const currentSlot = program.slots[currentSlotIndex];
    const nextSlot = program.slots[currentSlotIndex + 1];

    // Stage Messaging Expiry Logic
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (promptMessage) {
            setIsVisible(true);
            const now = Date.now();
            // Buffer the server-relative time slightly to handle clock drift
            const delay = (promptMessage.expiresAt + 1000) - now;

            if (delay > 0) {
                const timer = setTimeout(() => {
                    setIsVisible(false);
                }, delay);
                return () => clearTimeout(timer);
            } else {
                setIsVisible(false);
            }
        } else {
            setIsVisible(false);
        }
    }, [promptMessage]);

    // Screen Wake Lock
    useWakeLock(true);

    const toggleFullscreen = async () => {
        try {
            const doc = window.document as any;
            const docEl = doc.documentElement as any;

            const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
            const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
            const isFullScreen = doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;

            if (!isFullScreen) {
                await requestFullScreen.call(docEl);
            } else {
                await cancelFullScreen.call(doc);
            }
        } catch (err) {
            console.error("Error toggling fullscreen:", err);
            // Alert the user so they know why it failed (e.g. "Permissions check failed")
            alert(`Fullscreen failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    // Listen for fullscreen change events (ESC key etc)
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


    // Stage Messaging Subscription (Consolidated)

    // Calculations
    const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
    const timeLeft = durationSeconds - secondsElapsed;

    const progressPercent = durationSeconds > 0
        ? Math.min(100, Math.max(0, (timeLeft / durationSeconds) * 100))
        : 0;

    // Case 1: Program is concluded
    if (program.status === 'concluded') {
        return (
            <div className={isDarkMode ? 'dark' : ''}>
                <div className={`w-screen h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'} flex flex-col items-center justify-center p-12 text-center transition-colors duration-500`}>
                    <div className="w-32 h-32 bg-indigo-600/10 rounded-full flex items-center justify-center mb-12 animate-pulse">
                        <Timer size={64} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">Program Concluded</h1>
                    <p className="text-2xl md:text-4xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                        Thank you for attending **{program.title}**.
                    </p>
                    <div className="mt-12 text-xs font-bold uppercase tracking-[0.5em] text-slate-400 dark:text-slate-600">
                        Stand By for Next Event
                    </div>
                </div>
            </div>
        );
    }

    // Case 2: Program is in Draft mode (or no slots yet)
    if (program.status === 'draft' || !currentSlot) {
        return (
            <div className={isDarkMode ? 'dark' : ''}>
                <div className={`w-screen h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'} flex flex-col items-center justify-center p-12 text-center transition-colors duration-500`}>
                    <div className="w-24 h-24 mb-12 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                        <Timer size={80} className="text-indigo-600 relative z-10" />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6">Ready to Begin</h1>
                    <p className="text-2xl md:text-4xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl italic">
                        {program.title}
                    </p>
                    <div className="mt-12 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold uppercase tracking-[0.3em] animate-pulse">
                        Stand By
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            <div className={`w-screen h-screen bg-white dark:bg-black text-slate-900 dark:text-white overflow-hidden flex flex-col relative transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>

                {/* Controls Container */}
                {!isThumbnail && (
                    <div className="absolute top-4 right-4 z-50 flex items-center gap-2 opacity-20 hover:opacity-100 transition-opacity p-4 rounded-xl">
                        {toggleTheme && (
                            <button
                                onClick={toggleTheme}
                                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition-colors shadow-lg"
                                title="Toggle Theme"
                            >
                                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                            </button>
                        )}
                        <button
                            onClick={toggleFullscreen}
                            className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 transition-colors shadow-lg"
                            title="Toggle Fullscreen"
                        >
                            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                        </button>
                    </div>
                )}

                {/* Main Content Area - Centered Vertical Flex */}
                <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-16 w-full max-w-[95vw] mx-auto">

                    {/* Top Meta: Event Title & Slot Title */}
                    <div className="text-center mb-4 sm:mb-8 w-full flex flex-col items-center">
                        {activeOrg?.logoUrl && !isThumbnail && (
                            <img
                                src={activeOrg.logoUrl}
                                alt={activeOrg.name}
                                className="h-16 sm:h-24 mb-8 object-contain animate-in fade-in duration-1000"
                            />
                        )}
                        <h2 className="text-2xl sm:text-3xl font-medium text-slate-500 dark:text-indigo-400 tracking-widest uppercase mb-2" style={activeOrg?.brandColor ? { color: activeOrg.brandColor } : {}}>
                            {program.title}
                        </h2>
                        {program.subtitle && (
                            <h3 className="text-xl sm:text-2xl text-slate-400 dark:text-slate-500 mb-6 font-light">
                                {program.subtitle}
                            </h3>
                        )}
                        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight line-clamp-2">
                            {currentSlot.title}
                        </h1>
                        {currentSlot.speaker && (
                            <p className="text-3xl sm:text-4xl md:text-5xl text-slate-500 dark:text-slate-300 mt-4 sm:mt-6 font-light">
                                {currentSlot.speaker}
                            </p>
                        )}
                    </div>

                    <div
                        className={`font-mono font-bold leading-none tracking-tighter tabular-nums select-none transition-all duration-700
                    ${timeLeft < 0
                                ? 'text-rose-600 dark:text-rose-500 animate-pulse'
                                : timeLeft < 60 && isTimerActive
                                    ? 'text-rose-500 dark:text-rose-400'
                                    : 'text-slate-900 dark:text-white'}
                `}
                        style={{
                            fontSize: isVisible && !promptMessage?.isStrobe ? 'min(20vw, 300px)' : 'min(35vw, 500px)',
                            transform: isVisible && !promptMessage?.isStrobe ? 'translateY(-5vh)' : 'none'
                        }}
                    >
                        {formatDuration(timeLeft)}
                    </div>

                    {/* Standard Prompter Message (Non-Strobe) */}
                    {isVisible && promptMessage && !promptMessage.isStrobe && (
                        <div className="mt-8 animate-in slide-in-from-bottom-8 duration-700 text-center w-full px-4">
                            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-indigo-600 dark:text-indigo-400 drop-shadow-sm">
                                {promptMessage.text}
                            </h2>
                        </div>
                    )}

                    {/* Progress Bar - Thicker */}
                    <div className="w-full h-4 sm:h-6 bg-slate-200 dark:bg-slate-800 rounded-full mb-8 sm:mb-12 overflow-hidden shadow-xl ring-1 ring-slate-300 dark:ring-slate-700">
                        <div
                            className={`h-full transition-all duration-1000 ease-linear ${currentSlot.type === 'Break'
                                ? 'bg-emerald-500'
                                : ['Worship', 'Sermon', 'Music'].includes(currentSlot.type)
                                    ? 'bg-purple-600'
                                    : 'bg-indigo-600'
                                }`}
                            style={{
                                width: `${progressPercent}%`,
                                background: activeOrg?.brandColor && currentSlot.type !== 'Break' ? activeOrg.brandColor : undefined
                            }}
                        />
                    </div>

                    {/* Footer: Up Next */}
                    {!isThumbnail && (
                        <div className="text-center pb-8 sm:pb-16 min-h-[100px]">
                            {nextSlot ? (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <span className="text-2xl sm:text-3xl text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest mr-4">Up Next:</span>
                                    <span className="text-3xl sm:text-4xl md:text-5xl text-slate-700 dark:text-white font-medium">
                                        {nextSlot.title}
                                    </span>
                                </div>
                            ) : (
                                <div className="text-3xl text-slate-400 dark:text-slate-600 font-medium">
                                    End of Program
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Prompter Message Overlay - High Intensity Strobe */}
                {isVisible && promptMessage && promptMessage.isStrobe && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-8 overflow-hidden"
                        style={{
                            animation: 'strobe 0.2s steps(2, start) infinite',
                            backgroundColor: 'rgb(225, 29, 72)' // rose-600
                        }}
                    >
                        <style>{`
                        @keyframes strobe {
                            0% { opacity: 1; background-color: rgb(225, 29, 72); }
                            50% { opacity: 0.85; background-color: rgb(159, 18, 57); }
                        }
                    `}</style>
                        <div className="bg-white/10 text-white py-12 px-20 rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border-8 border-white/40 backdrop-blur-md text-center">
                            <h2 className="text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter leading-none animate-bounce">
                                {promptMessage.text}
                            </h2>
                        </div>
                    </div>
                )}

                {/* Hold Overlay */}
                {program.isOnHold && (
                    <div className="fixed inset-0 z-[110] bg-amber-500 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                        <h2 className="text-[15vw] font-black uppercase tracking-tighter leading-none text-white text-center mb-8 italic">
                            {program.holdMessage || 'WAITING FOR CUE'}
                        </h2>
                        <div className="px-12 py-6 bg-white/20 backdrop-blur-md rounded-full border-4 border-white/30">
                            <span className="text-5xl font-bold text-white tracking-[0.3em] uppercase animate-pulse">Stand By</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TVView;
