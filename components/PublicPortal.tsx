import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Program } from '../types';
import { getPublicProgram } from '../services/programService';
import { formatDuration } from '../utils/time';
import { Mic, Clock, User, Calendar, ExternalLink, ChevronRight } from 'lucide-react';

export const PublicPortal: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [program, setProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;

        const loadPublicProgram = async () => {
            try {
                const data = await getPublicProgram(slug);
                setProgram(data);
            } catch (err) {
                console.error("Failed to load public program:", err);
            } finally {
                setLoading(false);
            }
        };

        loadPublicProgram();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Loading event schedule...</p>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center mb-6">
                    <Calendar className="text-rose-600 dark:text-rose-400" size={40} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Event Not Found</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-xs mb-8">
                    This event might be private or the link might be incorrect.
                </p>
                <Link to="/" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-2">
                    Back to Kairon
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
            {/* Minimal Header */}
            <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
                        <span className="font-bold text-slate-900 dark:text-white">Kairon</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                {/* Event Hero */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        <Calendar size={14} />
                        {new Date(program.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
                        {program.title}
                    </h1>
                    {program.subtitle && (
                        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
                            {program.subtitle}
                        </p>
                    )}
                </div>

                {/* Schedule List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Schedule</h2>
                    {program.slots.map((slot, index) => (
                        <div
                            key={slot.id}
                            className={`group p-6 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all ${index === program.currentSlotIndex && program.isTimerActive
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 scale-[1.02] shadow-xl'
                                : 'bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                                        Slot {index + 1}
                                    </div>
                                    {index === program.currentSlotIndex && program.isTimerActive && (
                                        <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-full animate-pulse tracking-widest">
                                            Live Now
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-sm font-bold">
                                    <Clock size={16} />
                                    {slot.durationMinutes}m
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {slot.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-6">
                                {slot.speaker && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <User size={16} />
                                        </div>
                                        {slot.speaker}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-600 text-sm font-bold uppercase tracking-wider">
                                    <Mic size={14} />
                                    {slot.type}
                                </div>
                            </div>

                            {slot.details && (
                                <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-900 pt-4">
                                    {slot.details}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <footer className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-slate-400 dark:text-slate-600 text-sm mb-4">
                        This schedule is managed live using
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                        Kairon Production Timer
                        <ExternalLink size={18} />
                    </Link>
                </footer>
            </main>
        </div>
    );
};
