import React, { useMemo } from 'react';
import { Program, Slot } from '../types';
import { BarChart3, Clock, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, ClipboardList, Download, Printer, Save, MessageSquare } from 'lucide-react';
import { formatDuration } from '../utils/time';
import { usePDF } from '@react-pdf/renderer';
import ServiceReportPDF from './ServiceReportPDF';
import { useQuery, useMutation } from '../hooks/useConvexMock';
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

    const organization = useQuery(
        api.orgs.getOrganizationById,
        program.organizationId ? { id: program.organizationId } : "skip"
    );

    const [pdfInstance, updatePdf] = usePDF({ document: <ServiceReportPDF program={program} stats={stats} logoUrl={organization?.logoUrl || ""} /> });

    // Force PDF regeneration specifically when stats change
    React.useEffect(() => {
        updatePdf(<ServiceReportPDF program={program} stats={stats} logoUrl={organization?.logoUrl || ""} />);
    }, [stats, program, organization?.logoUrl, updatePdf]);

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
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 ${
                            program.status === 'archived'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-not-allowed border border-emerald-500/30'
                            : 'bg-[#0EA5E9]/10 text-[#0EA5E9] hover:bg-[#0EA5E9]/20 border border-[#0EA5E9]/30'
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
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-[#8A93A4] transition-colors border border-slate-200 dark:border-[#22262E]"
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
                        className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer size={14} />
                        {pdfInstance.loading ? 'Generating PDF...' : 'Download PDF'}
                    </button>
                </div>
                <div className="px-4 py-2 bg-slate-100 dark:bg-[#181B22] rounded-full border border-slate-200 dark:border-[#22262E] text-xs font-mono font-bold text-slate-500 dark:text-[#8A93A4] uppercase tracking-widest">
                    {program.date} • {program.startTime}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 gap-4 font-mono">
                <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] p-6 print:p-3 print:rounded-lg rounded-2xl shadow-sm print:shadow-none print:border-slate-300">
                    <div className="flex items-center gap-3 text-slate-400 mb-2 print:mb-1">
                        <Clock className="w-[18px] h-[18px] print:w-4 print:h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Actual</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white print:text-xl">
                        {stats.totalActual}m
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#8A93A4] mt-1 print:text-[10px]">
                        Planned: {stats.totalPlanned}m
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] p-6 print:p-3 print:rounded-lg rounded-2xl shadow-sm print:shadow-none print:border-slate-300">
                    <div className="flex items-center gap-3 text-amber-500 mb-2 print:mb-1">
                        {stats.totalVariance > 0 ? <TrendingUp className="w-[18px] h-[18px] print:w-4 print:h-4" /> : <TrendingDown className="w-[18px] h-[18px] print:w-4 print:h-4" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">Variance</span>
                    </div>
                    <div className={`text-3xl font-bold print:text-xl ${stats.totalVariance > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                        {stats.totalVariance > 0 ? `+${stats.totalVariance}` : stats.totalVariance}m
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#8A93A4] mt-1 print:text-[10px]">
                        {stats.totalVariance > 0 ? 'Over original budget' : 'Under original budget'}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] p-6 print:p-3 print:rounded-lg rounded-2xl shadow-sm print:shadow-none print:border-slate-300">
                    <div className="flex items-center gap-3 text-[#EF4444] mb-2 print:mb-1">
                        <AlertTriangle className="w-[18px] h-[18px] print:w-4 print:h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Overruns</span>
                    </div>
                    <div className="text-3xl font-bold text-[#EF4444] print:text-xl">
                        {stats.overruns}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#8A93A4] mt-1 print:text-[10px]">
                        Sessions exceeded time
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] p-6 print:p-3 print:rounded-lg rounded-2xl shadow-sm print:shadow-none print:border-slate-300">
                    <div className="flex items-center gap-3 text-[#0EA5E9] mb-2 print:mb-1">
                        <BarChart3 className="w-[18px] h-[18px] print:w-4 print:h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Efficiency</span>
                    </div>
                    <div className="text-3xl font-bold text-[#0EA5E9] print:text-xl">
                        {stats.efficiency}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#8A93A4] mt-1 print:text-[10px]">
                        Time accuracy score
                    </div>
                </div>
            </div>

            {/* Detailed Analysis Section */}
            <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-2xl overflow-hidden shadow-md print:shadow-none print:border-slate-300">
                <div className="p-6 border-b border-slate-100 dark:border-[#22262E] flex items-center justify-between print:border-slate-200">
                    <div className="flex items-center gap-3">
                        <ClipboardList className="text-[#0EA5E9]" size={20} />
                        <h2 className="text-sm font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">Slot Performance Breakdown</h2>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-[#22262E]">
                    {stats.items.map((item, idx) => (
                        <div key={idx} className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                                    <div className="text-xs text-slate-500 dark:text-[#8A93A4] font-mono">{item.speaker || 'No Speaker'}</div>
                                </div>
                                {item.actualVal > 0 && (
                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.variance > 0 ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30' :
                                        item.variance < 0 ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' :
                                            'bg-slate-100 dark:bg-[#181B22] text-slate-500'
                                    }`}>
                                        {item.variance > 0 ? `+${item.variance}` : item.variance}m Variance
                                    </span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 font-mono">
                                <div className="bg-slate-50 dark:bg-[#181B22] p-3 rounded-xl border border-slate-100 dark:border-[#22262E]">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Planned</div>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.plannedVal}m</div>
                                </div>
                                <div className="bg-[#0EA5E9]/5 p-3 rounded-xl border border-[#0EA5E9]/20">
                                    <div className="text-[10px] font-bold text-[#0EA5E9] uppercase tracking-widest mb-1">Actual</div>
                                    <div className="text-sm font-bold text-[#0EA5E9]">{item.actualVal > 0 ? `${item.actualVal}m` : '---'}</div>
                                </div>
                            </div>

                            {item.actualVal > 0 && (
                                <div className="flex h-1.5 w-full bg-slate-100 dark:bg-[#181B22] rounded-full overflow-hidden">
                                    <div
                                        className="bg-[#0EA5E9] h-full border-r border-white/20"
                                        style={{ width: `${Math.min(100, (item.plannedVal / Math.max(item.plannedVal, item.actualVal)) * 100)}%` }}
                                    />
                                    {item.variance > 0 && (
                                        <div
                                            className="bg-[#EF4444] h-full"
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
                    <table className="w-full text-left font-mono">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#181B22] border-b border-slate-100 dark:border-[#22262E]">
                                <th className="px-6 print:px-2 py-4 print:py-2 text-[10px] text-left font-bold text-slate-400 uppercase tracking-wider">Session / Speaker</th>
                                <th className="px-6 print:px-2 py-4 print:py-2 text-[10px] text-left font-bold text-slate-400 uppercase tracking-wider">Planned</th>
                                <th className="px-6 print:px-2 py-4 print:py-2 text-[10px] text-left font-bold text-slate-400 uppercase tracking-wider">Actual</th>
                                <th className="px-6 print:px-2 py-4 print:py-2 text-[10px] text-left font-bold text-slate-400 uppercase tracking-wider">Variance</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-48 no-print">Visualization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#22262E]">
                            {stats.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#181B22]/50 transition-colors">
                                    <td className="px-6 print:px-2 py-4 print:py-2">
                                        <div className="font-bold text-slate-900 dark:text-white text-sm font-sans">{item.title}</div>
                                        <div className="text-xs text-slate-500 dark:text-[#8A93A4]">{item.speaker || 'No Speaker'}</div>
                                    </td>
                                    <td className="px-6 print:px-2 py-4 print:py-2 text-sm text-slate-500 dark:text-[#8A93A4]">{item.plannedVal}m</td>
                                    <td className="px-6 print:px-2 py-4 print:py-2 text-sm font-bold text-slate-900 dark:text-white">
                                        {item.actualVal > 0 ? `${item.actualVal}m` : '---'}
                                    </td>
                                    <td className="px-6 print:px-2 py-4 print:py-2">
                                        {item.actualVal > 0 ? (
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.variance > 0 ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30' :
                                                item.variance < 0 ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' :
                                                    'bg-slate-100 dark:bg-[#181B22] text-slate-500'
                                            }`}>
                                                {item.variance > 0 ? `+${item.variance}` : item.variance}m
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 no-print">
                                        <div className="flex h-1.5 w-full bg-slate-100 dark:bg-[#181B22] rounded-full overflow-hidden">
                                            <div
                                                className="bg-[#0EA5E9] h-full border-r border-white/20"
                                                style={{ width: `${Math.min(100, (item.plannedVal / Math.max(item.plannedVal, item.actualVal)) * 100)}%` }}
                                            />
                                            {item.variance > 0 && (
                                                <div
                                                    className="bg-[#EF4444] h-full"
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
            <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-2xl p-6 md:p-8 print:p-4 text-slate-900 dark:text-white flex flex-col md:flex-row print:flex-row items-center justify-between gap-6 print:gap-4 shadow-sm font-sans">
                <div className="print:flex-1">
                    <h3 className="text-xl font-bold font-mono uppercase tracking-wider mb-2 text-[#0EA5E9]">Production Insight</h3>
                    <p className="max-w-xl text-slate-600 dark:text-[#8A93A4] text-sm font-medium leading-relaxed">
                        {stats.totalVariance > 5
                            ? "Your event drifted significantly off-schedule. Consider adding 'Buffer' slots or re-evaluating slot durations for this type of session in Gemini AI."
                            : stats.totalVariance < -5
                                ? "The event finished quite early. You may have additional time for Q&A or audience engagement next time."
                                : "Excellent pacing! This service was delivered almost exactly as planned. Your team is highly synchronized."
                        }
                    </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-[#181B22] rounded-xl border border-slate-200 dark:border-[#22262E] font-mono text-center md:text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Generated by</div>
                    <div className="text-lg font-bold text-[#0EA5E9] tracking-wider">Kairon Analytics</div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
