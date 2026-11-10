// Simplified storage-adapter.ts for R2-only storage
import { deleteFromR2, getPublicR2Url, uploadToR2 } from './r2-client';

/**
 * Upload a file to R2 storage
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
  await uploadToR2(buffer, key, contentType);
  return getPublicR2Url(key);
}

/**
 * Delete a file from R2 storage
 * @param key - File path/key (e.g., "videos/my-video.mp4")
 */
export async function deleteFile(key: string): Promise<void> {
  return deleteFromR2(key);
}

/**
 * Convert a public R2 URL back into its storage key.
 * Returns null for URLs that don't belong to our public bucket (never delete those).
 */
export function extractStorageKey(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
  if (!base || !url.startsWith(`${base}/`)) return null;
  const key = decodeURIComponent(url.slice(base.length + 1).split(/[?#]/)[0]);
  return key || null;
}

/** Throws unless the URL points into our public bucket (empty is allowed only if `optional`). */
export function assertOwnStorageUrl(url: string | null | undefined, optional = false): void {
  if (!url) {
    if (optional) return;
    throw new Error('Missing file URL');
  }
  if (!extractStorageKey(url)) throw new Error('Invalid file URL');
}

/**
 * Get the URL for a file in R2 storage
 * @param key - File path/key in storage
 * @returns Public URL to access the file
 */
export function getFileUrl(key: string): string {
  return getPublicR2Url(key);
}
