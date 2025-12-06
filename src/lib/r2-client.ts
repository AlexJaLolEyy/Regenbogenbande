import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// R2 Client configuration
// Trim whitespace from env vars to handle quotes/spaces
const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error('R2 Configuration Error: Missing required environment variables');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

/**
 * Upload a file to R2
 * @param buffer - File buffer
 * @param key - File path/key in R2 (e.g., "videos/my-video.mp4")
 * @param contentType - MIME type (e.g., "video/mp4", "image/jpeg")
 * @returns The key/path of the uploaded file
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const bucketName = process.env.R2_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME environment variable is not set');
  }

  try {
    // Trim whitespace from bucket name (in case of quotes or spaces)
    const trimmedBucket = bucketName.trim();
    
    await r2Client.send(
      new PutObjectCommand({
        Bucket: trimmedBucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return key;
  } catch (error) {
    // Provide more helpful error messages
    if (error instanceof Error) {
      const accountId = process.env.R2_ACCOUNT_ID?.trim() || '';
      const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || '';
      
      console.error('R2 Upload Error:', {
        message: error.message,
        bucket: bucketName.trim(),
        key: key,
        accountId: accountId ? `${accountId.substring(0, 4)}...` : 'missing',
        accessKeyId: accessKeyId ? `${accessKeyId.substring(0, 4)}...` : 'missing',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        bucketLength: bucketName.trim().length,
      });
    }
    throw error;
  }
}

/**
 * Generate a signed URL for a private R2 object
 * Signed URLs are temporary and expire after the specified time
 * @param key - File path/key in R2
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL that can be used to access the file
 */
export async function getSignedR2Url(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });

  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Generate a public URL (if bucket is public)
 * For private buckets, use getSignedR2Url instead
 * @param key - File path/key in R2
 * @returns Public URL (only works if bucket is public)
 */
export function getPublicR2Url(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  
  if (publicUrl) {
    // Custom domain or public R2 URL
    return `${publicUrl.replace(/\/$/, '')}/${key}`;
  }
  
  // Default R2 public URL format (if bucket is public)
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${key}`;
}

