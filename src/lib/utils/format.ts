/**
 * Formats a byte size into a human-readable string (KB, MB, GB, etc.)
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats seconds into a human-readable duration (HH:MM:SS or MM:SS)
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats a date for display in lists and views. Always de-DE so every
 * content type renders dates identically.
 */
export function formatDate(date: Date | string | number): string {
    return new Date(date).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
];

/**
 * "3 days ago" for up to 30 days, absolute date afterwards.
 * Pair with `title={formatDate(date)}` to show the absolute date in a tooltip.
 */
export function relativeDate(date: Date | string | number): string {
    const time = new Date(date).getTime();
    const diff = time - Date.now();
    const abs = Math.abs(diff);
    if (abs > 30 * 86_400_000) return formatDate(date);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    for (const [unit, ms] of RELATIVE_UNITS) {
        if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
    }
    return 'just now';
}

/** True when the date is less than `days` days old. */
export function isRecent(date: Date | string | number, days = 7): boolean {
    return Date.now() - new Date(date).getTime() < days * 86_400_000;
}
