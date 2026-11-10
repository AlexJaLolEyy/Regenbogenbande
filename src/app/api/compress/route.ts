// app/api/compress/route.ts - Adaptive video compression with smart fallback
// Default: CRF 24, falls back to CRF 26 if needed
// Quality Mode: CRF 20 for high-detail content
// Preserves source FPS (caps at 60), generates thumbnail

import { guardApi } from '@/src/lib/api-auth';
import { uploadFile } from '@/src/lib/storage-adapter';
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.mkv']);

// Compression settings
const DEFAULT_CRF = 24;
const FALLBACK_CRF = 26;
const QUALITY_CRF = 20;
const TARGET_SIZE_MB = 60;
const MAX_UPLOAD_MB = 500;

// Helper function to compress with specific CRF
async function compressWithCRF(
  inputPath: string,
  outputPath: string,
  crf: number
): Promise<{ buffer: Buffer; size: number }> {
  // Get source FPS and cap at 60
  let capFps = false;
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      '-show_entries', 'stream=r_frame_rate',
      inputPath,
    ]);
    const [num, den] = stdout.trim().split('/').map(Number);
    const sourceFps = den ? num / den : 60;
    capFps = sourceFps > 60;
  } catch {
    // If probe fails, don't set FPS filter
  }

  await execFileAsync('ffmpeg', [
    '-i', inputPath,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', String(crf),
    '-vf', "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
    ...(capFps ? ['-r', '60'] : []),
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y',
    outputPath,
  ]);
  const compressedBuffer = await fs.readFile(outputPath);
  return { buffer: compressedBuffer, size: compressedBuffer.length };
}

