import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, User, Mic, ExternalLink, GripVertical, ClipboardList } from 'lucide-react';
import { Program } from '../types';

interface PreviewDrawerProps {
    program: Program | null;
    isOpen: boolean;
    onClose: () => void;
    onOpenInEditor: (program: Program) => void;
}

export const PreviewDrawer: React.FC<PreviewDrawerProps> = ({ program, isOpen, onClose, onOpenInEditor }) => {
    const [width, setWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            // Subtract current mouse X from total window width to get drawer width from right
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < window.innerWidth * 0.8) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            document.body.style.overflow = 'hidden'; // Prevent scroll while resizing
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            document.body.style.overflow = 'auto';
        };
    }, [isResizing]);

    if (!isOpen || !program) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/20 dark:bg-black/40 backdrop-blur-sm z-[55] animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div
                ref={drawerRef}
                style={{ width: `${width}px` }}
                className="fixed top-0 right-0 bottom-0 bg-white dark:bg-slate-900 shadow-2xl z-[60] border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-500 ease-out"
            >
                {/* Resize Handle (Left absolute edge) */}
                <div
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                    }}
                    className={`absolute top-0 left-0 bottom-0 w-1.5 cursor-ew-resize transition-all hover:bg-indigo-500/50 group z-10 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
                >
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 -track-x-1/2 w-6 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <GripVertical size={14} className="text-slate-400" />
                    </div>
                </div>

                {/* Toolbar Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-start justify-between mb-5">
                        <div className="pr-10">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded tracking-widest uppercase">Preview</span>
                                {program.status === 'active' && (
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Event is currently live" />
                                )}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white truncate" title={program.title}>{program.title}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate opacity-80 mt-0.5">{program.subtitle}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-2xl transition-all"
                            title="Close Preview"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onOpenInEditor(program)}
                            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white h-11 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                        >
                            Open in Editor <ExternalLink size={16} />
                        </button>
                        <div className="w-11 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400">
                            <ClipboardList size={20} />
                        </div>
                    </div>
                </div>

                {/* Scrollable Slot Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/10">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Session Blueprint</h3>
                        <span className="text-[10px] font-bold text-slate-400">{program.slots.length} Total</span>
                    </div>

                    <div className="space-y-3">
                        {program.slots.map((slot, idx) => (
                            <div
                                key={slot.id}
                                className="group p-5 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 rounded-3xl transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200/50 dark:border-slate-700/50">
                                            {idx + 1}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                                            <Clock size={10} />
                                            {slot.durationMinutes}m
                                        </div>
                                    </div>
                                </div>

                                <h4 className="font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {slot.title}
                                </h4>

                                <div className="flex flex-wrap items-center gap-4">
                                    {slot.speaker && (
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                            <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <User size={10} />
                                            </div>
                                            {slot.speaker}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                        <Mic size={12} className="opacity-50" />
                                        {slot.type}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {program.slots.length === 0 && (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <ClipboardList size={32} />
                            </div>
                            <p className="text-slate-400 text-sm font-medium italic">This program currently has no slots.</p>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center shrink-0">
                    Kairon Power Preview • {new Date(program.date).toLocaleDateString()}
                </div>
            </div>
        </>
    );
};
