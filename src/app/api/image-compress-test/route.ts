// app/api/image-compress-test/route.ts - Testing endpoint for image compression
// Tests different quality levels, formats, and optimization strategies

import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

// Quality presets to test
const QUALITY_PRESETS = [100, 95, 90, 85, 80, 75, 70];

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const image = formData.get('image') as File;

        if (!image) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const originalBuffer = Buffer.from(await image.arrayBuffer());
        const originalSize = originalBuffer.length;
        const originalType = image.type;
        const isPNG = originalType === 'image/png';
        const isJPEG = originalType === 'image/jpeg' || originalType === 'image/jpg';

        // Create output directory
        const outputDir = path.join(process.cwd(), 'public', 'image-compression-test');
        await fs.mkdir(outputDir, { recursive: true });

        const timestamp = Date.now();
        const testId = `img-${timestamp}`;

        // Get image metadata
        const metadata = await sharp(originalBuffer).metadata();
        const width = metadata.width || 0;
        const height = metadata.height || 0;

        const results: Array<{
            format: string;
            quality: number;
            size: number;
            sizeFormatted: string;
            reduction: string;
            path: string;
        }> = [];

        // Save original for comparison
        const originalFileName = `${testId}-original${isPNG ? '.png' : '.jpg'}`;
        await fs.writeFile(path.join(outputDir, originalFileName), originalBuffer);
        results.push({
            format: isPNG ? 'PNG (Original)' : 'JPEG (Original)',
            quality: 100,
            size: originalSize,
            sizeFormatted: formatFileSize(originalSize),
            reduction: '0%',
            path: `/image-compression-test/${originalFileName}`,
        });

        if (isPNG) {
            // Test 1: PNG optimization (lossless)
            const optimizedPng = await sharp(originalBuffer)
                .png({ compressionLevel: 9 })
                .toBuffer();
            const pngOptFileName = `${testId}-png-optimized.png`;
            await fs.writeFile(path.join(outputDir, pngOptFileName), optimizedPng);
            results.push({
                format: 'PNG (Optimized)',
                quality: 100,
                size: optimizedPng.length,
                sizeFormatted: formatFileSize(optimizedPng.length),
                reduction: `${((1 - optimizedPng.length / originalSize) * 100).toFixed(1)}%`,
                path: `/image-compression-test/${pngOptFileName}`,
            });

            // Test 2: PNG → WebP at different qualities
            for (const quality of QUALITY_PRESETS) {
                const webpBuffer = await sharp(originalBuffer)
                    .webp({ quality })
                    .toBuffer();
                const fileName = `${testId}-webp-q${quality}.webp`;
                await fs.writeFile(path.join(outputDir, fileName), webpBuffer);
                results.push({
                    format: `WebP`,
                    quality,
                    size: webpBuffer.length,
                    sizeFormatted: formatFileSize(webpBuffer.length),
                    reduction: `${((1 - webpBuffer.length / originalSize) * 100).toFixed(1)}%`,
                    path: `/image-compression-test/${fileName}`,
                });
            }

            // Test 3: PNG → JPEG (lossy, removes transparency)
            for (const quality of [90, 85, 80]) {
                const jpegBuffer = await sharp(originalBuffer)
                    .flatten({ background: { r: 255, g: 255, b: 255 } }) // White background for transparency
                    .jpeg({ quality, mozjpeg: true })
                    .toBuffer();
                const fileName = `${testId}-jpeg-q${quality}.jpg`;
                await fs.writeFile(path.join(outputDir, fileName), jpegBuffer);
                results.push({
                    format: `JPEG`,
                    quality,
                    size: jpegBuffer.length,
                    sizeFormatted: formatFileSize(jpegBuffer.length),
                    reduction: `${((1 - jpegBuffer.length / originalSize) * 100).toFixed(1)}%`,
                    path: `/image-compression-test/${fileName}`,
                });
            }
        } else if (isJPEG) {
            // Test: JPEG at different qualities with MozJPEG
            for (const quality of QUALITY_PRESETS) {
                const jpegBuffer = await sharp(originalBuffer)
                    .jpeg({ quality, mozjpeg: true })
                    .toBuffer();
                const fileName = `${testId}-jpeg-q${quality}.jpg`;
                await fs.writeFile(path.join(outputDir, fileName), jpegBuffer);
                results.push({
                    format: `JPEG (MozJPEG)`,
                    quality,
                    size: jpegBuffer.length,
                    sizeFormatted: formatFileSize(jpegBuffer.length),
                    reduction: `${((1 - jpegBuffer.length / originalSize) * 100).toFixed(1)}%`,
                    path: `/image-compression-test/${fileName}`,
                });
            }

            // Test: JPEG → WebP conversion
            for (const quality of [90, 85, 80, 75]) {
                const webpBuffer = await sharp(originalBuffer)
                    .webp({ quality })
                    .toBuffer();
                const fileName = `${testId}-webp-q${quality}.webp`;
                await fs.writeFile(path.join(outputDir, fileName), webpBuffer);
                results.push({
                    format: `WebP`,
                    quality,
                    size: webpBuffer.length,
                    sizeFormatted: formatFileSize(webpBuffer.length),
                    reduction: `${((1 - webpBuffer.length / originalSize) * 100).toFixed(1)}%`,
                    path: `/image-compression-test/${fileName}`,
                });
            }
        }

        return NextResponse.json({
            message: 'Image compression test complete!',
            testId,
            original: {
                name: image.name,
                type: originalType,
                size: originalSize,
                sizeFormatted: formatFileSize(originalSize),
                width,
                height,
            },
            results,
        });
    } catch (error) {
        console.error('Image compression test error:', error);
        return NextResponse.json({
            error: 'Test failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
