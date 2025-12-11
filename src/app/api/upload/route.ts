// app/api/upload/route.ts - API route for saving uploaded video with thumbnail generation
// Supports both local storage (development) and R2 (production)

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { uploadFile, getStorageMode } from '@/src/lib/storage-adapter';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const video = formData.get('video') as File;
    const title = formData.get('title') as string | null;

    if (!video) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`[Upload] Using ${getStorageMode()} storage mode`);

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

    // Upload video using storage adapter
    const videoKey = `videos/${fileName}`;
    const videoUrl = await uploadFile(buffer, videoKey, video.type);

    // Generate thumbnail
    let thumbnailUrl = '';
    try {
      // Extract frame at 2 seconds (avoids black intros), scale to 480px width for lists
      const thumbnailCommand = `ffmpeg -i "${tempVideo}" -ss 00:00:02 -vframes 1 -vf "scale=480:-1" -q:v 2 "${tempThumbnail}"`;
      await execAsync(thumbnailCommand);

      // Upload thumbnail using storage adapter
      const thumbnailBuffer = await fs.readFile(tempThumbnail);
      const thumbnailKey = `thumbnails/${thumbnailFileName}`;
      thumbnailUrl = await uploadFile(thumbnailBuffer, thumbnailKey, 'image/jpeg');
    } catch (thumbnailError: unknown) {
      console.warn('Thumbnail generation failed, continuing without thumbnail:', thumbnailError);
    }

    // Clean up temp files
    await fs.unlink(tempVideo).catch(() => { });
    await fs.unlink(tempThumbnail).catch(() => { });

    return NextResponse.json({
      message: 'File uploaded successfully!',
      path: videoUrl,
      thumbnailPath: thumbnailUrl || '',
      storageMode: getStorageMode(),
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({
      error: 'File upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

