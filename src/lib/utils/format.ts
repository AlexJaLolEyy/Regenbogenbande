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
