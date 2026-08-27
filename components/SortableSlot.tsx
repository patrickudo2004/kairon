import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Slot, SLOT_PRESETS } from '../types';
import { Trash2, GripVertical, Copy, ChevronDown, ChevronUp, AlertCircle, Tv, MessageSquare, Clock } from 'lucide-react';

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
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col bg-[#121418] hover:bg-[#161920] border ${
        isDragging ? 'border-[#0EA5E9] shadow-2xl' : 'border-[#22262E] hover:border-[#2D333F]'
      } rounded-md transition-all duration-150 font-sans`}
    >
      {/* Main Row */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3">
        
        {/* Time Column */}
        <div className="md:w-20 flex flex-col items-center justify-center border-r border-[#22262E] pr-3 mr-1 pointer-events-none">
          <span className="text-[9px] font-mono font-bold text-[#6A7382] uppercase tracking-wider">Start</span>
          <span className="text-xs font-mono font-bold text-[#0EA5E9]">{getSlotStartTime(index)}</span>
        </div>

        {!isReadOnly && (
          <div 
            {...attributes} 
            {...listeners}
            className="text-[#6A7382] hover:text-white cursor-grab active:cursor-grabbing p-1.5 hover:bg-[#1E222A] rounded transition-colors touch-none"
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </div>
        )}

        <div className="flex-1 grid grid-cols-12 gap-3 w-full items-center">
          
          {/* Title & Expand Toggle */}
          <div className="col-span-12 md:col-span-8 xl:col-span-4 flex items-center gap-1.5">
            <button
              onClick={() => onToggleDetails(slot.id)}
              className="text-[#6A7382] hover:text-white transition-colors p-1.5 rounded hover:bg-[#1E222A]"
              title={isExpanded ? "Hide Details" : "Show Details"}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <input
              type="text"
              value={slot.title}
              readOnly={isReadOnly}
              onChange={(e) => onSlotChange(slot.id, 'title', e.target.value)}
              placeholder="Session Title"
              className={`w-full bg-transparent text-white font-semibold text-sm focus:outline-none focus:border-b border-[#0EA5E9] placeholder-[#4B5563] ${isReadOnly ? 'cursor-default' : ''}`}
            />
          </div>

          {/* Speaker */}
          <div className="col-span-12 md:col-span-4 xl:col-span-3">
            <input
              type="text"
              value={slot.speaker}
              readOnly={isReadOnly}
              onChange={(e) => onSlotChange(slot.id, 'speaker', e.target.value)}
              placeholder="Speaker Name"
              className={`w-full bg-transparent text-[#0EA5E9] font-mono text-xs focus:outline-none focus:border-b border-[#0EA5E9] placeholder-[#4B5563] ${isReadOnly ? 'cursor-default' : ''}`}
            />
          </div>

          {/* Duration Minutes */}
          <div className="col-span-6 md:col-span-6 xl:col-span-2">
            <div className="flex items-center gap-1 bg-[#090A0C] border border-[#22262E] rounded px-2 py-1">
              <Clock size={12} className="text-[#6A7382]" />
              <input
                type="number"
                min="1"
                value={slot.durationMinutes}
                readOnly={isReadOnly}
                onChange={(e) => onSlotChange(slot.id, 'durationMinutes', Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-transparent font-mono text-xs font-bold text-white text-right focus:outline-none"
              />
              <span className="text-[10px] font-mono text-[#6A7382]">min</span>
            </div>
          </div>

          {/* Type Preset */}
          <div className="col-span-6 md:col-span-6 xl:col-span-3 flex items-center justify-end gap-1.5">
            <input
              type="text"
              list="slot-types"
              value={slot.type}
              readOnly={isReadOnly}
              onChange={(e) => onSlotChange(slot.id, 'type', e.target.value)}
              placeholder="Type"
              className="bg-[#090A0C] border border-[#22262E] text-white text-xs font-mono rounded px-2 py-1 w-24 text-center focus:outline-none focus:border-[#0EA5E9]"
            />

            {!isReadOnly && (
              <div className="flex items-center gap-1 border-l border-[#22262E] pl-1.5">
                <button
                  onClick={() => onDuplicate(index)}
                  className="p-1 text-[#6A7382] hover:text-white hover:bg-[#1E222A] rounded transition-colors"
                  title="Duplicate slot"
                >
                  <Copy size={13} />
                </button>
                <button
                  onClick={() => onRemove(slot.id)}
                  className="p-1 text-[#6A7382] hover:text-[#EF4444] hover:bg-[#1E222A] rounded transition-colors"
                  title="Remove slot"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Expandable Production Notes & Cues Drawer */}
      {isExpanded && (
        <div className="p-3 bg-[#090A0C] border-t border-[#22262E] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono animate-in fade-in duration-150">
          <div>
            <label className="block text-[10px] font-bold text-[#8A93A4] uppercase mb-1 flex items-center gap-1.5">
              <MessageSquare size={11} className="text-[#0EA5E9]" />
              Production Cues (Lighting / Audio)
            </label>
            <textarea
              value={slot.productionNotes || ''}
              readOnly={isReadOnly}
              onChange={(e) => onSlotChange(slot.id, 'productionNotes', e.target.value)}
              placeholder="e.g. 'Spotlight on pulpit, mute band mics'"
              className="w-full h-16 bg-[#121418] border border-[#22262E] rounded p-2 text-xs text-white placeholder-[#4B5563] focus:outline-none focus:border-[#0EA5E9] resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8A93A4] uppercase mb-1 flex items-center gap-1.5">
              <Tv size={11} className="text-[#A855F7]" />
              Teleprompter Script / Outline
            </label>
            <textarea
              value={slot.prompterText || ''}
              readOnly={isReadOnly}
              onChange={(e) => onSlotChange(slot.id, 'prompterText', e.target.value)}
              placeholder="Enter teleprompter script / outline..."
              className="w-full h-16 bg-[#121418] border border-[#22262E] rounded p-2 text-xs text-white placeholder-[#4B5563] focus:outline-none focus:border-[#0EA5E9] resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
