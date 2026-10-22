import React, { useState } from 'react';
import { Download, X, User, AlignLeft, Clipboard, Check, FileText, Tv, QrCode, Printer, Eye, CheckCircle2, Loader2 } from 'lucide-react';
import { Program, Organization } from '../types';
import { timeToMinutes, minutesToTime } from '../utils/time';
import { getPublicPortalUrl } from '../utils/url';
import PrintableSchedule from './PrintableSchedule';

export interface ExportOptions {
    includeDetails: boolean;
    includeSpeakers: boolean;
    includePrompter: boolean;
}

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    program: Program;
    options: ExportOptions;
    setOptions: React.Dispatch<React.SetStateAction<ExportOptions>>;
    activeOrg?: Organization | null;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ 
    isOpen, 
    onClose, 
    program, 
    options, 
    setOptions,
    activeOrg 
}) => {
    const [copied, setCopied] = useState(false);
    const [isSavingPdf, setIsSavingPdf] = useState(false);
    const [savedPdfPath, setSavedPdfPath] = useState<string | null>(null);

    if (!isOpen) return null;

    const isElectron = typeof window !== 'undefined' && Boolean((window as any).electron?.isElectron || (window as any).electronAPI?.isElectron);
    const publicPortalUrl = getPublicPortalUrl(program);

    const handleCopyText = () => {
        let text = `${program.title}\n`;
        if (program.subtitle) text += `${program.subtitle}\n`;
        text += `Date: ${program.date} | Start: ${program.startTime}\n`;
        if (publicPortalUrl) text += `Live Schedule: ${publicPortalUrl}\n`;
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
            if (options.includePrompter && slot.prompterText) {
                text += `Teleprompter Script: ${slot.prompterText}\n`;
            }
            text += `\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSavePdf = async () => {
        if (isElectron && typeof (window as any).electron?.savePdf === 'function') {
            try {
                setIsSavingPdf(true);
                const res = await (window as any).electron.savePdf({ title: program.title });
                if (res?.success && res?.filePath) {
                    const fileName = res.filePath.split(/[\\/]/).pop() || res.filePath;
                    setSavedPdfPath(fileName);
                    setTimeout(() => setSavedPdfPath(null), 5000);
                }
            } catch (err) {
                console.error('[Kairon] PDF generation failed:', err);
            } finally {
                setIsSavingPdf(false);
            }
        } else {
            // Web browser native print to PDF
            window.print();
        }
    };

    const handleSystemPrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-6 no-print">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Download className="text-rose-600 dark:text-rose-400" size={20} />
                            Export Schedule & Rundown
                        </h3>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
                            {program.title}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Close Dialog"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Split Content: Options (Left) + Live Sheet Preview (Right) */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Left Panel: Controls */}
                    <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-5 space-y-4 flex flex-col justify-between overflow-y-auto shrink-0 bg-white dark:bg-slate-900">
                        <div className="space-y-4">
                            {publicPortalUrl && (
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-2.5">
                                    <QrCode size={16} className="text-[#0EA5E9] shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Live Public Portal QR Link
                                        </div>
                                        <div className="text-[11px] font-mono text-[#0EA5E9] truncate" title={publicPortalUrl}>
                                            {publicPortalUrl}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                                    Print Content Options
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={options.includeSpeakers}
                                            onChange={(e) => setOptions(prev => ({ ...prev, includeSpeakers: e.target.checked }))}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                                            <User size={15} className="text-slate-400" />
                                            <span className="font-medium">Include Speakers</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={options.includeDetails}
                                            onChange={(e) => setOptions(prev => ({ ...prev, includeDetails: e.target.checked }))}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                                            <AlignLeft size={15} className="text-slate-400" />
                                            <span className="font-medium">Include Details</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={options.includePrompter}
                                            onChange={(e) => setOptions(prev => ({ ...prev, includePrompter: e.target.checked }))}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                                            <Tv size={15} className="text-slate-400" />
                                            <span className="font-medium">Include Teleprompter</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                            {savedPdfPath && (
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span className="truncate">Saved <strong>{savedPdfPath}</strong></span>
                                </div>
                            )}

                            <button
                                onClick={handleSavePdf}
                                disabled={isSavingPdf}
                                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                {isSavingPdf ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Generating Vector PDF...
                                    </>
                                ) : (
                                    <>
                                        <FileText size={16} />
                                        {isElectron ? "Save as PDF (Vector File)" : "Save as PDF"}
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleSystemPrint}
                                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-xs"
                                title="Print to hardware printer using system print dialogue"
                            >
                                <Printer size={15} className="text-slate-500" />
                                Print via System Dialog
                            </button>

                            <button
                                onClick={handleCopyText}
                                className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 text-xs"
                            >
                                {copied ? <Check size={14} className="text-emerald-500" /> : <Clipboard size={14} className="text-slate-400" />}
                                {copied ? "Copied to Clipboard" : "Copy Schedule Text"}
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Live Sheet Preview */}
                    <div className="flex-1 bg-slate-100/80 dark:bg-[#07080a] p-4 sm:p-6 overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <Eye size={15} className="text-indigo-600 dark:text-indigo-400" />
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                    Live Print Preview
                                </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                A4 • Print-Ready • Clean Margin
                            </span>
                        </div>

                        {/* Interactive Paper Preview Card */}
                        <div className="max-w-3xl w-full mx-auto shadow-2xl rounded-xl overflow-hidden">
                            <PrintableSchedule
                                isPreview={true}
                                program={program}
                                includeSpeakers={options.includeSpeakers}
                                includeDetails={options.includeDetails}
                                includePrompter={options.includePrompter}
                                activeOrg={activeOrg}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

