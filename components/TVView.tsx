import React, { useEffect, useState } from 'react';
import { Program, Organization } from '../types';
import { Maximize, Minimize, Sun, Moon } from 'lucide-react';
import { formatDuration } from '../utils/time';
import { useStageMessages } from '../hooks/useStageMessages';

interface TVViewProps {
    program: Program;
    currentSlotIndex: number;
    isTimerActive: boolean;
    secondsElapsed: number;
    onToggleTimer?: () => void; // Optional, maybe for testing
    isDarkMode?: boolean;
    toggleTheme?: () => void;
    activeOrg?: Organization | null;
}

const TVView: React.FC<TVViewProps> = ({
    program,
    currentSlotIndex,
    isTimerActive,
    secondsElapsed,
    isDarkMode = true, // Default to dark if not provided
    toggleTheme,
    activeOrg
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { promptMessage } = useStageMessages(program.id);
    const currentSlot = program.slots[currentSlotIndex];
    const nextSlot = program.slots[currentSlotIndex + 1];

    // Wake Lock
    useEffect(() => {
        let wakeLock: any = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                    console.log('Wake Lock is active');
                }
            } catch (err) {
                console.error(`${err.name}, ${err.message}`);
            }
        };

        requestWakeLock();

        const handleVisibilityChange = () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (wakeLock !== null) {
                wakeLock.release().then(() => {
                    console.log('Wake Lock released');
                });
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

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

    if (!currentSlot) {
        return (
            <div className="w-screen h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white transition-colors">
                <h1 className="text-9xl font-bold mb-8">All Done</h1>
                <p className="text-4xl text-slate-500 dark:text-slate-400">The program has concluded.</p>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-white dark:bg-black text-slate-900 dark:text-white overflow-hidden flex flex-col relative transition-colors duration-300">

            {/* Controls Container */}
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

            {/* Main Content Area - Centered Vertical Flex */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-16 w-full max-w-[95vw] mx-auto">

                {/* Top Meta: Event Title & Slot Title */}
                <div className="text-center mb-4 sm:mb-8 w-full flex flex-col items-center">
                    {activeOrg?.logoUrl && (
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
                    className={`font-mono font-bold leading-none tracking-tighter tabular-nums select-none transition-colors
                    ${timeLeft < 0
                            ? 'text-rose-600 dark:text-rose-500 animate-pulse'
                            : timeLeft < 60 && isTimerActive
                                ? 'text-rose-500 dark:text-rose-400'
                                : 'text-slate-900 dark:text-white'}
                `}
                    style={{ fontSize: 'min(35vw, 500px)' }} // Responsive massive text
                >
                    {formatDuration(timeLeft)}
                </div>

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

            </div>

            {/* Prompter Message Overlay */}
            {promptMessage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 pointer-events-none animate-in zoom-in duration-300">
                    <div className="bg-rose-600 text-white py-12 px-20 rounded-[4rem] shadow-[0_0_100px_rgba(225,29,72,0.5)] border-8 border-white/20 backdrop-blur-3xl text-center">
                        <h2 className="text-6xl sm:text-8xl md:text-9xl font-black uppercase tracking-tighter leading-none mb-4 animate-bounce">
                            {promptMessage.text}
                        </h2>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TVView;
