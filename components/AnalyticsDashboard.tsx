import React, { useMemo } from 'react';
import { Program, Slot } from '../types';
import { BarChart3, Clock, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, ClipboardList, Download, Printer, Save, MessageSquare } from 'lucide-react';
import { formatDuration } from '../utils/time';
import { usePDF } from '@react-pdf/renderer';
import ServiceReportPDF from './ServiceReportPDF';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

interface AnalyticsDashboardProps {
    program: Program;
    onUpdateSlot?: (slotId: string, updates: Partial<Slot>) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ program, onUpdateSlot }) => {
    const stats = useMemo(() => {
        let totalPlanned = 0;
        let totalActual = 0;
        let overruns = 0;
        const items = program.slots.map(slot => {
            const plannedVal = slot.durationMinutes;
            const actualVal = slot.actualDuration || 0;
            const variance = actualVal - plannedVal;

            totalPlanned += plannedVal;
            totalActual += actualVal;
            if (variance > 0) overruns++;

            return {
                ...slot,
                plannedVal,
                actualVal,
                variance,
            };
        });

        return {
            items,
            totalPlanned,
            totalActual,
            totalVariance: totalActual - totalPlanned,
            overruns,
            efficiency: totalPlanned > 0 ? Math.round((totalPlanned / totalActual) * 100) : 100
        };
    }, [program]);

    const finalizeProgram = useMutation(api.programs.finalizeProgram);
    const [isFinalizing, setIsFinalizing] = React.useState(false);

    const [pdfInstance, updatePdf] = usePDF({ document: <ServiceReportPDF program={program} stats={stats} /> });

    // Force PDF regeneration specifically when stats change
    React.useEffect(() => {
        updatePdf(<ServiceReportPDF program={program} stats={stats} />);
    }, [stats, program, updatePdf]);

    return (
        <div id="printable-area" className="max-w-6xl print:max-w-none mx-auto p-6 space-y-8 print:space-y-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        Service Report
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                        Performance analytics for "{program.title}"
                    </p>
                </div>
                <div className="flex items-center gap-2 no-print">
                    <button
                        onClick={async () => {
                            if (!confirm("Are you sure you want to finalize this report? This will permanently lock the data and prevent further edits.")) return;
                            try {
                                setIsFinalizing(true);
                                await finalizeProgram({ id: program.id as any });
                            } catch (e) {
                                console.error(e);
                                alert("Failed to finalize report.");
                            } finally {
                                setIsFinalizing(false);
                            }
                        }}
                        disabled={isFinalizing || program.status === 'archived'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            program.status === 'archived'
                            ? 'bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 cursor-not-allowed border border-emerald-200/50 dark:border-emerald-800/50'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-800/80 border border-indigo-200 dark:border-indigo-800/40'
                        }`}
                    >
                        {program.status === 'archived' ? (
                            <>
                                <CheckCircle2 size={14} />
                                Finalized
                            </>
                        ) : (
                            <>
                                <Save size={14} />
                                {isFinalizing ? 'Finalizing...' : 'Finalize Report'}
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            const headers = ['Title', 'Speaker', 'Planned Duration (m)', 'Actual Duration (m)', 'Variance (m)'];
                            const rows = stats.items.map(item => [
                                `"${item.title}"`,
                                `"${item.speaker || ''}"`,
                                item.plannedVal,
                                item.actualVal,
                                item.variance,
                            ]);
                            const csvContent = "data:text/csv;charset=utf-8," 
                                + headers.join(",") + "\n" 
                                + rows.map(e => e.join(",")).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `kairon_report_${program.title.replace(/\s+/g, '_')}.csv`);
                            document.body.appendChild(link);
                            link.click();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        <Download size={14} />
                        Export CSV
                    </button>
                    <button
                        onClick={() => {
                            if (pdfInstance.url) {
                                const link = document.createElement('a');
                                link.href = pdfInstance.url;
                                link.download = `kairon_service_report_${program.title.replace(/\s+/g, '_')}.pdf`;
                                link.click();
                            }
                        }}
                        disabled={pdfInstance.loading || !pdfInstance.url}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer size={14} />
                        {pdfInstance.loading ? 'Generating PDF...' : 'Download PDF'}
                    </button>
                </div>
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {program.date} • {program.startTime}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 print:p-3 print:rounded-lg rounded-2xl shadow-sm print:shadow-none print:border-slate-300">
                    <div className="flex items-center gap-3 text-slate-400 mb-2 print:mb-1">
                        <Clock className="w-[18px] h-[18px] print:w-4 print:h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider print:text-[10px]">Total Actual</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white print:text-xl">
                        {stats.totalActual}m
                    </div>
                    <div className="text-xs text-slate-500 mt-1 print:text-[10px]">
                        Planned: {stats.totalPlanned}m
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 print:p-3 print:rounded-lg rounded-2xl shadow-sm print:shadow-none print:border-slate-300">
                    <div className="flex items-center gap-3 text-amber-500 mb-2 print:mb-1">
                        {stats.totalVariance > 0 ? <TrendingUp className="w-[18px] h-[18px] print:w-4 print:h-4" /> : <TrendingDown className="w-[18px] h-[18px] print:w-4 print:h-4" />}
                        <span className="text-xs font-bold uppercase tracking-wider print:text-[10px]">Variance</span>
                    </div>
                    <div className={`text-3xl font-black print:text-xl ${stats.totalVariance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {stats.totalVariance > 0 ? `+${stats.totalVariance}` : stats.totalVariance}m
                    </div>
                    <div className="text-xs text-slate-500 mt-1 print:text-[10px]">
                        {stats.totalVariance > 0 ? 'Over original budget' : 'Under original budget'}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 print:p-3 print:rounded-lg rounded-2xl shadow-sm print:shadow-none print:border-slate-300">
                    <div className="flex items-center gap-3 text-rose-500 mb-2 print:mb-1">
                        <AlertTriangle className="w-[18px] h-[18px] print:w-4 print:h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider print:text-[10px]">Overruns</span>
                    </div>
                    <div className="text-3xl font-black text-rose-500 print:text-xl">
                        {stats.overruns}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 print:text-[10px]">
                        Sessions exceeded time
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 print:p-3 print:rounded-lg rounded-2xl shadow-sm print:shadow-none print:border-slate-300">
                    <div className="flex items-center gap-3 text-indigo-500 mb-2 print:mb-1">
                        <BarChart3 className="w-[18px] h-[18px] print:w-4 print:h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider print:text-[10px]">Efficiency</span>
                    </div>
                    <div className="text-3xl font-black text-indigo-500 print:text-xl">
                        {stats.efficiency}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1 print:text-[10px]">
                        Time accuracy score
                    </div>
                </div>
            </div>

            {/* Detailed Analysis Section */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl print:shadow-none print:border-slate-300">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between print:border-slate-200">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="text-indigo-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Slot Performance Breakdown</h2>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.items.map((item, idx) => (
                        <div key={idx} className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                                    <div className="text-xs text-slate-500">{item.speaker || 'No Speaker'}</div>
                                </div>
                                {item.actualVal > 0 && (
                                    <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${item.variance > 0 ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600' :
                                        item.variance < 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                        {item.variance > 0 ? `+${item.variance}` : item.variance}m Variance
                                    </span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Planned</div>
                                    <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{item.plannedVal}m</div>
                                </div>
                                <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10">
                                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Actual</div>
                                    <div className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.actualVal > 0 ? `${item.actualVal}m` : '---'}</div>
                                </div>
                            </div>

                            {item.actualVal > 0 && (
                                <div className="flex h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="bg-indigo-500 h-full border-r border-white/20"
                                        style={{ width: `${Math.min(100, (item.plannedVal / Math.max(item.plannedVal, item.actualVal)) * 100)}%` }}
                                    />
                                    {item.variance > 0 && (
                                        <div
                                            className="bg-rose-500 h-full"
                                            style={{ width: `${(item.variance / item.actualVal) * 100}%` }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 print:px-2 py-4 print:py-2 text-xs print:text-[10px] text-left font-bold text-slate-400 uppercase tracking-widest">Session / Speaker</th>
                                <th className="px-6 print:px-2 py-4 print:py-2 text-xs print:text-[10px] text-left font-bold text-slate-400 uppercase tracking-widest">Planned</th>
                                <th className="px-6 print:px-2 py-4 print:py-2 text-xs print:text-[10px] text-left font-bold text-slate-400 uppercase tracking-widest">Actual</th>
                                <th className="px-6 print:px-2 py-4 print:py-2 text-xs print:text-[10px] text-left font-bold text-slate-400 uppercase tracking-widest">Variance</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-48 no-print">Visualization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {stats.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 print:px-2 py-4 print:py-2">
                                        <div className="font-bold text-slate-900 dark:text-white print:text-[12px]">{item.title}</div>
                                        <div className="text-xs text-slate-500 print:text-[10px]">{item.speaker || 'No Speaker'}</div>
                                    </td>
                                    <td className="px-6 print:px-2 py-4 print:py-2 text-sm font-mono text-slate-500 print:text-[11px]">{item.plannedVal}m</td>
                                    <td className="px-6 print:px-2 py-4 print:py-2 text-sm font-mono font-bold text-slate-900 dark:text-white print:text-[11px]">
                                        {item.actualVal > 0 ? `${item.actualVal}m` : '---'}
                                    </td>
                                    <td className="px-6 print:px-2 py-4 print:py-2">
                                        {item.actualVal > 0 ? (
                                            <span className={`text-xs font-black px-2 py-1 rounded print:text-[11px] print:px-1 ${item.variance > 0 ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600' :
                                                item.variance < 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}>
                                                {item.variance > 0 ? `+${item.variance}` : item.variance}m
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-300 print:text-[10px]">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 no-print">
                                        <div className="flex h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="bg-indigo-500 h-full border-r border-white/20"
                                                style={{ width: `${Math.min(100, (item.plannedVal / Math.max(item.plannedVal, item.actualVal)) * 100)}%` }}
                                            />
                                            {item.variance > 0 && (
                                                <div
                                                    className="bg-rose-500 h-full"
                                                    style={{ width: `${(item.variance / item.actualVal) * 100}%` }}
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Insight */}
            <div className="bg-indigo-600 rounded-2xl p-8 print:p-4 text-white flex flex-col md:flex-row print:flex-row items-center justify-between gap-6 print:gap-4 shadow-xl shadow-indigo-500/20 print:bg-slate-50 print:text-slate-900 print:shadow-none print:border print:border-slate-300">
                <div className="print:flex-1">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2 print:text-lg print:mb-1 print:text-indigo-600">Production Insight</h3>
                    <p className="max-w-xl opacity-90 font-medium">
                        {stats.totalVariance > 5
                            ? "Your event drifted significantly off-schedule. Consider adding 'Buffer' slots or re-evaluating slot durations for this type of session in Gemini AI."
                            : stats.totalVariance < -5
                                ? "The event finished quite early. You may have additional time for Q&A or audience engagement next time."
                                : "Excellent pacing! This service was delivered almost exactly as planned. Your team is highly synchronized."
                        }
                    </p>
                </div>
                <div className="p-4 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 print:bg-white print:border-slate-300">
                    <div className="text-xs font-bold uppercase tracking-widest opacity-60 print:opacity-100 mb-1 print:text-slate-500">Generated by</div>
                    <div className="text-xl font-black uppercase tracking-tighter print:text-indigo-600">Kairon Analytics</div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