export async function POST(req: Request) {
  const guard = await guardApi('member');
  if (guard.response) return guard.response;

  try {
    const formData = await req.formData();
    const video = formData.get('video') as File;
    const title = formData.get('title') as string | null;
    const qualityMode = formData.get('qualityMode') === 'true';

    if (!(video instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const extension = path.extname(video.name).toLowerCase() || '.mp4';
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: 'Unsupported video format' }, { status: 400 });
    }

    const originalSize = video.size;
    const originalSizeMB = originalSize / (1024 * 1024);

    // Reject files that are too large
    if (originalSizeMB > MAX_UPLOAD_MB) {
      return NextResponse.json({
        error: `File too large (${originalSizeMB.toFixed(1)} MB). Maximum allowed is ${MAX_UPLOAD_MB} MB.`,
      }, { status: 400 });
    }

    console.log(`[Compress] Using R2 storage mode, Quality mode: ${qualityMode}`);

    // Create temp directory
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

    const uniqueId = crypto.randomUUID();

    const baseName = title && title.trim()
      ? sanitizeFilename(title.trim())
      : video.name.replace(/\.[^/.]+$/, '');

    const fileName = `${baseName}-${uniqueId}${extension}`;
    const thumbnailFileName = `${baseName}-${uniqueId}.jpg`;

    // Save original file temporarily
    const buffer = Buffer.from(await video.arrayBuffer());
    const tempInput = path.join(tempDir, `input-${uniqueId}${extension}`);
    const tempOutput = path.join(tempDir, `output-${uniqueId}${extension}`);
    const tempThumbnail = path.join(tempDir, `thumb-${uniqueId}.jpg`);

    await fs.writeFile(tempInput, buffer);

    // Track compression attempts
    const attempts: Array<{
      crf: number | 'original';
      size: number;
      sizeMB: number;
      reduction: number;
      status: string;
    }> = [];

    let finalBuffer: Buffer;
    let finalCRF: number | 'original';
    let usedMethod: string;

    if (qualityMode) {
      // Quality mode: Use CRF 20, no fallback
      console.log(`[Compress] Quality mode - using CRF ${QUALITY_CRF}`);
      const result = await compressWithCRF(tempInput, tempOutput, QUALITY_CRF);

      attempts.push({
        crf: QUALITY_CRF,
        size: result.size,
        sizeMB: result.size / (1024 * 1024),
        reduction: ((1 - result.size / originalSize) * 100),
        status: result.size > originalSize ? 'inflated' : 'success',
      });

      if (result.size > originalSize) {
        // Quality mode but inflated - use original
        finalBuffer = buffer;
        finalCRF = 'original';
        usedMethod = `Quality CRF ${QUALITY_CRF} inflated → using original`;
      } else {
        finalBuffer = result.buffer;
        finalCRF = QUALITY_CRF;
        usedMethod = `Quality CRF ${QUALITY_CRF}`;
      }
    } else {
      // Standard mode: Try CRF 24 first
      console.log(`[Compress] Trying CRF ${DEFAULT_CRF}`);
      const firstResult = await compressWithCRF(tempInput, tempOutput, DEFAULT_CRF);
      const firstSizeMB = firstResult.size / (1024 * 1024);

      attempts.push({
        crf: DEFAULT_CRF,
        size: firstResult.size,
        sizeMB: firstSizeMB,
        reduction: ((1 - firstResult.size / originalSize) * 100),
        status: firstResult.size > originalSize ? 'inflated' :
          firstSizeMB > TARGET_SIZE_MB ? 'too_large' : 'success',
      });

      // Check if we need fallback
      const needsFallback = firstResult.size > originalSize || firstSizeMB > TARGET_SIZE_MB;

      if (needsFallback) {
        console.log(`[Compress] First attempt ${firstResult.size > originalSize ? 'inflated' : 'too large'}, trying CRF ${FALLBACK_CRF}`);
        const secondResult = await compressWithCRF(tempInput, tempOutput, FALLBACK_CRF);
        const secondSizeMB = secondResult.size / (1024 * 1024);

        attempts.push({
          crf: FALLBACK_CRF,
          size: secondResult.size,
          sizeMB: secondSizeMB,
          reduction: ((1 - secondResult.size / originalSize) * 100),
          status: secondResult.size > originalSize ? 'inflated' : 'success',
        });

        if (secondResult.size > originalSize) {
          // Even CRF 26 inflates - use original
          finalBuffer = buffer;
          finalCRF = 'original';
          usedMethod = `CRF ${DEFAULT_CRF} → CRF ${FALLBACK_CRF} both inflated → using original`;
        } else if (firstResult.size <= originalSize && firstResult.size <= secondResult.size) {
          // First result was valid and smaller - use it
          finalBuffer = firstResult.buffer;
          finalCRF = DEFAULT_CRF;
          usedMethod = `CRF ${DEFAULT_CRF} (fallback not needed, was just over target)`;
        } else {
          // Use fallback result
          finalBuffer = secondResult.buffer;
          finalCRF = FALLBACK_CRF;
          usedMethod = `CRF ${DEFAULT_CRF} → CRF ${FALLBACK_CRF} (fallback used)`;
        }
      } else {
        // First result is good
        finalBuffer = firstResult.buffer;
        finalCRF = DEFAULT_CRF;
        usedMethod = `CRF ${DEFAULT_CRF} (no fallback needed)`;
      }
    }

    // Generate thumbnail from the final video
    let thumbnailUrl = '';
    try {
      // Write final buffer to temp for thumbnail extraction
      const tempFinal = path.join(tempDir, `final-${uniqueId}${extension}`);
      await fs.writeFile(tempFinal, finalBuffer);

      await execFileAsync('ffmpeg', [
        '-i', tempFinal,
        '-ss', '00:00:02',
        '-vframes', '1',
        '-vf', 'scale=480:-1',
        '-q:v', '2',
        '-y', tempThumbnail,
      ]);

      const thumbnailBuffer = await fs.readFile(tempThumbnail);
      const thumbnailKey = `thumbnails/${thumbnailFileName}`;
      thumbnailUrl = await uploadFile(thumbnailBuffer, thumbnailKey, 'image/jpeg');

      await fs.unlink(tempFinal).catch(() => { });
    } catch (thumbnailError) {
      console.warn('Thumbnail generation failed:', thumbnailError);
    }

    // Upload final video
    const videoKey = `videos/${fileName}`;
    const videoUrl = await uploadFile(finalBuffer, videoKey, video.type);

    // Clean up temp files
    await fs.unlink(tempInput).catch(() => { });
    await fs.unlink(tempOutput).catch(() => { });
    await fs.unlink(tempThumbnail).catch(() => { });

    const finalSize = finalBuffer.length;
    const finalSizeMB = finalSize / (1024 * 1024);
    const totalReduction = ((1 - finalSize / originalSize) * 100);

    return NextResponse.json({
      message: 'Video compressed successfully!',
      path: videoUrl,
      thumbnailPath: thumbnailUrl,
      original: {
        name: video.name,
        size: originalSize,
        sizeMB: originalSizeMB.toFixed(2),
      },
      result: {
        size: finalSize,
        sizeMB: finalSizeMB.toFixed(2),
        reduction: `${totalReduction.toFixed(1)}%`,
        crf: finalCRF,
        method: usedMethod,
      },
      attempts,
      qualityMode,
    });
  } catch (error) {
    console.error('Video compression error:', error);
    return NextResponse.json({ error: 'Compression failed' }, { status: 500 });
  }
}
