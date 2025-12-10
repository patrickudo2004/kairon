import React, { useState, useEffect } from 'react';
import { Program } from '../types';
import { Share2, X, AlertTriangle, Check, Copy, QrCode, Edit3 } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    program: Program;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, program }) => {
    const [copiedType, setCopiedType] = useState<'view' | 'edit' | null>(null);
    const [qrType, setQrType] = useState<'view' | 'edit' | null>(null);
    const [includeDetails, setIncludeDetails] = useState(true);

    useEffect(() => {
        if (!isOpen) {
            setQrType(null); // Reset on close
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Strip trailing slash to avoid //#/
    const baseUrl = (window.location.origin + window.location.pathname).replace(/\/$/, '');

    const getShareUrl = (type: 'view' | 'edit') => {
        const shareId = program.id;
        let params = '';

        if (type === 'view') {
            params = `#/live?mode=viewer&id=${shareId}`;
        } else {
            params = `#/?mode=editor&id=${shareId}`;
        }
        return `${baseUrl}/${params}`;
    };

    const copyToClipboard = (type: 'view' | 'edit') => {
        const url = getShareUrl(type);

        navigator.clipboard.writeText(url).then(() => {
            setCopiedType(type);
            setTimeout(() => setCopiedType(null), 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard.');
        });
    };

    const toggleQr = (type: 'view' | 'edit') => {
        if (qrType === type) {
            setQrType(null);
        } else {
            setQrType(type);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 no-print">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Share2 className="text-indigo-600 dark:text-indigo-400" size={24} />
                        Share Program
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 p-3 rounded-lg flex gap-3 items-start">
                        <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Note: This app is client-side only. The link generated contains the entire schedule data.
                        </p>
                    </div>

                    {/* Link Options */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <input
                            type="checkbox"
                            checked={includeDetails}
                            onChange={(e) => setIncludeDetails(e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="text-sm">
                            <span className="font-semibold text-slate-900 dark:text-white block">Include Details</span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs">Uncheck to significant shorten the link (removes text descriptions).</span>
                        </div>
                    </div>

                    {/* Viewer Option */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold text-slate-900 dark:text-white">Viewer Link</div>
                            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                Read Only
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                            Share with attendees (Live View & List only).
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => copyToClipboard('view')}
                                className="flex-1 flex items-center justify-between bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 transition-all group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded shadow-sm">
                                        <Share2 size={16} className="text-indigo-500" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                        Copy Link
                                    </span>
                                </div>
                                {copiedType === 'view' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-slate-400 group-hover:text-indigo-500" />}
                            </button>
                            <button
                                onClick={() => toggleQr('view')}
                                className={`px-4 py-3 rounded-xl border transition-all flex items-center justify-center ${qrType === 'view'
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                                    }`}
                                title="Toggle QR Code"
                            >
                                <QrCode size={20} />
                            </button>
                        </div>
                        {qrType === 'view' && (
                            <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-inner flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                                <div className="bg-white p-2 rounded">
                                    <QRCode value={getShareUrl('view')} size={180} />
                                </div>
                                <p className="mt-2 text-xs text-slate-500 font-medium text-center">Scan to open Viewer Mode</p>
                            </div>
                        )}
                    </div>

                    {/* Editor Option */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold text-slate-900 dark:text-white">Co-Editor Link</div>
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                Full Access
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                            Share with other coordinators to manage the schedule.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => copyToClipboard('edit')}
                                className="flex-1 flex items-center justify-between bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 transition-all group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded shadow-sm">
                                        <Edit3 size={16} className="text-indigo-500" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                        Copy Link
                                    </span>
                                </div>
                                {copiedType === 'edit' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-slate-400 group-hover:text-indigo-500" />}
                            </button>
                            <button
                                onClick={() => toggleQr('edit')}
                                className={`px-4 py-3 rounded-xl border transition-all flex items-center justify-center ${qrType === 'edit'
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                                    }`}
                                title="Toggle QR Code"
                            >
                                <QrCode size={20} />
                            </button>
                        </div>
                        {qrType === 'edit' && (
                            <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-inner flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                                <div className="bg-white p-2 rounded">
                                    <QRCode value={getShareUrl('edit')} size={180} />
                                </div>
                                <p className="mt-2 text-xs text-slate-500 font-medium text-center">Scan to open Editor Mode</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareDialog;
