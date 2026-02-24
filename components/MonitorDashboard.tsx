import React, { useState } from 'react';
import { Program, Organization } from '../types';
import { Monitor, Tv, Smartphone, MessageSquare, Send, ExternalLink, AlertCircle } from 'lucide-react';
import { useStageMessages } from '../hooks/useStageMessages';

interface MonitorDashboardProps {
    program: Program;
    activeOrg: Organization | null;
}

export const MonitorDashboard: React.FC<MonitorDashboardProps> = ({ program, activeOrg }) => {
    const { sendStageMessage } = useStageMessages(program.id);
    const [customMessage, setCustomMessage] = useState('');

    const quickCues = [
        { label: '5 Mins Left', text: '5 MINUTES REMAINING', type: 'alert' },
        { label: 'Wrap Up', text: 'PLEASE WRAP UP', type: 'alert' },
        { label: 'Mic Closer', text: 'BRING MIC CLOSER', type: 'info' },
        { label: 'Wait for Cue', text: 'WAIT FOR CUE', type: 'info' },
        { label: 'Next Ready', text: 'DRAMA CREW READY', type: 'info' },
    ];

    const handleSendQuick = (text: string, type: string) => {
        sendStageMessage(text, type);
    };

    const handleSendCustom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customMessage.trim()) return;
        sendStageMessage(customMessage.trim().toUpperCase(), 'alert');
        setCustomMessage('');
    };

    const displayOptions = [
        {
            title: 'Stage Monitor',
            icon: Monitor,
            description: 'Massive countdown for preachers/speakers.',
            path: `/stage?id=${program.id}`,
            color: 'bg-emerald-500'
        },
        {
            title: 'TV / Overflow',
            icon: Tv,
            description: 'High-contrast view for audience screens.',
            path: `/tv?id=${program.id}`,
            color: 'bg-rose-500'
        },
        {
            title: 'Public Portal',
            icon: Smartphone,
            description: 'Attendee view for mobile phones.',
            path: `/p/${program.slug || program.id}`,
            color: 'bg-indigo-500'
        }
    ];

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Display & Messaging</h1>
                    <p className="text-slate-500 font-medium">Manage your secondary monitors and send instant cues to the stage.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Secondary Screen Launch Cards */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayOptions.map((opt) => (
                        <div key={opt.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${opt.color} text-white`}>
                                    <opt.icon size={24} />
                                </div>
                                <button
                                    onClick={() => window.open(opt.path, '_blank')}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Open in new tab"
                                >
                                    <ExternalLink size={18} />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{opt.title}</h3>
                            <p className="text-sm text-slate-500 mb-6">{opt.description}</p>

                            <div className="aspect-video bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group-hover:border-indigo-500/30 transition-colors">
                                <iframe
                                    src={opt.path}
                                    className="w-full h-full pointer-events-none opacity-80"
                                    title={opt.title}
                                    style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
                                />
                                <div className="absolute inset-0 bg-transparent flex items-center justify-center backdrop-blur-[1px]">
                                    <span className="bg-slate-900/80 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Live Preview</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Messaging Console */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl border-4 border-indigo-500/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-600 rounded-xl">
                                <MessageSquare size={20} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight">Stage Prompter</h3>
                        </div>

                        <form onSubmit={handleSendCustom} className="mb-8">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Custom Message</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder="TYPE A CUE..."
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-600"
                                />
                                <button
                                    type="submit"
                                    className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all active:scale-95"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Cues</label>
                            <div className="grid grid-cols-1 gap-2">
                                {quickCues.map((cue) => (
                                    <button
                                        key={cue.label}
                                        onClick={() => handleSendQuick(cue.text, cue.type)}
                                        className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold uppercase tracking-tight transition-all flex items-center justify-between group"
                                    >
                                        {cue.label}
                                        <AlertCircle size={14} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                Messages appear instantly on Stage and TV displays for 5-10 seconds.
                            </p>
                        </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl p-6">
                        <h4 className="font-bold text-indigo-700 dark:text-indigo-400 mb-2 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Pro Tip
                        </h4>
                        <p className="text-sm text-indigo-600/70 dark:text-indigo-400/70 leading-relaxed">
                            Open the <strong>Stage Monitor</strong> on a tablet or laptop facing the speaker. They will see these messages flash in bright red over the countdown.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};
