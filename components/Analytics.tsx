import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Program, Slot } from '../types';
import { Clock, Zap, Award } from 'lucide-react';

interface AnalyticsProps {
  program: Program;
}

const Analytics: React.FC<AnalyticsProps> = ({ program }) => {
  // Calculate data based on actualDuration properties
  const data = program.slots.map(slot => ({
    name: slot.title.length > 20 ? slot.title.substring(0, 20) + '...' : slot.title,
    planned: slot.durationMinutes,
    actual: slot.actualDuration || 0,
    diff: (slot.actualDuration || 0) - slot.durationMinutes
  })).filter(item => item.actual > 0); // Only show completed

  const totalPlanned = data.reduce((acc, curr) => acc + curr.planned, 0);
  const totalActual = data.reduce((acc, curr) => acc + curr.actual, 0);
  const adherence = totalPlanned > 0 ? Math.round((1 - Math.abs(totalActual - totalPlanned) / totalPlanned) * 100) : 100;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <Clock size={48} className="mb-4 opacity-50" />
        <h3 className="text-xl font-medium">No data available yet</h3>
        <p>Complete sessions in "Live Mode" to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Performance Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-2 text-indigo-400">
            <Clock size={24} />
            <span className="font-semibold uppercase tracking-wide text-xs">Total Run Time</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalActual} <span className="text-lg text-slate-500 font-normal">mins</span></div>
          <div className="text-xs text-slate-500 mt-1">Planned: {totalPlanned} mins</div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-2 text-emerald-400">
            <Award size={24} />
            <span className="font-semibold uppercase tracking-wide text-xs">Schedule Adherence</span>
          </div>
          <div className="text-3xl font-bold text-white">{adherence}%</div>
          <div className="text-xs text-slate-500 mt-1">Accuracy score</div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-2 text-violet-400">
            <Zap size={24} />
            <span className="font-semibold uppercase tracking-wide text-xs">Total Sessions</span>
          </div>
          <div className="text-3xl font-bold text-white">{data.length}</div>
          <div className="text-xs text-slate-500 mt-1">Completed sessions</div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6">Planned vs Actual Duration (minutes)</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
              <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                itemStyle={{ color: '#e2e8f0' }}
                cursor={{fill: '#334155', opacity: 0.4}}
              />
              <Bar dataKey="planned" name="Planned" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.actual > entry.planned ? '#f43f5e' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                <span className="text-slate-400">Planned Time</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                <span className="text-slate-400">On Time / Early</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-sm"></div>
                <span className="text-slate-400">Overtime</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
