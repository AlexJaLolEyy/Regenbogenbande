// app/api/compress-adaptive/route.ts - Adaptive compression with smart fallback logic
// Tries CRF 24 first, falls back to CRF 26 if result is too large or inflated

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const DEFAULT_CRF = 24;
const FALLBACK_CRF = 26;
const QUALITY_CRF = 20;
const TARGET_SIZE_MB = 60;
const MAX_UPLOAD_MB = 500;

// Helper function to compress with specific CRF
async function compressWithCRF(
    inputPath: string,
    crf: number,
    testId: string,
    extension: string,
    tempDir: string
): Promise<{ buffer: Buffer; size: number }> {
    const tempOutput = path.join(tempDir, `${testId}-crf${crf}${extension}`);

    // Get source FPS and cap at 60
    const probeCommand = `ffprobe -v error -select_streams v -of default=noprint_wrappers=1:nokey=1 -show_entries stream=r_frame_rate "${inputPath}"`;
    let fpsFilter = '';
    try {
        const { stdout } = await execAsync(probeCommand);
        const [num, den] = stdout.trim().split('/').map(Number);
        const sourceFps = den ? num / den : 60;
        if (sourceFps > 60) {
            fpsFilter = '-r 60';
        }
    } catch {
        // If probe fails, don't set FPS filter
    }

    const ffmpegCommand = `
    ffmpeg -i "${inputPath}" \
      -c:v libx264 \
      -preset medium \
      -crf ${crf} \
      -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
      ${fpsFilter} \
      -c:a aac \
      -b:a 128k \
      -movflags +faststart \
      -y \
      "${tempOutput}"
  `.replace(/\s+/g, ' ').trim();

    await execAsync(ffmpegCommand);
    const compressedBuffer = await fs.readFile(tempOutput);
    await fs.unlink(tempOutput).catch(() => { });

    return { buffer: compressedBuffer, size: compressedBuffer.length };
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const video = formData.get('video') as File;
        const qualityMode = formData.get('qualityMode') === 'true';

        if (!video) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const originalSize = video.size;
        const originalSizeMB = originalSize / (1024 * 1024);

        // Reject files that are too large
        if (originalSizeMB > MAX_UPLOAD_MB) {
            return NextResponse.json({
                error: `File too large (${originalSizeMB.toFixed(1)} MB). Maximum allowed is ${MAX_UPLOAD_MB} MB. Please trim your clip first.`,
            }, { status: 400 });
        }

        console.log(`[Adaptive] Original: ${originalSizeMB.toFixed(2)} MB, Quality mode: ${qualityMode}`);

        // Create temp directories
        const tempDir = path.join(process.cwd(), 'tmp', 'adaptive');
        const outputDir = path.join(process.cwd(), 'public', 'compression-test');
        await fs.mkdir(tempDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });

        const timestamp = Date.now();
        const testId = `adaptive-${timestamp}`;
        const extension = path.extname(video.name) || '.mp4';

        // Save original file
        const buffer = Buffer.from(await video.arrayBuffer());
        const tempInput = path.join(tempDir, `${testId}-input${extension}`);
        await fs.writeFile(tempInput, buffer);

        // Track compression attempts
        const attempts: Array<{
            crf: number | 'original';
            size: number;
            sizeMB: number;
            reduction: number;
            status: 'success' | 'inflated' | 'too_large';
        }> = [];

        let finalBuffer: Buffer;
        let finalCRF: number | 'original';
        let usedMethod: string;

        if (qualityMode) {
            // Quality mode: Use CRF 20, no fallback
            console.log(`[Adaptive] Quality mode - using CRF ${QUALITY_CRF}`);
            const result = await compressWithCRF(tempInput, QUALITY_CRF, testId, extension, tempDir);

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
            console.log(`[Adaptive] Trying CRF ${DEFAULT_CRF}`);
            const firstResult = await compressWithCRF(tempInput, DEFAULT_CRF, testId, extension, tempDir);
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
                console.log(`[Adaptive] First attempt ${firstResult.size > originalSize ? 'inflated' : 'too large'}, trying CRF ${FALLBACK_CRF}`);
                const secondResult = await compressWithCRF(tempInput, FALLBACK_CRF, testId, extension, tempDir);
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

        // Save final result to public folder
        const outputFileName = `${testId}-final${extension}`;
        const outputPath = path.join(outputDir, outputFileName);
        await fs.writeFile(outputPath, finalBuffer);

        // Clean up temp input
        await fs.unlink(tempInput).catch(() => { });

        const finalSize = finalBuffer.length;
        const finalSizeMB = finalSize / (1024 * 1024);
        const totalReduction = ((1 - finalSize / originalSize) * 100);

        return NextResponse.json({
            message: 'Adaptive compression complete!',
            testId,
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
                path: `/compression-test/${outputFileName}`,
            },
            attempts,
            qualityMode,
        });
    } catch (error) {
        console.error('Adaptive compression error:', error);
        return NextResponse.json({
            error: 'Compression failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
