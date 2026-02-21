// Consolidated Time Utilities
// Supports both 24h internal format and 12h display format

/**
 * Converts "HH:mm" to total minutes
 */
export const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return (h * 60) + m;
};

/**
 * Converts total minutes to "HH:mm AM/PM" or "HH:mm"
 */
export const minutesToTime = (minutes: number, format: '12h' | '24h' = '12h'): string => {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;

    if (format === '24h') {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Formats seconds into MM:SS (used by timers)
 */
export const formatDuration = (seconds: number): string => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    return `${isNegative ? '-' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
