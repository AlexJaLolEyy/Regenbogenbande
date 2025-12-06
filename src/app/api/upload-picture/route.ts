// app/api/upload-picture/route.ts - API route for uploading and optimizing pictures to R2

import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { uploadToR2, getSignedR2Url, getPublicR2Url } from '@/src/lib/r2-client';

// Optimization thresholds
const OPTIMIZE_THRESHOLD = 1024 * 1024; // 1 MB - optimize files larger than this
const MAX_WIDTH = 3840; // 4K width
const MAX_HEIGHT = 2160; // 4K height
const JPEG_QUALITY = 85; // Quality for JPEG compression
const WEBP_QUALITY = 85; // Quality for WebP conversion

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    const title = formData.get('title') as string | null;
    const optimize = formData.get('optimize') === 'true';

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

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const uniqueId = `${timestamp}-${randomId}`;

    const baseName = title && title.trim() 
      ? sanitizeFilename(title.trim())
      : image.name.replace(/\.[^/.]+$/, '');
    
    // Get original file info
    const originalBuffer = Buffer.from(await image.arrayBuffer());
    const originalSize = originalBuffer.length;
    const originalType = image.type;
    const isPNG = originalType === 'image/png';
    const isJPEG = originalType === 'image/jpeg' || originalType === 'image/jpg';
    
    // Determine if we should optimize
    const shouldOptimize = optimize && (originalSize > OPTIMIZE_THRESHOLD || isPNG);
    
    let finalBuffer: Buffer;
    let finalContentType: string;
    let extension: string;
    let optimizationStats = {
      optimized: false,
      originalSize: originalSize,
      finalSize: originalSize,
      sizeReduction: 0,
      formatChanged: false,
    };

    if (shouldOptimize) {
      // Load image with sharp
      let sharpImage = sharp(originalBuffer);
      
      // Get image metadata
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
      
      // Convert PNG to WebP for better compression, or optimize JPEG
      if (isPNG) {
        // Convert PNG to WebP (much better compression)
        finalBuffer = await sharpImage
          .webp({ quality: WEBP_QUALITY })
          .toBuffer();
        finalContentType = 'image/webp';
        extension = '.webp';
        optimizationStats.formatChanged = true;
      } else if (isJPEG) {
        // Optimize JPEG (recompress with quality setting)
        finalBuffer = await sharpImage
          .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
          .toBuffer();
        finalContentType = 'image/jpeg';
        extension = '.jpg';
      } else {
        // For other formats, just resize if needed
        finalBuffer = await sharpImage.toBuffer();
        finalContentType = originalType;
        extension = image.name.substring(image.name.lastIndexOf('.'));
      }
      
      optimizationStats.optimized = true;
      optimizationStats.finalSize = finalBuffer.length;
      optimizationStats.sizeReduction = originalSize - finalBuffer.length;
    } else {
      // No optimization - use original
      finalBuffer = originalBuffer;
      finalContentType = originalType;
      extension = image.name.substring(image.name.lastIndexOf('.'));
    }

    const fileName = `${baseName}-${uniqueId}${extension}`;
    const imageKey = `pictures/${fileName}`;

    // Upload to R2
    await uploadToR2(finalBuffer, imageKey, finalContentType);

    // Generate image URL (signed for private buckets, public for public buckets)
    const imageUrl = process.env.R2_PUBLIC_URL 
      ? getPublicR2Url(imageKey)
      : await getSignedR2Url(imageKey, 604800); // 7 days

    return NextResponse.json({ 
      message: 'Image uploaded successfully!',
      path: imageUrl,
      originalSize: optimizationStats.originalSize,
      finalSize: optimizationStats.finalSize,
      sizeReduction: optimizationStats.sizeReduction,
      optimized: optimizationStats.optimized,
      formatChanged: optimizationStats.formatChanged,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ 
      error: 'Image upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

