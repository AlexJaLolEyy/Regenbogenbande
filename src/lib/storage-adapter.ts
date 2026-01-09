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
 * Get the URL for a file in R2 storage
 * @param key - File path/key in storage
 * @returns Public URL to access the file
 */
export function getFileUrl(key: string): string {
  return getPublicR2Url(key);
}
