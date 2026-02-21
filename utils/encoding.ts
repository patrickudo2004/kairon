import { Program, Slot } from '../types';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

/**
 * Minification logic for creating short URLs.
 * IMPORTANT: If you change these indexes, existing share links will break.
 */

const MINIFY_VERSION = 1;

/**
 * [version, id, title, subtitle, date, startTime, endTime, slots[]]
 */
export const minifyProgram = (p: Program): any[] => {
    return [
        MINIFY_VERSION,
        p.id,
        p.title,
        p.subtitle,
        p.date,
        p.startTime,
        p.endTime || '',
        p.slots.map(s => [
            s.id,
            s.title,
            s.speaker,
            s.durationMinutes,
            s.type,
            s.details || '',
            s.actualDuration || 0
        ])
    ];
};

export const expandProgram = (data: any[]): Program | null => {
    try {
        if (!data || !Array.isArray(data)) return null;
        const [version, id, title, subtitle, date, startTime, endTime, slotsRaw] = data;

        return {
            id,
            title,
            subtitle,
            date,
            startTime,
            endTime: endTime || undefined,
            slots: (slotsRaw || []).map((s: any[]) => ({
                id: s[0],
                title: s[1],
                speaker: s[2],
                durationMinutes: s[3],
                type: s[4],
                details: s[5] || undefined,
                actualDuration: s[6] || undefined
            }))
        };
    } catch (e) {
        console.error('Failed to expand program:', e);
        return null;
    }
};

/**
 * LZ-String Encoding/Decoding for share links
 */
export const encodeProgramData = (data: Program): string => {
    try {
        const minified = minifyProgram(data);
        return compressToEncodedURIComponent(JSON.stringify(minified));
    } catch (e) {
        console.error("Encoding failed", e);
        return '';
    }
};

export const decodeProgramData = (str: string): Program | null => {
    try {
        // 1. Try decompressing with LZString (New Format)
        let jsonStr = decompressFromEncodedURIComponent(str);

        // 2. Fallback: If null, it might be the old format (Base64)
        if (!jsonStr) {
            try {
                jsonStr = decodeURIComponent(escape(atob(str)));
            } catch (innerE) {
                console.warn("Legacy decoding failed", innerE);
                return null;
            }
        }

        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
            return expandProgram(parsed);
        }
        return parsed as Program;
    } catch (e) {
        console.error('Failed to decode program data:', e);
        return null;
    }
};
