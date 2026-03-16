import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Slot, SLOT_PRESETS } from '../types';
import { Trash2, GripVertical, Copy, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface SortableSlotProps {
  slot: Slot;
  index: number;
  isReadOnly: boolean;
  isExpanded: boolean;
  onToggleDetails: (id: string) => void;
  onSlotChange: (id: string, field: keyof Slot, value: any) => void;
  onDuplicate: (index: number) => void;
  onRemove: (id: string) => void;
  getSlotStartTime: (index: number) => string;
}

export const SortableSlot: React.FC<SortableSlotProps> = ({
  slot,
  index,
  isReadOnly,
  isExpanded,
  onToggleDetails,
  onSlotChange,
  onDuplicate,
  onRemove,
  getSlotStartTime
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slot.id, disabled: isReadOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border ${isDragging ? 'border-indigo-500 shadow-2xl' : 'border-slate-200 dark:border-slate-700'} rounded-2xl transition-all duration-200`}
    >
      {/* Main Row */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-4">
        
        {/* Time Column */}
        <div className="md:w-24 flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-700 pr-4 mr-2 pointer-events-none">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Start</span>
          <span className="text-sm font-mono font-black text-slate-900 dark:text-indigo-400">{getSlotStartTime(index)}</span>
        </div>

        {!isReadOnly && (
          <div 
            {...attributes} 
            {...listeners}
            className="text-slate-400 dark:text-slate-600 cursor-grab active:cursor-grabbing p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors md:p-2 touch-none"
          >
            <GripVertical size={24} className="md:w-5 md:h-5" />
          </div>
        )}

        <div className="flex-1 grid grid-cols-12 gap-4 w-full items-center">
          <div className="col-span-12 md:col-span-4 flex items-center gap-2">
            <button
              onClick={() => onToggleDetails(slot.id)}
              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
              title={isExpanded ? "Hide Details" : "Show Details"}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <input
              type="text"
              value={slot.title}
              readOnly={isReadOnly}
              onChange={(e) => onSlotChange(slot.id, 'title', e.target.value)}
              placeholder="Session Title"
              className={`w-full bg-transparent text-slate-900 dark:text-white font-bold text-lg md:text-base focus:underline outline-none placeholder-slate-400 dark:placeholder-slate-600 min-h-[44px] ${isReadOnly ? 'cursor-default' : ''}`}
            />
          </div>
          <div className="col-span-12 md:col-span-3">
            <input
              type="text"
              value={slot.speaker}
              readOnly={isReadOnly}
              onChange={(e) => onSlotChange(slot.id, 'speaker', e.target.value)}
              placeholder="Speaker Name"
              className={`w-full bg-transparent text-indigo-600 dark:text-indigo-300 text-sm font-medium focus:underline outline-none placeholder-slate-400 dark:placeholder-slate-600 min-h-[44px] ${isReadOnly ? 'cursor-default' : ''}`}
            />
          </div>
          <div className="col-span-6 md:col-span-2">
            <input
              list="slot-types"
              type="text"
              value={slot.type}
              readOnly={isReadOnly}
              onChange={(e) => onSlotChange(slot.id, 'type', e.target.value)}
              className={`w-full bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-800 outline-none min-h-[44px] transition-colors focus:border-indigo-500 ${isReadOnly ? 'cursor-default opacity-80' : ''}`}
              placeholder="Type..."
            />
          </div>
          <div className="col-span-6 md:col-span-2 flex items-center gap-2 justify-end">
            <input
              type="number"
              value={slot.durationMinutes}
              readOnly={isReadOnly}
              onChange={(e) => onSlotChange(slot.id, 'durationMinutes', parseInt(e.target.value) || 0)}
              className={`w-16 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm font-bold rounded-xl px-2 py-2 border border-slate-200 dark:border-slate-800 outline-none text-center focus:ring-2 focus:ring-indigo-500 min-h-[44px] transition-all ${isReadOnly ? 'cursor-default' : ''}`}
            />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter w-6">MIN</span>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex items-center border-l border-slate-200 dark:border-slate-700 pl-2 ml-2 gap-1">
            <button
              onClick={() => onDuplicate(index)}
              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
              title="Duplicate Slot"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={() => onRemove(slot.id)}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
              title="Remove Slot"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Details Section (Collapsible) */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
          <div className="pl-0 md:pl-32 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Public Details / Abstract</label>
              <textarea
                value={slot.details || ''}
                readOnly={isReadOnly}
                onChange={(e) => onSlotChange(slot.id, 'details', e.target.value)}
                placeholder="Include key points or session description for attendees..."
                className={`w-full h-28 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-300 font-medium placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none transition-all ${isReadOnly ? 'cursor-default' : ''}`}
              />
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[10px] font-black text-amber-500 uppercase mb-2 tracking-widest flex items-center gap-1.5">
                <AlertCircle size={12} /> Internal Stage Cues (Crew Only)
              </label>
              <textarea
                value={slot.productionNotes || ''}
                readOnly={isReadOnly}
                onChange={(e) => onSlotChange(slot.id, 'productionNotes', e.target.value)}
                placeholder="Stage directions, lighting cues, or camera notes..."
                className={`w-full h-24 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] border border-amber-500/20 dark:border-amber-500/10 rounded-2xl p-4 text-sm text-slate-800 dark:text-amber-100/90 font-medium placeholder-amber-900/30 dark:placeholder-amber-400/20 focus:ring-2 focus:ring-amber-500/30 outline-none resize-none transition-all ${isReadOnly ? 'cursor-default' : ''}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
