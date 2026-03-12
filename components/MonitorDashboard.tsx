import React, { useState } from 'react';
import { Program, Organization } from '../types';
import { Monitor, Tv, Smartphone, MessageSquare, Send, ExternalLink, AlertCircle, Trash2, Zap, Activity, Crown } from 'lucide-react';
import { useStageMessages } from '../hooks/useStageMessages';

interface MonitorDashboardProps {
    program: Program;
    activeOrg: Organization | null;
    onLaunchFlightBridge: () => void;
    isFlightBridgeSupported: boolean;
    isPro?: boolean;
}

export const MonitorDashboard: React.FC<MonitorDashboardProps> = ({
    program,
    activeOrg,
    onLaunchFlightBridge,
    isFlightBridgeSupported,
    isPro = false
}) => {
    const { sendStageMessage, clearStageMessage } = useStageMessages(program.id);
    const [customMessage, setCustomMessage] = useState('');
    const [isStrobe, setIsStrobe] = useState(false);

    const quickCues = [
        { label: '5 Mins Left', text: '5 MINUTES REMAINING', type: 'alert' },
        { label: 'Wrap Up', text: 'PLEASE WRAP UP', type: 'alert' },
        { label: 'Mic Closer', text: 'BRING MIC CLOSER', type: 'info' },
        { label: 'Wait for Cue', text: 'WAIT FOR CUE', type: 'info' },
        { label: 'Next Ready', text: 'DRAMA CREW READY', type: 'info' },
    ];

    const handleSendQuick = (text: string, type: string) => {
        sendStageMessage(text, type, isStrobe, 10000); // 10s auto-clear
    };

    const handleSendCustom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customMessage.trim()) return;
        sendStageMessage(customMessage.trim().toUpperCase(), 'alert', isStrobe, 15000); // 15s auto-clear
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
        },
        {
            title: 'Crew Tactical HUD',
            icon: Activity,
            description: 'Staff-only view with production cues.',
            path: `/p/${program.slug || program.id}/crew`,
            color: 'bg-amber-500'
        }
    ];

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Display & Messaging</h1>
                    <p className="text-slate-500 font-medium">Manage your secondary monitors and send instant cues to the stage.</p>
                </div>

                {isFlightBridgeSupported && (
                    <button
                        onClick={onLaunchFlightBridge}
                        className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group shrink-0"
                    >
                        <ExternalLink size={18} className="group-hover:rotate-12 transition-transform" />
                        Launch Flight Bridge
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Secondary Screen Launch Cards */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayOptions.map((opt) => {
                        const isCrewHUD = opt.title === 'Crew Tactical HUD';
                        const isLocked = isCrewHUD && !isPro;

                        return (
                            <div key={opt.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-2xl ${opt.color} text-white`}>
                                            <opt.icon size={24} />
                                        </div>
                                        {isLocked && (
                                            <div className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tighter shadow-sm border border-white/20">
                                                <Crown size={10} /> Pro
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (isLocked) {
                                                window.location.href = '/admin?tab=branding';
                                                return;
                                            }
                                            window.open(opt.path, '_blank');
                                        }}
                                        className={`p-2 rounded-xl transition-colors ${isLocked ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}
                                        title={isLocked ? "Unlock with Pro" : "Open in new tab"}
                                    >
                                        {isLocked ? <Crown size={18} /> : <ExternalLink size={18} />}
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{opt.title}</h3>
                                <p className="text-sm text-slate-500 mb-6">{opt.description}</p>

                                <div className={`aspect-video bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative transition-colors ${!isLocked ? 'group-hover:border-indigo-500/30' : ''}`}>
                                    <div className={`w-full h-full ${isLocked ? 'blur-sm grayscale' : ''}`} style={{ overflow: 'hidden' }}>
                                        <iframe
                                            src={`${opt.path}${opt.path.includes('?') ? '&' : '?'}mode=thumbnail`}
                                            className="pointer-events-none opacity-80"
                                            title={opt.title}
                                            style={{
                                                width: '1920px',
                                                height: '1080px',
                                                transform: 'scale(0.1666)',
                                                transformOrigin: 'top left',
                                                border: 'none'
                                            }}
                                        />
                                    </div>
                                    {!isLocked ? (
                                        <div className="absolute inset-0 bg-transparent flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="bg-slate-900/80 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Live Preview</span>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 bg-slate-950/20 flex flex-col items-center justify-center p-6 text-center">
                                            <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-xl mb-3 shadow-amber-500/20">
                                                <Crown size={24} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-900 bg-white/90 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">Unlock with Kairon Pro</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Message</label>
                                <button
                                    type="button"
                                    onClick={() => setIsStrobe(!isStrobe)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${isStrobe
                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    <Zap size={10} fill={isStrobe ? "currentColor" : "none"} />
                                    Flash Mode {isStrobe ? 'ON' : 'OFF'}
                                </button>
                            </div>
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
                            <button
                                onClick={clearStageMessage}
                                className="w-full mt-4 px-4 py-3 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 rounded-xl text-rose-400 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Trash2 size={16} />
                                Clear Display
                            </button>
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

            </div >
        </div >
    );
};
