export enum SlotType {
  TALK = 'TALK',
  BREAK = 'BREAK',
  KEYNOTE = 'KEYNOTE',
  PANEL = 'PANEL'
}

export interface Slot {
  id: string;
  title: string;
  speaker: string;
  durationMinutes: number;
  type: SlotType;
  actualDuration?: number; // For analytics
  details?: string; // Additional detailed description
}

export interface Program {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  startTime: string; // "HH:mm" 24h format
  endTime?: string; // "HH:mm" 24h format (Target end time)
  slots: Slot[];
}

export interface AnalyticsData {
  name: string;
  planned: number;
  actual: number;
}