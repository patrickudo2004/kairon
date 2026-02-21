import React, { useState } from 'react';
import { Download, X, User, AlignLeft, Clipboard, Check, FileText } from 'lucide-react';
import { Program } from '../types';
import { timeToMinutes, minutesToTime } from '../utils/time';

export interface ExportOptions {
    includeDetails: boolean;
    includeSpeakers: boolean;
}

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    program: Program;
    options: ExportOptions;
    setOptions: React.Dispatch<React.SetStateAction<ExportOptions>>;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, program, options, setOptions }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopyText = () => {
        let text = `${program.title}\n`;
        if (program.subtitle) text += `${program.subtitle}\n`;
        text += `Date: ${program.date} | Start: ${program.startTime}\n`;
        text += `----------------------------------------\n\n`;

        let runningMinutes = timeToMinutes(program.startTime);

        program.slots.forEach(slot => {
            const startStr = minutesToTime(runningMinutes);
            runningMinutes += slot.durationMinutes;

            text += `${startStr} - ${slot.title}`;
            if (slot.type === 'Break') text += ` (Break)`;
            text += `\n`;

            if (options.includeSpeakers && slot.speaker) {
                text += `Speaker: ${slot.speaker}\n`;
            }

            text += `Duration: ${slot.durationMinutes} mins\n`;

            if (options.includeDetails && slot.details) {
                text += `Details: ${slot.details}\n`;
            }
            text += `\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 no-print">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Download className="text-rose-600 dark:text-rose-400" size={24} />
                        Export Schedule
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Choose options for your export.
                    </p>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <input
                                type="checkbox"
                                checked={options.includeSpeakers}
                                onChange={(e) => setOptions(prev => ({ ...prev, includeSpeakers: e.target.checked }))}
                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                                <User size={18} className="text-slate-400" />
                                <span className="font-medium">Include Speakers</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <input
                                type="checkbox"
                                checked={options.includeDetails}
                                onChange={(e) => setOptions(prev => ({ ...prev, includeDetails: e.target.checked }))}
                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                                <AlignLeft size={18} className="text-slate-400" />
                                <span className="font-medium">Include Details</span>
                            </div>
                        </label>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            onClick={handleCopyText}
                            className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                        >
                            {copied ? <Check size={20} className="text-emerald-500" /> : <Clipboard size={20} />}
                            {copied ? "Copied to Clipboard" : "Copy Schedule Text"}
                        </button>

                        <button
                            onClick={() => {
                                onClose();
                                window.print();
                            }}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <FileText size={20} />
                            Generate PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
