import React from 'react';
import QRCode from 'react-qr-code';
import { Program, Organization } from '../types';
import { timeToMinutes, minutesToTime } from '../utils/time';

interface PrintableScheduleProps {
  program: Program;
  includeSpeakers?: boolean;
  includeDetails?: boolean;
  includePrompter?: boolean;
  activeOrg?: Organization | null;
}

const PrintableSchedule: React.FC<PrintableScheduleProps> = ({
  program,
  includeSpeakers = true,
  includeDetails = true,
  includePrompter = false,
  activeOrg
}) => {
  const startMinutes = timeToMinutes(program.startTime || "09:00");
  let runningMinutes = startMinutes;

  const publicPortalUrl = `${window.location.origin}/p/${program.slug}`;

  return (
    <div id="printable-area" className="only-print bg-white text-black p-6 font-sans">
      {/* Split Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4 gap-6">
        {/* Left Column: Logo + Org Name + Event Title + Subtitle */}
        <div className="flex gap-4 items-start flex-1 min-w-0">
          {activeOrg?.logoUrl ? (
            <div className="w-10 h-10 border border-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-slate-50">
              <img src={activeOrg.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 border border-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-indigo-600">
              <span className="text-white font-black text-lg">K</span>
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
              {activeOrg?.name || "Kairon Workspace"}
            </span>
            <h1 className="text-xl font-black tracking-tight text-slate-900 mt-0.5 uppercase">{program.title}</h1>
            {program.subtitle && (
              <p className="text-xs text-slate-600 font-medium mt-0.5">{program.subtitle}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Start: {minutesToTime(startMinutes)}</span>
              <span>•</span>
              <span>Total Sessions: {program.slots.length}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Date + QR Code */}
        <div className="flex flex-col items-end shrink-0 gap-2 text-right">
          <div className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
            {new Date(program.date).toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          {program.slug && (
            <div className="flex flex-col items-center gap-1">
              <div className="p-1 border border-slate-200 rounded-lg bg-white">
                <QRCode
                  value={publicPortalUrl}
                  size={48}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>
              <span className="text-[7px] font-black text-slate-400 tracking-widest uppercase">Scan for Live Rundown</span>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-1 w-20 font-bold text-xs">Time</th>
            <th className="py-1 font-bold text-xs">Session / Activity</th>
            <th className="py-1 w-24 font-bold text-xs">Duration</th>
          </tr>
        </thead>
        <tbody>
          {program.slots.map((slot) => {
            const currentStart = runningMinutes;
            runningMinutes += slot.durationMinutes;

            return (
              <tr key={slot.id} className="border-b border-gray-200 break-inside-avoid">
                <td className="py-1.5 align-top font-mono text-xs">
                  {minutesToTime(currentStart)}
                </td>
                <td className="py-1.5 align-top px-2">
                  <div className="font-bold text-sm text-slate-900">{slot.title}</div>
                  {includeSpeakers && slot.speaker && (
                    <div className="text-xs font-semibold text-gray-700 mt-0.5">{slot.speaker}</div>
                  )}
                  <div className="mt-0.5 inline-block px-1.5 py-0.5 border border-gray-300 rounded-full text-[9px] uppercase tracking-wide font-medium">
                    {slot.type}
                  </div>
                  {includeDetails && slot.details && (
                    <div className="text-xs text-gray-600 mt-1 leading-tight">
                      {slot.details}
                    </div>
                  )}
                  {includePrompter && slot.prompterText && (
                    <div className="text-xs text-indigo-700 mt-1 leading-tight border-l-2 border-indigo-200 pl-2 italic">
                      <span className="font-bold text-[9px] uppercase tracking-wider block text-slate-400 not-italic">Prompter Script:</span>
                      {slot.prompterText}
                    </div>
                  )}
                </td>
                <td className="py-1.5 align-top text-right font-mono text-xs">
                  {slot.durationMinutes} min
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-6 pt-2 border-t border-gray-300 text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
        Generated by Kairon
      </div>
    </div>
  );
};

export default PrintableSchedule;