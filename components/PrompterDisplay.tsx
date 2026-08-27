import React, { useEffect, useState, useRef } from 'react';
import { Program, Organization } from '../types';
import { Sun, Moon, Maximize, Minimize, Play, Pause, ChevronUp, ChevronDown, CheckCircle, RefreshCw } from 'lucide-react';
import { useTimerSync } from '../hooks/useTimerSync';
import { formatDuration } from '../utils/time';
import { useWakeLock } from '../hooks/useWakeLock';

interface PrompterDisplayProps {
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

export const PrompterDisplay: React.FC<PrompterDisplayProps> = ({
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
    useWakeLock(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState<number | 'sync'>(1); // pixels per frame, or 'sync'
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);

    const [previewSlotIndex, setPreviewSlotIndex] = useState(currentSlotIndex);
    const [isSyncingWithLive, setIsSyncingWithLive] = useState(true);

    // Keep preview in sync with live slot if sync is active
    useEffect(() => {
        if (isSyncingWithLive) {
            setPreviewSlotIndex(currentSlotIndex);
        }
    }, [currentSlotIndex, isSyncingWithLive]);

    const currentSlot = program.slots[previewSlotIndex];
    const elapsed = useTimerSync(timerStartTimestamp, isTimerActive, secondsElapsed);
    const liveTimeLeft = (program.slots[currentSlotIndex] ? program.slots[currentSlotIndex].durationMinutes * 60 : 0) - elapsed;
    const timeLeft = isSyncingWithLive
        ? liveTimeLeft
        : (currentSlot ? currentSlot.durationMinutes * 60 : 0);

    // Theme Evaluation
    const activeTheme = customTheme || (isDarkMode ? 'dark' : 'light');

    // Auto-scroll loop
    useEffect(() => {
        if (!isScrolling || isThumbnail || !scrollContainerRef.current) {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
            return;
        }

        const scroll = () => {
            const container = scrollContainerRef.current;
            if (!container) return;

            let delta = 0;
            if (scrollSpeed === 'sync') {
                // Sync scroll: map slot progress to scroll height
                const duration = currentSlot ? currentSlot.durationMinutes * 60 : 1;
                const progress = Math.min(1, Math.max(0, elapsed / duration));
                const maxScroll = container.scrollHeight - container.clientHeight;
                const targetPos = maxScroll * progress;
                // Smoothly interpolate towards target pos
                delta = (targetPos - container.scrollTop) * 0.05;
                container.scrollTop += delta;
            } else {
                // Constant speed scroll
                delta = scrollSpeed * 0.5; // Scale speed down slightly
                container.scrollTop += delta;
            }

            requestRef.current = requestAnimationFrame(scroll);
        };

        requestRef.current = requestAnimationFrame(scroll);

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
        };
    }, [isScrolling, scrollSpeed, elapsed, currentSlot, isThumbnail]);

    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const isAutoFs = searchParams.get('autofs') === '1';
    const [showFsPrompt, setShowFsPrompt] = useState(isAutoFs);

    // Listen for fullscreen change events and shortcuts
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
            console.error("Fullscreen toggle failed:", err);
        }
    };

    // Render Basic Markdown content safely
    const renderMarkdownContent = (text: string) => {
        if (!text) {
            return (
                <div className="bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] border border-indigo-500/10 rounded-3xl p-8 max-w-xl my-6">
                    <p className="font-bold text-lg mb-3">📝 No outlines or details provided for this segment.</p>
                    <p className="text-sm opacity-70 leading-relaxed mb-4">
                        To add notes or speaker outlines that auto-scroll on this teleprompter:
                    </p>
                    <ol className="list-decimal list-inside text-sm opacity-70 space-y-2 leading-relaxed">
                        <li>Go to the <strong>Program Editor</strong> tab.</li>
                        <li>Click the dropdown chevron button (next to the title of the desired slot) to expand it.</li>
                        <li>Fill in the <strong>Teleprompter Details</strong> textarea (supports markdown formatting).</li>
                        <li>The changes will automatically save and sync to this screen in real time.</li>
                    </ol>
                </div>
            );
        }

        return text.split('\n').map((line, idx) => {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('# ')) {
                return <h1 key={idx} className="text-4xl sm:text-5xl font-black mt-8 mb-4 border-b border-current pb-2 uppercase tracking-tight">{cleanLine.substring(2)}</h1>;
            }
            if (cleanLine.startsWith('## ')) {
                return <h2 key={idx} className="text-2xl sm:text-3xl font-extrabold mt-6 mb-3 uppercase tracking-tight">{cleanLine.substring(3)}</h2>;
            }
            if (cleanLine.startsWith('### ')) {
                return <h3 key={idx} className="text-xl sm:text-2xl font-bold mt-4 mb-2">{cleanLine.substring(4)}</h3>;
            }
            if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
                return <li key={idx} className="text-xl sm:text-2xl ml-6 list-disc mb-2 leading-relaxed">{cleanLine.substring(2)}</li>;
            }
            if (cleanLine.startsWith('> ')) {
                return (
                    <blockquote key={idx} className="border-l-4 border-indigo-500 pl-6 my-4 italic text-slate-400 text-xl sm:text-2xl leading-relaxed">
                        {cleanLine.substring(2)}
                    </blockquote>
                );
            }

            // Bold styling helper
            if (cleanLine.includes('**')) {
                const parts = cleanLine.split('**');
                return (
                    <p key={idx} className="text-xl sm:text-3xl leading-relaxed mb-4">
                        {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-black underline">{p}</strong> : p)}
                    </p>
                );
            }

            return cleanLine ? <p key={idx} className="text-xl sm:text-3xl leading-relaxed mb-4">{cleanLine}</p> : <div key={idx} className="h-4" />;
        });
    };

    // Dynamic Class Mapping based on Theme Settings
    const getThemeClasses = () => {
        switch (activeTheme) {
            case 'ambient-yellow':
                return 'bg-black text-amber-400';
            case 'ambient-white':
                return 'bg-black text-white';
            case 'light':
                return 'bg-slate-50 text-slate-900';
            case 'dark':
            default:
                return 'bg-slate-950 text-white';
        }
    };

    // Case 1: Concluded Standby
    if (program.status === 'concluded') {
        return (
            <div className={`w-screen h-screen ${getThemeClasses()} flex flex-col items-center justify-center p-12 text-center transition-colors duration-500`}>
                <div className="w-24 h-24 mb-12 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>
                    <CheckCircle size={80} className="text-indigo-500 relative z-10" />
                </div>
                <h1 className="text-[8vw] font-black uppercase tracking-tighter leading-none mb-4">Stand By</h1>
                <p className="text-slate-500 text-2xl font-bold uppercase tracking-[0.2em]">Session concluded</p>
            </div>
        );
    }

    // Case 2: No active slots Standby
    if (!currentSlot) {
        return (
            <div className={`w-screen h-screen ${getThemeClasses()} flex flex-col items-center justify-center p-12 text-center transition-colors duration-500`}>
                <h1 className="text-[10vw] font-black uppercase tracking-tighter leading-none mb-8">Stand By</h1>
                <div className="w-24 h-1 bg-indigo-500/50 rounded-full animate-pulse" />
                <p className="text-slate-500 text-2xl font-bold uppercase tracking-widest mt-12">{program.title}</p>
            </div>
        );
    }

        const isThemeDark = activeTheme === 'dark' || activeTheme === 'ambient-yellow' || activeTheme === 'ambient-white';
        const selectClass = isThemeDark 
            ? "px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-200 focus:outline-none cursor-pointer" 
            : "px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-800 focus:outline-none cursor-pointer";
    
        const optionClass = isThemeDark
            ? "bg-slate-900 text-slate-200"
            : "bg-white text-slate-800";

        return (
        <div 
            onDoubleClick={toggleFullscreen}
            className={`w-screen h-screen ${getThemeClasses()} flex flex-col overflow-hidden font-sans select-none transition-colors duration-500 relative`}
        >
            {/* Auto Fullscreen Floating Banner */}
            {showFsPrompt && !isFullscreen && !isThumbnail && (
                <div 
                    onClick={toggleFullscreen}
                    className="cursor-pointer bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-4 py-2 text-center text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl animate-pulse z-50 transition-all shrink-0"
                >
                    <Maximize size={14} />
                    <span>⛶ Click anywhere or press F11 to lock Fullscreen</span>
                </div>
            )}
            
            {/* Top Bar Navigation / Control overlay */}
            <div className="h-20 border-b border-current/10 flex items-center justify-between px-6 shrink-0 relative z-30">
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-black uppercase tracking-wider">{program.title}</span>
                    <span className="px-3 py-1 bg-indigo-600/20 text-indigo-400 text-xs font-bold rounded-full uppercase tracking-widest">Prompter Mode</span>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Theme selector controls */}
                    {!isThumbnail && (
                        <>
                            <button
                                onClick={() => setIsScrolling(prev => !prev)}
                                className={`p-2.5 rounded-xl border border-current/20 hover:bg-current/5 transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${isScrolling ? 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30' : ''}`}
                            >
                                {isScrolling ? <Pause size={18} /> : <Play size={18} />}
                                {isScrolling ? 'Pause Scroll' : 'Auto Scroll'}
                            </button>

                            <select
                                value={scrollSpeed}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setScrollSpeed(val === 'sync' ? 'sync' : Number(val));
                                }}
                                className={selectClass}
                            >
                                <option value="sync" className={optionClass}>⏱️ Sync to Timer</option>
                                <option value="1" className={optionClass}>1x Speed</option>
                                <option value="2" className={optionClass}>2x Speed</option>
                                <option value="3" className={optionClass}>3x Speed</option>
                            </select>

                            <select
                                value={previewSlotIndex}
                                onChange={(e) => {
                                    setPreviewSlotIndex(Number(e.target.value));
                                    setIsSyncingWithLive(false);
                                }}
                                className={selectClass}
                            >
                                {program.slots.map((s, idx) => (
                                    <option key={s.id} value={idx} className={optionClass}>
                                        {idx + 1}. {s.title}
                                    </option>
                                ))}
                            </select>

                            {!isSyncingWithLive && (
                                <button
                                    onClick={() => {
                                        setPreviewSlotIndex(currentSlotIndex);
                                        setIsSyncingWithLive(true);
                                    }}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-sm font-bold uppercase tracking-wider flex items-center gap-1.5"
                                    title="Tether back to live session countdown"
                                >
                                    <RefreshCw size={14} />
                                    Sync to Live
                                </button>
                            )}

                            {toggleTheme && (
                                <button
                                    onClick={toggleTheme}
                                    className="p-2.5 bg-current/5 hover:bg-current/10 rounded-xl transition-all"
                                    title="Toggle Dark/Light Mode"
                                >
                                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                                </button>
                            )}

                            <button
                                onClick={toggleFullscreen}
                                className="p-2.5 bg-current/5 hover:bg-current/10 rounded-xl transition-all"
                                title="Toggle Fullscreen"
                            >
                                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Split Screen Workspace */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Left Pane: Countdown clock & Slot Metadata */}
                <div className="w-full md:w-[40%] border-r border-current/10 flex flex-col justify-between p-8 shrink-0 bg-current/[0.02]">
                    <div>
                        <span className="text-lg font-bold uppercase tracking-widest opacity-50 block mb-2">
                            {isSyncingWithLive ? 'Current Segment' : 'Preview Segment'}
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-black uppercase leading-none tracking-tight mb-2">
                            {currentSlot.title}
                        </h1>
                        {currentSlot.speaker && (
                            <p className="text-2xl opacity-80 mt-1 font-semibold">{currentSlot.speaker}</p>
                        )}
                        <span className="inline-block mt-4 px-3 py-1 bg-current/10 rounded-lg text-sm font-bold uppercase tracking-wider">{currentSlot.durationMinutes} Minutes Planned</span>
                    </div>

                    <div className="my-10 flex flex-col items-center justify-center">
                        <div className={`font-mono font-black tabular-nums leading-none tracking-tighter transition-all duration-500 text-[12vw] md:text-[8vw] ${timeLeft < 0 ? 'text-rose-500 animate-pulse' : timeLeft < 60 ? 'text-amber-500' : ''}`}>
                            {formatDuration(timeLeft)}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 mt-2">
                            {isSyncingWithLive ? 'Time Remaining' : 'Planned Duration'}
                        </span>
                        {!isSyncingWithLive && (
                            <span className="mt-3 px-3 py-1 bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
                                Preview Mode
                            </span>
                        )}
                    </div>

                    {/* Up Next Segment Footer */}
                    <div>
                        {program.slots[previewSlotIndex + 1] && (
                            <div className="p-4 bg-current/5 border border-current/10 rounded-2xl">
                                <span className="text-xs font-black text-indigo-500 uppercase tracking-widest block mb-1">Up Next</span>
                                <h3 className="text-xl font-bold uppercase truncate">{program.slots[previewSlotIndex + 1].title}</h3>
                                {program.slots[previewSlotIndex + 1].speaker && (
                                    <p className="text-sm opacity-60 mt-0.5">{program.slots[previewSlotIndex + 1].speaker}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Pane: Reading outlines with smooth scrolling */}
                <div 
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto p-12 relative"
                >
                    <div className="max-w-[800px] mx-auto pb-48 select-text">
                        {renderMarkdownContent(currentSlot.prompterText || '')}
                    </div>
                </div>
            </div>
        </div>
    );
};
