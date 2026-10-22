import { Program, Slot } from '../types';
import { detectSlotType } from './rundownParser';

export interface KaironFileEnvelope {
  schema: 'kairon.rundown.v1';
  version: string;
  exportedAt: string;
  lastEdited: number;
  organizationName: string;
  program: {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    startTime: string;
    endTime?: string;
    isManualMode?: boolean;
    isPublic?: boolean;
    status?: 'draft' | 'live' | 'concluded' | 'archived';
    slots: Slot[];
  };
}

/**
 * Serializes a Kairon Program into a portable .kairon JSON bundle.
 */
export function serializeKaironFile(program: Program, organizationName: string = 'Kairon Workspace'): string {
  const envelope: KaironFileEnvelope = {
    schema: 'kairon.rundown.v1',
    version: '1.0.4',
    exportedAt: new Date().toISOString(),
    lastEdited: Date.now(),
    organizationName,
    program: {
      id: program.id,
      title: program.title || 'Untitled Event',
      subtitle: program.subtitle || '',
      date: program.date || new Date().toISOString().split('T')[0],
      startTime: program.startTime || '09:00',
      endTime: program.endTime || '',
      isManualMode: !!program.isManualMode,
      isPublic: program.isPublic ?? true,
      status: program.status || 'draft',
      slots: (program.slots || []).map((s) => ({
        id: s.id || crypto.randomUUID(),
        title: s.title,
        speaker: s.speaker || '',
        durationMinutes: Number(s.durationMinutes) || 5,
        type: s.type || 'Talk',
        details: s.details || '',
        productionNotes: s.productionNotes || '',
        prompterText: s.prompterText || '',
        actualDuration: s.actualDuration,
      })),
    },
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Parses and validates a .kairon file string, returning a normalized Program object.
 */
export function parseKaironFile(rawContent: string): {
  program: Program;
  organizationName?: string;
  lastEdited?: number;
} {
  const parsed = JSON.parse(rawContent);

  // Support both wrapped KaironFileEnvelope and direct Program JSON objects
  const rawProg = parsed.schema === 'kairon.rundown.v1' && parsed.program ? parsed.program : parsed;

  if (!rawProg || !Array.isArray(rawProg.slots)) {
    throw new Error('Invalid .kairon file: missing program schedule slots.');
  }

  const normalizedSlots: Slot[] = rawProg.slots.map((s: any, idx: number) => ({
    id: s.id || (crypto.randomUUID ? crypto.randomUUID() : `slot-${Date.now()}-${idx}`),
    title: String(s.title || `Slot ${idx + 1}`),
    speaker: String(s.speaker || ''),
    durationMinutes: Math.max(1, Number(s.durationMinutes) || 5),
    type: s.type || detectSlotType(String(s.title || ''), String(s.speaker || '')),
    details: s.details ? String(s.details) : undefined,
    productionNotes: s.productionNotes ? String(s.productionNotes) : undefined,
    prompterText: s.prompterText ? String(s.prompterText) : undefined,
    actualDuration: typeof s.actualDuration === 'number' ? s.actualDuration : undefined,
  }));

  const newUuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  const program: Program = {
    id: `local-${newUuid}`,
    slug: newUuid,
    title: String(rawProg.title || 'Imported Event'),
    subtitle: String(rawProg.subtitle || ''),
    date: String(rawProg.date || new Date().toISOString().split('T')[0]),
    startTime: String(rawProg.startTime || '09:00'),
    endTime: rawProg.endTime ? String(rawProg.endTime) : undefined,
    isManualMode: !!rawProg.isManualMode,
    isPublic: rawProg.isPublic ?? true,
    status: 'draft',
    slots: normalizedSlots,
  };

  return {
    program,
    organizationName: parsed.organizationName,
    lastEdited: parsed.lastEdited,
  };
}

/**
 * Builds a clean filename for a .kairon or .csv export.
 */
export function getSafeKaironFilename(program: Program, ext: 'kairon' | 'csv' = 'kairon'): string {
  const safeTitle = (program.title || 'kairon-rundown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const datePart = program.date || new Date().toISOString().split('T')[0];
  return `${datePart}-${safeTitle || 'rundown'}.${ext}`;
}

/**
 * Saves a .kairon file via Electron native dialog (if running in Desktop App)
 * or triggers a browser file download.
 */
export async function saveKaironFileToDisk(
  program: Program,
  organizationName: string = 'Kairon Workspace'
): Promise<{ saved: boolean; filePath?: string }> {
  const content = serializeKaironFile(program, organizationName);
  const fileName = getSafeKaironFilename(program, 'kairon');

  const electronApi = typeof window !== 'undefined' ? (window as any).electron : null;
  if (electronApi?.isElectron && typeof electronApi.saveKaironFile === 'function') {
    const res = await electronApi.saveKaironFile({
      content,
      defaultFileName: fileName,
      organizationName,
      date: program.date,
    });
    return { saved: !!res?.success, filePath: res?.filePath };
  }

  // Browser fallback download
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { saved: true, filePath: fileName };
}

/**
 * Automatically archives the active program to Documents/Kairon/Workspaces/<Org>/<Year>/<Month>/
 * when running inside the Electron Desktop App.
 */
export async function autoArchiveToLocalWorkspace(
  program: Program,
  organizationName: string = 'Winners Chapel Manchester'
): Promise<string | null> {
  const electronApi = typeof window !== 'undefined' ? (window as any).electron : null;
  if (!electronApi?.isElectron || typeof electronApi.autoArchiveKaironFile !== 'function') {
    return null;
  }
  try {
    const content = serializeKaironFile(program, organizationName);
    const fileName = getSafeKaironFilename(program, 'kairon');
    const res = await electronApi.autoArchiveKaironFile({
      content,
      fileName,
      organizationName,
      date: program.date || new Date().toISOString().split('T')[0],
    });
    return res?.success ? res.filePath : null;
  } catch (err) {
    console.warn('Auto-archive to local workspace failed:', err);
    return null;
  }
}

/**
 * Exports a Program's slots to RFC-4180 CSV format for Excel / Google Sheets.
 */
export function serializeProgramToCsv(program: Program): string {
  const headers = [
    'Slot #',
    'Title',
    'Speaker',
    'Duration (Mins)',
    'Category',
    'Details / Scripture',
    'Crew Cues (Audio / Lighting / Video)',
    'Teleprompter Script',
  ];

  const escapeCsvCell = (val: string | number | undefined): string => {
    const str = String(val ?? '');
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = (program.slots || []).map((slot, index) =>
    [
      index + 1,
      slot.title,
      slot.speaker,
      slot.durationMinutes,
      slot.type,
      slot.details || '',
      slot.productionNotes || '',
      slot.prompterText || '',
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
}

export function downloadProgramCsv(program: Program): void {
  const csv = serializeProgramToCsv(program);
  const fileName = getSafeKaironFilename(program, 'csv');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses CSV content into Kairon Slots.
 */
export function parseCsvToSlots(csvContent: string): Slot[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const parseCsvRow = (row: string): string[] => {
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  };

  const firstRow = parseCsvRow(lines[0]).map((h) => h.toLowerCase());
  const hasHeader =
    firstRow.some((h) => h.includes('title') || h.includes('item') || h.includes('duration') || h.includes('speaker'));

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const slots: Slot[] = [];

  dataLines.forEach((line, idx) => {
    const cols = parseCsvRow(line);
    if (cols.length < 2) return;

    // Detect if col 0 is just a row number (e.g. "1", "2")
    const isFirstColIndex = /^\d+$/.test(cols[0]) && cols.length >= 3;
    const offset = isFirstColIndex ? 1 : 0;

    const title = cols[offset] || `Slot ${idx + 1}`;
    const speaker = cols[offset + 1] || '';
    const rawDuration = cols[offset + 2] || '10';
    const durationMinutes = Math.max(1, parseInt(rawDuration.replace(/[^0-9]/g, ''), 10) || 10);
    const type = cols[offset + 3] || detectSlotType(title, speaker);
    const details = cols[offset + 4] || undefined;
    const productionNotes = cols[offset + 5] || undefined;
    const prompterText = cols[offset + 6] || undefined;

    slots.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `slot-${Date.now()}-${idx}`,
      title,
      speaker,
      durationMinutes,
      type,
      details,
      productionNotes,
      prompterText,
    });
  });

  return slots;
}
