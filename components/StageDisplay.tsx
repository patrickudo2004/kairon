import React, { useEffect, useState } from 'react';
import { Program, Organization } from '../types';
import { CheckCircle } from 'lucide-react';
import { formatDuration } from '../utils/time';
import { useStageMessages } from '../hooks/useStageMessages';
import { useWakeLock } from '../hooks/useWakeLock';

interface StageDisplayProps {
    program: Program;
    secondsElapsed: number;
    isTimerActive: boolean;
    currentSlotIndex: number;
    activeOrg?: Organization | null;
    isDarkMode?: boolean;
    toggleTheme?: () => void;
    isThumbnail?: boolean;
}

const StageDisplay: React.FC<StageDisplayProps> = ({
    program,
    secondsElapsed,
    isTimerActive,
    currentSlotIndex,
    activeOrg,
    isDarkMode = true,
    toggleTheme,
    isThumbnail = false
}) => {
    useWakeLock(true);
    const { promptMessage } = useStageMessages(program.id);
    const currentSlot = program.slots[currentSlotIndex];

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

    const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
    const timeLeft = durationSeconds - secondsElapsed;

    // Case 1: Program is concluded
    if (program.status === 'concluded') {
        return (
            <div className={isDarkMode ? 'dark' : ''}>
                <div className="w-screen h-screen bg-black flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 mb-12 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse"></div>
                        <CheckCircle size={80} className="text-emerald-500 relative z-10" />
                    </div>
                    <h1 className="text-white text-[10vw] font-black uppercase tracking-tighter leading-none mb-4">Program Concluded</h1>
                    <p className="text-slate-500 text-3xl font-medium">All sessions are finished.</p>
                </div>
            </div>
        );
    }

    // Case 2: Program is in Draft mode (or no slots yet)
    if (program.status === 'draft' || !currentSlot) {
        return (
            <div className={isDarkMode ? 'dark' : ''}>
                <div className="w-screen h-screen bg-black flex flex-col items-center justify-center p-12 text-center">
                    <h1 className="text-white text-[12vw] font-black uppercase tracking-tighter leading-none mb-8">Stand By</h1>
                    <div className="w-24 h-1 bg-emerald-500/50 rounded-full animate-pulse" />
                    <p className="text-slate-600 text-2xl font-bold uppercase tracking-widest mt-12">{program.title}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={isDarkMode ? 'dark' : ''}>
            <div className={`w-screen h-screen ${isDarkMode ? 'dark bg-black text-white' : 'bg-white text-slate-900'} overflow-hidden flex flex-col items-center justify-center font-sans select-none transition-colors duration-500`}>

                {/* Controls Overlay */}
                <div className="absolute bottom-8 right-8 z-[120] flex items-center gap-4 opacity-10 hover:opacity-100 transition-opacity">
                    {toggleTheme && (
                        <button
                            onClick={toggleTheme}
                            className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-black'} transition-all`}
                        >
                            {isDarkMode ? <span className="font-bold">LIGHT</span> : <span className="font-bold">DARK</span>}
                        </button>
                    )}
                </div>

                {/* High Contrast Background Signal */}
                <div className={`absolute inset-0 transition-colors duration-500 ${timeLeft < 0 ? 'bg-rose-950/20' : timeLeft < 60 ? 'bg-amber-950/10' : ''
                    }`} />

                {/* Logo Overlay */}
                {activeOrg?.logoUrl && !isThumbnail && (
                    <div className="absolute top-8 right-8 w-32 h-32 opacity-20 pointer-events-none">
                        <img src={activeOrg.logoUrl} alt={activeOrg.name} className="w-full h-full object-contain grayscale" />
                    </div>
                )}

                {/* Stage Title */}
                <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10">
                    <div className="max-w-[70%]">
                        <h2 className={`text-3xl md:text-4xl font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#555]' : 'text-slate-300'} mb-2`}>Current Item</h2>
                        <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">
                            {currentSlot.title}
                        </h1>
                    </div>
                    <div className="text-right">
                        <h2 className={`text-3xl md:text-4xl font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#555]' : 'text-slate-300'} mb-2`}>Status</h2>
                        <div className={`text-4xl font-black uppercase ${isTimerActive ? 'text-emerald-500' : isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} style={isTimerActive && activeOrg?.brandColor ? { color: activeOrg.brandColor } : {}}>
                            {isTimerActive ? 'Running' : 'Paused'}
                        </div>
                    </div>
                </div>

                <div className={`relative z-10 font-mono font-black tabular-nums leading-none tracking-tighter transition-all duration-700 ${timeLeft < 0 ? 'text-rose-500' : timeLeft < 60 ? (isDarkMode ? 'text-amber-500' : 'text-amber-600') : (isDarkMode ? 'text-white' : 'text-black')
                    }`} style={{
                        fontSize: isVisible && !promptMessage?.isStrobe ? '10vw' : '35vw',
                        transform: isVisible && !promptMessage?.isStrobe ? 'translateY(-15vh)' : 'none'
                    }}>
                    {formatDuration(timeLeft)}
                </div>

                {/* Standard Prompter Message (Non-Strobe) */}
                {isVisible && promptMessage && !promptMessage.isStrobe && (
                    <div className="absolute top-[50vh] left-0 right-0 z-20 flex justify-center px-12 animate-in slide-in-from-bottom-12 duration-700">
                        <h2 className="text-[10vw] md:text-[12vw] font-black uppercase text-center text-emerald-500 tracking-tighter leading-none drop-shadow-2xl">
                            {promptMessage.text}
                        </h2>
                    </div>
                )}


                {/* Prompter Overlay - High Intensity Strobe */}
                {isVisible && promptMessage && promptMessage.isStrobe && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-12 overflow-hidden"
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
                        <h2 className="text-[12vw] font-black uppercase text-center text-white italic tracking-tighter leading-tight drop-shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-bounce">
                            {promptMessage.text}
                        </h2>
                    </div>
                )}

                {/* Bottom Meta */}
                <div className={`absolute bottom-12 w-full px-12 flex justify-between items-end border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'} pt-8`}>
                    <div className="flex-1">
                        <span className={`text-2xl font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#555]' : 'text-slate-300'} block mb-2`}>Duration</span>
                        <span className="text-4xl font-black">{currentSlot.durationMinutes}m Planned</span>
                    </div>

                    {/* Up Next Preview (Speaker Focused) */}
                    {!isThumbnail && program.slots[currentSlotIndex + 1] && (
                        <div className="flex-[2] text-center px-8 border-x border-white/5 mx-8">
                            <span className={`text-2xl font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-amber-500' : 'text-amber-600'} block mb-2`}>Up Next</span>
                            <p className={`text-5xl md:text-6xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase leading-none tracking-tighter truncate px-4`}>
                                {program.slots[currentSlotIndex + 1].title}
                            </p>
                        </div>
                    )}

                    <div className="flex-1 text-right">
                        <span className={`text-2xl font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#555]' : 'text-slate-300'} block mb-2`}>Event</span>
                        <span className="text-4xl font-black">{program.title}</span>
                    </div>
                </div>

                {/* Hold Overlay */}
                {program.isOnHold && (
                    <div className="fixed inset-0 z-[110] bg-amber-500 flex flex-col items-center justify-center p-12 animate-in fade-in duration-300">
                        <h2 className="text-[12vw] font-black uppercase text-center text-white italic tracking-tighter leading-tight drop-shadow-2xl mb-8">
                            {program.holdMessage || 'WAITING FOR CUE'}
                        </h2>
                        <div className="text-6xl font-bold uppercase tracking-[0.5em] text-white animate-pulse">
                            Stand By
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StageDisplay;
