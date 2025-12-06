import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { uploadToR2, getSignedR2Url, getPublicR2Url } from '@/src/lib/r2-client';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const video = formData.get('video') as File;
    const title = formData.get('title') as string | null;

    if (!video) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tempDir, { recursive: true });

    // Generate unique filename
    const sanitizeFilename = (name: string) => {
      return name
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
        .substring(0, 100);
    };

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const uniqueId = `${timestamp}-${randomId}`;

    const baseName = title && title.trim() 
      ? sanitizeFilename(title.trim())
      : video.name.replace(/\.[^/.]+$/, '');
    
    const extension = path.extname(video.name);
    const fileName = `${baseName}-${uniqueId}${extension}`;
    const thumbnailFileName = `${baseName}-${uniqueId}.jpg`;

    // Save original file temporarily
    const buffer = Buffer.from(await video.arrayBuffer());
    const tempInput = path.join(tempDir, `input-${uniqueId}${extension}`);
    const tempOutput = path.join(tempDir, `output-${uniqueId}${extension}`);
    const tempThumbnail = path.join(tempDir, `thumb-${uniqueId}.jpg`);

    await fs.writeFile(tempInput, buffer);
    const originalSize = buffer.length;

    // FFmpeg compression command
    // CRF 26 for good quality/size balance, scale to max 1080p, 60fps, AAC audio
    const ffmpegCommand = `
      ffmpeg -i "${tempInput}" \
        -c:v libx264 \
        -preset medium \
        -crf 26 \
        -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
        -r 60 \
        -c:a aac \
        -b:a 128k \
        -movflags +faststart \
        -y \
        "${tempOutput}"
    `.replace(/\s+/g, ' ').trim();

    try {
      await execAsync(ffmpegCommand);
    } catch (ffmpegError: unknown) {
      // Clean up temp files
      await fs.unlink(tempInput).catch(() => {});
      await fs.unlink(tempOutput).catch(() => {});
      
      const errorMessage = ffmpegError instanceof Error ? ffmpegError.message : 'Unknown FFmpeg error';
      console.error('FFmpeg compression error:', errorMessage);
      return NextResponse.json(
        { error: 'Video compression failed', details: errorMessage },
        { status: 500 }
      );
    }

    // Generate thumbnail from compressed video
    const thumbnailCommand = `ffmpeg -i "${tempOutput}" -ss 00:00:01 -vframes 1 -vf "scale=640:-1" -q:v 2 "${tempThumbnail}"`;
    
    try {
      await execAsync(thumbnailCommand);
    } catch (thumbnailError: unknown) {
      console.warn('Thumbnail generation failed, continuing without thumbnail:', thumbnailError);
    }

    // Read compressed video
    const compressedBuffer = await fs.readFile(tempOutput);
    const finalSize = compressedBuffer.length;

    // Upload compressed video to R2
    const videoKey = `videos/${fileName}`;
    await uploadToR2(compressedBuffer, videoKey, video.type);

    // Generate video URL (signed for private buckets, public for public buckets)
    // Using 7 days expiration for signed URLs (604800 seconds)
    const videoUrl = process.env.R2_PUBLIC_URL
      ? getPublicR2Url(videoKey)
      : await getSignedR2Url(videoKey, 604800); // 7 days for videos

    // Upload thumbnail if it was generated
    let thumbnailUrl = '';
    try {
      const thumbnailBuffer = await fs.readFile(tempThumbnail);
      const thumbnailKey = `thumbnails/${thumbnailFileName}`;
      await uploadToR2(thumbnailBuffer, thumbnailKey, 'image/jpeg');

      // Generate thumbnail URL
      thumbnailUrl = process.env.R2_PUBLIC_URL
        ? getPublicR2Url(thumbnailKey)
        : await getSignedR2Url(thumbnailKey, 604800); // 7 days
    } catch {
      // Thumbnail generation failed, leave empty
    }

    // Clean up temp files
    await fs.unlink(tempInput).catch(() => {});
    await fs.unlink(tempOutput).catch(() => {});
    await fs.unlink(tempThumbnail).catch(() => {});

    // Calculate size reduction
    const sizeReduction = ((1 - finalSize / originalSize) * 100).toFixed(1);

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return NextResponse.json({
      message: 'Video compressed successfully!',
      path: videoUrl, // R2 URL (signed or public)
      thumbnailPath: thumbnailUrl, // R2 URL or empty
      originalSize: formatFileSize(originalSize),
      finalSize: formatFileSize(finalSize),
      sizeReduction: `${sizeReduction}%`,
    });
  } catch (error) {
    console.error('Video compression error:', error);
    return NextResponse.json(
      { error: 'Video compression failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

