// app/api/upload-picture/route.ts - API route for uploading and optimizing pictures
// Supports both local storage (development) and R2 (production)
// Default: PNG→WebP Q85, JPEG→MozJPEG Q85
// Quality Mode: PNG→WebP Q95, JPEG→MozJPEG Q95
// GIFs: Keep as-is (no conversion)
// Files < 50KB: Skip compression

import { uploadFile } from '@/src/lib/storage-adapter';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

// Compression settings
const DEFAULT_QUALITY = 85;
const QUALITY_MODE_QUALITY = 95;
const SKIP_THRESHOLD = 50 * 1024; // 50 KB - don't compress tiny files
const MAX_WIDTH = 3840; // 4K width
const MAX_HEIGHT = 2160; // 4K height

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const title = formData.get('title') as string | null;
    const qualityMode = formData.get('qualityMode') === 'true';

    if (!image) {
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

    const uniqueId = crypto.randomUUID();

    const baseName = title && title.trim()
      ? sanitizeFilename(title.trim())
      : image.name.replace(/\.[^/.]+$/, '');

    // Get original file info
    const originalBuffer = Buffer.from(await image.arrayBuffer());
    const originalSize = originalBuffer.length;
    const originalType = image.type;
    const isPNG = originalType === 'image/png';
    const isJPEG = originalType === 'image/jpeg' || originalType === 'image/jpg';
    const isGIF = originalType === 'image/gif';

    // Determine compression quality
    const quality = qualityMode ? QUALITY_MODE_QUALITY : DEFAULT_QUALITY;

    // Optimization stats
    const optimizationStats = {
      optimized: false,
      originalSize: originalSize,
      finalSize: originalSize,
      sizeReduction: 0,
      formatChanged: false,
      qualityMode: qualityMode,
      skippedReason: null as string | null,
    };

    let finalBuffer: Buffer;
    let finalContentType: string;
    let extension: string;

    // Decision logic
    if (isGIF) {
      // GIF: Keep as-is (animated GIFs are complex to handle)
      console.log('[Picture Upload] GIF detected - keeping original');
      finalBuffer = originalBuffer;
      finalContentType = 'image/gif';
      extension = '.gif';
      optimizationStats.skippedReason = 'GIF (kept original)';
    } else if (originalSize < SKIP_THRESHOLD) {
      // Tiny file: Skip compression
      console.log(`[Picture Upload] File under ${SKIP_THRESHOLD / 1024}KB - skipping compression`);
      finalBuffer = originalBuffer;
      finalContentType = originalType;
      extension = image.name.substring(image.name.lastIndexOf('.'));
      optimizationStats.skippedReason = 'File too small';
    } else if (isPNG) {
      // PNG: Convert to WebP
      console.log(`[Picture Upload] Converting PNG to WebP (Q${quality})`);
      let sharpImage = sharp(originalBuffer);

      // Get metadata for potential resize
      const metadata = await sharpImage.metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      // Resize if too large (maintain aspect ratio)
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        sharpImage = sharpImage.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      finalBuffer = await sharpImage
        .webp({ quality })
        .toBuffer();
      finalContentType = 'image/webp';
      extension = '.webp';
      optimizationStats.optimized = true;
      optimizationStats.formatChanged = true;
    } else if (isJPEG) {
      // JPEG: Optimize with MozJPEG
      console.log(`[Picture Upload] Optimizing JPEG with MozJPEG (Q${quality})`);
      let sharpImage = sharp(originalBuffer);

      // Get metadata for potential resize
      const metadata = await sharpImage.metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      // Resize if too large (maintain aspect ratio)
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        sharpImage = sharpImage.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      finalBuffer = await sharpImage
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      finalContentType = 'image/jpeg';
      extension = '.jpg';
      optimizationStats.optimized = true;
    } else {
      // Other formats: Keep as-is
      console.log('[Picture Upload] Unknown format - keeping original');
      finalBuffer = originalBuffer;
      finalContentType = originalType;
      extension = image.name.substring(image.name.lastIndexOf('.')) || '.bin';
      optimizationStats.skippedReason = 'Unknown format';
    }

    // Update stats
    optimizationStats.finalSize = finalBuffer.length;
    optimizationStats.sizeReduction = originalSize - finalBuffer.length;

    // Check for inflation (compressed bigger than original)
    if (optimizationStats.optimized && finalBuffer.length > originalBuffer.length) {
      console.log('[Picture Upload] Compression caused inflation - using original');
      finalBuffer = originalBuffer;
      finalContentType = originalType;
      extension = image.name.substring(image.name.lastIndexOf('.'));
      optimizationStats.optimized = false;
      optimizationStats.formatChanged = false;
      optimizationStats.finalSize = originalSize;
      optimizationStats.sizeReduction = 0;
      optimizationStats.skippedReason = 'Compression caused inflation';
    }

    const fileName = `${baseName}-${uniqueId}${extension}`;
    const imageKey = `pictures/${fileName}`;
    const thumbnailFileName = `${baseName}-${uniqueId}-thumb.jpg`;
    const thumbnailKey = `thumbnails/${thumbnailFileName}`;

    // Upload main image using storage adapter
    const imageUrl = await uploadFile(finalBuffer, imageKey, finalContentType);

    // Generate thumbnail (400px width for list views)
    let thumbnailUrl = '';
    try {
      const thumbnailBuffer = await sharp(finalBuffer)
        .resize(400, null, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      thumbnailUrl = await uploadFile(thumbnailBuffer, thumbnailKey, 'image/jpeg');
      console.log('[Picture Upload] Thumbnail generated successfully');
    } catch (thumbError) {
      console.warn('[Picture Upload] Thumbnail generation failed:', thumbError);
    }

    const reductionPercent = originalSize > 0
      ? ((optimizationStats.sizeReduction / originalSize) * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      message: 'Image uploaded successfully!',
      path: imageUrl,
      thumbnailPath: thumbnailUrl,
      originalSize: optimizationStats.originalSize,
      finalSize: optimizationStats.finalSize,
      sizeReduction: optimizationStats.sizeReduction,
      reductionPercent: `${reductionPercent}%`,
      optimized: optimizationStats.optimized,
      formatChanged: optimizationStats.formatChanged,
      qualityMode: optimizationStats.qualityMode,
      skippedReason: optimizationStats.skippedReason,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({
      error: 'Image upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
