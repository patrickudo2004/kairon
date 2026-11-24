import React, { useEffect } from 'react';
import { AlertTriangle, Power, X } from 'lucide-react';

interface InterlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    currentLiveEventTitle: string;
    newTargetEventTitle: string;
}

export const InterlockModal: React.FC<InterlockModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    currentLiveEventTitle,
    newTargetEventTitle
}) => {
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="interlock-modal-title"
            className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-rose-600 p-6 flex items-center justify-center" aria-hidden="true">
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <AlertTriangle size={32} className="text-white" />
                    </div>
                </div>

                <div className="p-8">
                    <h2 id="interlock-modal-title" className="text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                        Safety Interlock Active
                    </h2>

                    <div className="space-y-4 mb-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        <p>
                            Broadcast <span className="font-bold text-slate-900 dark:text-white">"{currentLiveEventTitle}"</span> is currently LIVE and broadcasting to public attendees.
                        </p>

                        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl italic text-rose-700 dark:text-rose-300">
                            "Starting a timer for <span className="font-bold">'{newTargetEventTitle}'</span> will immediately end the current broadcast and switch all attendees to the new schedule."
                        </div>

                        <p>Are you sure you want to disrupt the current event?</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-rose-500/20"
                        >
                            <Power size={16} />
                            Confirm & Switch Broadcast
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold transition-all active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    aria-label="Close safety interlock dialog"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                    <X size={20} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};
