import React, { useState, useEffect } from 'react';
import { Power, Timer, Plus, Minus, Wifi, WifiOff, BarChart3 } from 'lucide-react';

interface ProductionHUDProps {
    isTimerActive: boolean;
    isAdminOnline: boolean;
    onEndEvent: () => void;
    onNudge: (minutes: number) => void;
    onViewAnalytics: (id: string) => void;
    currentSlotTitle?: string;
    programId?: string;
}

export const ProductionHUD: React.FC<ProductionHUDProps> = ({
    isTimerActive,
    isAdminOnline,
    onEndEvent,
    onNudge,
    onViewAnalytics,
    currentSlotTitle,
    programId
}) => {
    const [holdToEnd, setHoldToEnd] = useState(0);
    const [isEnding, setIsEnding] = useState(false);

    // Hold to end logic
    useEffect(() => {
        let interval: number;
        if (isEnding && holdToEnd < 100) {
            interval = window.setInterval(() => {
                setHoldToEnd((prev) => Math.min(100, prev + 5));
            }, 50);
        } else if (!isEnding && holdToEnd > 0) {
            interval = window.setInterval(() => {
                setHoldToEnd((prev) => Math.max(0, prev - 10));
            }, 50);
        }

        if (holdToEnd >= 100) {
            onEndEvent();
            setHoldToEnd(0);
            setIsEnding(false);
        }

        return () => clearInterval(interval);
    }, [isEnding, holdToEnd, onEndEvent]);

    // If timer is not active, we can show a 'Review Report' state if a program was recently active
    if (!isTimerActive) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none">
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto animate-in slide-in-from-bottom-8 duration-500">

                {/* Status Section */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        <span className={`w-2 h-2 rounded-full ${isAdminOnline ? 'bg-indigo-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                            {isAdminOnline ? 'Live Broadcast' : 'Sync Offline'}
                        </span>
                    </div>
                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Current Session</span>
                        <span className="text-sm font-bold text-white truncate max-w-[200px]">{currentSlotTitle || 'No Session'}</span>
                    </div>
                </div>

                {/* Control Section */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-800 rounded-xl p-1">
                        <button
                            onClick={() => onNudge(-1)}
                            className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                            title="Nudge -1 min"
                        >
                            <Minus size={18} />
                        </button>
                        <div className="px-3 flex flex-col items-center">
                            <Timer size={14} className="text-indigo-500 mb-0.5" />
                            <span className="text-[10px] font-bold text-slate-500">NUDGE</span>
                        </div>
                        <button
                            onClick={() => onNudge(1)}
                            className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                            title="Nudge +1 min"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {programId && (
                        <button
                            onClick={() => onViewAnalytics(programId)}
                            className="flex items-center gap-2 p-2 hover:bg-slate-800 text-amber-500 rounded-xl transition-colors"
                            title="View Service Report"
                        >
                            <BarChart3 size={20} />
                            <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Report</span>
                        </button>
                    )}

                    <div className="w-[1px] h-8 bg-slate-800 mx-2" />

                    <button
                        onMouseDown={() => setIsEnding(true)}
                        onMouseUp={() => setIsEnding(false)}
                        onMouseLeave={() => setIsEnding(false)}
                        onTouchStart={() => setIsEnding(true)}
                        onTouchEnd={() => setIsEnding(false)}
                        className="relative group overflow-hidden bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 select-none"
                    >
                        {/* Progress Reveal */}
                        <div
                            className="absolute inset-0 bg-rose-950 opacity-50 origin-left transition-transform duration-75"
                            style={{ transform: `scaleX(${holdToEnd / 100})` }}
                        />
                        <Power size={18} className="relative z-10" />
                        <span className="relative z-10 whitespace-nowrap">
                            {holdToEnd > 0 ? 'Hold to End...' : 'End Event'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
