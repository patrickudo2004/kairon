import React, { useEffect, useState } from 'react';
import { Program, Organization } from '../types';
import { supabase } from '../services/supabaseClient';

interface StageDisplayProps {
    program: Program;
    secondsElapsed: number;
    isTimerActive: boolean;
    currentSlotIndex: number;
    activeOrg?: Organization | null;
}

const StageDisplay: React.FC<StageDisplayProps> = ({
    program,
    secondsElapsed,
    isTimerActive,
    currentSlotIndex,
    activeOrg
}) => {
    const [promptMessage, setPromptMessage] = useState<{ text: string, type: string } | null>(null);
    const currentSlot = program.slots[currentSlotIndex];

    // Stage Messaging Subscription
    useEffect(() => {
        if (!program.id) return;

        const channel = supabase.channel(`prompter:${program.id}`)
            .on('broadcast', { event: 'stage_message' }, ({ payload }) => {
                setPromptMessage({ text: payload.text, type: payload.type });
                setTimeout(() => setPromptMessage(null), 5000);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [program.id]);

    const formatTime = (seconds: number) => {
        const isNegative = seconds < 0;
        const absSeconds = Math.abs(seconds);
        const m = Math.floor(absSeconds / 60);
        const s = absSeconds % 60;
        return `${isNegative ? '-' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const durationSeconds = currentSlot ? currentSlot.durationMinutes * 60 : 0;
    const timeLeft = durationSeconds - secondsElapsed;

    if (!currentSlot) {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center">
                <h1 className="text-white text-[15vw] font-black uppercase">Stand By</h1>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center font-sans select-none">

            {/* High Contrast Background Signal */}
            <div className={`absolute inset-0 transition-colors duration-500 ${timeLeft < 0 ? 'bg-rose-950/20' : timeLeft < 60 ? 'bg-amber-950/10' : ''
                }`} />

            {/* Logo Overlay */}
            {activeOrg?.logoUrl && (
                <div className="absolute top-8 right-8 w-32 h-32 opacity-20 pointer-events-none">
                    <img src={activeOrg.logoUrl} alt={activeOrg.name} className="w-full h-full object-contain grayscale" />
                </div>
            )}

            {/* Stage Title */}
            <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10">
                <div className="max-w-[70%]">
                    <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-[#555] mb-2">Current Item</h2>
                    <h1 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">
                        {currentSlot.title}
                    </h1>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-[#555] mb-2">Status</h2>
                    <div className={`text-4xl font-black uppercase ${isTimerActive ? 'text-emerald-500' : 'text-slate-600'}`} style={isTimerActive && activeOrg?.brandColor ? { color: activeOrg.brandColor } : {}}>
                        {isTimerActive ? 'Running' : 'Paused'}
                    </div>
                </div>
            </div>

            {/* Massive Clock */}
            <div className={`relative z-10 font-mono font-black tabular-nums leading-none tracking-tighter ${timeLeft < 0 ? 'text-rose-500' : timeLeft < 60 ? 'text-amber-500' : 'text-white'
                }`} style={{ fontSize: '35vw' }}>
                {formatTime(timeLeft)}
            </div>

            {/* Prompter Overlay - Full Screen Attention */}
            {promptMessage && (
                <div className="fixed inset-0 z-[100] bg-rose-600 flex items-center justify-center p-12">
                    <h2 className="text-[10vw] font-black uppercase text-center text-white italic tracking-tighter leading-tight drop-shadow-2xl">
                        {promptMessage.text}
                    </h2>
                </div>
            )}

            {/* Bottom Meta */}
            <div className="absolute bottom-12 w-full px-12 flex justify-between items-end border-t border-white/10 pt-8">
                <div>
                    <span className="text-2xl font-bold uppercase tracking-widest text-[#555] block mb-2">Duration</span>
                    <span className="text-4xl font-black">{currentSlot.durationMinutes}m Planned</span>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold uppercase tracking-widest text-[#555] block mb-2">Event</span>
                    <span className="text-4xl font-black">{program.title}</span>
                </div>
            </div>
        </div>
    );
};

export default StageDisplay;
