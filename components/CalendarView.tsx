import React, { useState } from 'react';
import { Program, SlotType } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Clock, ArrowRight, Lock, Trash2, Copy } from 'lucide-react';

interface CalendarViewProps {
  programs: Program[];
  activeProgramId: string;
  onSelectProgram: (program: Program) => void;
  onCreateProgram: (date: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  programs, 
  activeProgramId, 
  onSelectProgram, 
  onCreateProgram,
  onDelete,
  onDuplicate
}) => {
  // Initialize with local date string to match grid generation
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Data helpers
  const getProgramsForDate = (dateStr: string) => programs.filter(p => p.date === dateStr);
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      onDelete(id);
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(id);
  };

  const selectedPrograms = getProgramsForDate(selectedDate);
  const isPastDate = selectedDate < todayStr;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarIcon className="text-indigo-600 dark:text-indigo-400" />
            Calendar
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Manage past and future schedules</p>
        </div>
        <button 
          onClick={() => !isPastDate && onCreateProgram(selectedDate)}
          disabled={isPastDate}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-lg ${
            isPastDate 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
          }`}
          title={isPastDate ? "Cannot create events in the past" : "Create new event"}
        >
          {isPastDate ? <Lock size={18} /> : <Plus size={18} />}
          New Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Calendar Grid */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{monthNames[month]} {year}</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasProgram = programs.some(p => p.date === dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === todayStr;
              const isDatePast = dateStr < todayStr;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`
                    relative h-10 w-10 md:h-12 md:w-full rounded-xl flex items-center justify-center text-sm font-medium transition-all
                    ${isSelected 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }
                    ${isToday && !isSelected ? 'border border-indigo-500/50 text-indigo-600 dark:text-indigo-400' : ''}
                    ${isDatePast && !isSelected ? 'opacity-40' : ''}
                  `}
                >
                  {day}
                  {hasProgram && (
                    <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
             <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
               {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
             </h4>

             {selectedPrograms.length === 0 ? (
               <div className="text-center py-8 text-slate-500">
                 <p className="mb-4">No events scheduled.</p>
                 {!isPastDate ? (
                   <button 
                      onClick={() => onCreateProgram(selectedDate)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-sm font-medium hover:underline"
                   >
                     Create Program
                   </button>
                 ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-600 italic">Past dates cannot be edited</span>
                 )}
               </div>
             ) : (
               <div className="space-y-3">
                 {selectedPrograms.map(prog => (
                   <div 
                     key={prog.id}
                     onClick={() => onSelectProgram(prog)}
                     className={`
                       p-4 rounded-xl border cursor-pointer transition-all group relative
                       ${prog.id === activeProgramId 
                         ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500/50' 
                         : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                       }
                     `}
                   >
                     <div className="flex justify-between items-start mb-2 pr-16">
                       <h5 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                         {prog.title}
                       </h5>
                       {prog.id === activeProgramId && (
                         <span className="text-[10px] bg-indigo-600 dark:bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold absolute top-4 right-4">
                           ACTIVE
                         </span>
                       )}
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">{prog.subtitle}</p>
                     
                     <div className="flex items-center justify-between text-xs text-slate-500">
                       <div className="flex items-center gap-1">
                         <Clock size={12} />
                         {prog.startTime}
                         {prog.endTime && ` - ${prog.endTime}`}
                       </div>
                       <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-indigo-600 dark:text-indigo-400">
                         Open <ArrowRight size={12} />
                       </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => handleDuplicate(prog.id, e)}
                            className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Duplicate Program"
                        >
                            <Copy size={14} />
                        </button>
                        <button 
                            onClick={(e) => handleDelete(prog.id, prog.title, e)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                            title="Delete Program"
                        >
                            <Trash2 size={14} />
                        </button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarView;