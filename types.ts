// Common presets for the UI, but user can type anything
export const SLOT_PRESETS = [
  'Talk',
  'Break',
  'Keynote',
  'Panel',
  'Worship',
  'Sermon',
  'Music'
] as const;

export type SlotType = string;


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
  organizationId?: string;
  slots: Slot[];
  // Timer State (Persisted in DB)
  currentSlotIndex?: number;
  isTimerActive?: boolean;
  timerStartTimestamp?: number | null;
  secondsElapsed?: number;
}

export interface AnalyticsData {
  name: string;
  planned: number;
  actual: number;
}

// Phase 1: Identity & Organizations
export type UserRole = 'admin' | 'manager' | 'operator';

export interface Profile {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  themeColors?: {
    primary: string;
    secondary: string;
  };
  createdBy: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
}