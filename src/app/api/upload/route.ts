// app/api/upload/route.ts - API route for saving uploaded video with thumbnail generation to R2

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

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tempDir, { recursive: true });

    // Save video buffer
    const buffer = Buffer.from(await video.arrayBuffer());

    // Generate thumbnail using FFmpeg (need temp file for FFmpeg)
    const tempVideo = path.join(tempDir, `temp-${uniqueId}${extension}`);
    const tempThumbnail = path.join(tempDir, `thumb-${uniqueId}.jpg`);
    
    // Save temp copy for thumbnail extraction
    await fs.writeFile(tempVideo, buffer);

    // Upload video to R2
    const videoKey = `videos/${fileName}`;
    await uploadToR2(buffer, videoKey, video.type);

    // Generate video URL (signed for private buckets, public for public buckets)
    // Using 7 days expiration for signed URLs (604800 seconds)
    const videoUrl = process.env.R2_PUBLIC_URL 
      ? getPublicR2Url(videoKey)
      : await getSignedR2Url(videoKey, 604800); // 7 days for videos

    // Generate thumbnail
    let thumbnailUrl = '';
    let thumbnailKey = '';
    try {
      // Extract frame at 1 second, scale to 640px width
      const thumbnailCommand = `ffmpeg -i "${tempVideo}" -ss 00:00:01 -vframes 1 -vf "scale=640:-1" -q:v 2 "${tempThumbnail}"`;
      await execAsync(thumbnailCommand);

      // Upload thumbnail to R2
      const thumbnailBuffer = await fs.readFile(tempThumbnail);
      thumbnailKey = `thumbnails/${thumbnailFileName}`;
      await uploadToR2(thumbnailBuffer, thumbnailKey, 'image/jpeg');

      // Generate thumbnail URL
      thumbnailUrl = process.env.R2_PUBLIC_URL
        ? getPublicR2Url(thumbnailKey)
        : await getSignedR2Url(thumbnailKey, 604800); // 7 days
    } catch (thumbnailError: unknown) {
      console.warn('Thumbnail generation failed, continuing without thumbnail:', thumbnailError);
    }

    // Clean up temp files
    await fs.unlink(tempVideo).catch(() => {});
    await fs.unlink(tempThumbnail).catch(() => {});

    return NextResponse.json({ 
      message: 'File uploaded successfully!',
      path: videoUrl, // R2 URL (signed or public)
      thumbnailPath: thumbnailUrl || '', // R2 URL or empty
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      error: 'File upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
