import React from 'react';
import { X, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning'
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white',
        info: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 text-white'
    };

    const icons = {
        danger: <AlertCircle className="text-rose-500" size={24} />,
        warning: <AlertTriangle className="text-amber-500" size={24} />,
        info: <HelpCircle className="text-indigo-500" size={24} />
    };

    const bgShadows = {
        danger: 'bg-rose-500/10',
        warning: 'bg-amber-500/10',
        info: 'bg-indigo-500/10'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    {/* Icon Header */}
                    <div className={`w-14 h-14 ${bgShadows[type]} rounded-2xl flex items-center justify-center mb-6`}>
                        {icons[type]}
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg ${colors[type]}`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold transition-colors"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
