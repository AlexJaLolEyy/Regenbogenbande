/**
 * Storage Adapter - Unified interface for local and R2 storage
 * 
 * Set USE_LOCAL_STORAGE=true in .env for local development
 * Set USE_LOCAL_STORAGE=false (or omit) for R2 cloud storage
 */

import { promises as fs } from 'fs';
import path from 'path';
import { uploadToR2, getPublicR2Url, deleteFromR2 } from './r2-client';

// Check if we should use local storage (for development)
const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === 'true';

// Local storage directory (relative to project root, served by Next.js)
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Upload a file to storage (local or R2)
 * @param buffer - File buffer
 * @param key - File path/key (e.g., "videos/my-video.mp4")
 * @param contentType - MIME type (e.g., "video/mp4")
 * @returns URL to access the file
 */
export async function uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string
): Promise<string> {
    if (USE_LOCAL_STORAGE) {
        return uploadToLocal(buffer, key);
    } else {
        await uploadToR2(buffer, key, contentType);
        return getFileUrl(key);
    }
}

/**
 * Delete a file from storage (local or R2)
 * @param key - File path/key (e.g., "videos/my-video.mp4")
 */
export async function deleteFile(key: string): Promise<void> {
    if (USE_LOCAL_STORAGE) {
        return deleteFromLocal(key);
    } else {
        return deleteFromR2(key);
    }
}

/**
 * Get the URL for a file
 * @param key - File path/key in storage
 * @returns Public URL to access the file
 */
export function getFileUrl(key: string): string {
    if (USE_LOCAL_STORAGE) {
        // Local files are served from /uploads/
        return `/uploads/${key}`;
    } else {
        // R2 public URL
        return getPublicR2Url(key);
    }
}

/**
 * Upload file to local filesystem
 */
async function uploadToLocal(buffer: Buffer, key: string): Promise<string> {
    const filePath = path.join(LOCAL_UPLOAD_DIR, key);
    const dir = path.dirname(filePath);

    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    // Return local URL
    return `/uploads/${key}`;
}

/**
 * Delete file from local filesystem
 */
async function deleteFromLocal(key: string): Promise<void> {
    const filePath = path.join(LOCAL_UPLOAD_DIR, key);
    try {
        await fs.unlink(filePath);
    } catch (error) {
        // Ignore error if file doesn't exist, otherwise throw
        const typedError = error as NodeJS.ErrnoException;
        if (typedError.code !== 'ENOENT') {
            console.error('Error deleting local file:', error);
            throw error;
        }
    }
}

/**
 * Check if using local storage mode
 */
export function isLocalStorageMode(): boolean {
    return USE_LOCAL_STORAGE;
}

/**
 * Get storage mode for logging/debugging
 */
export function getStorageMode(): 'local' | 'r2' {
    return USE_LOCAL_STORAGE ? 'local' : 'r2';
}
