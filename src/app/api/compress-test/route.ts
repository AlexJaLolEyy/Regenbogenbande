// app/api/compress-test/route.ts - Testing endpoint for video compression presets
// Compresses one video with multiple CRF settings for comparison

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// CRF presets to test (lower = better quality, larger file)
const CRF_PRESETS = {
    'ultra': 18,      // Near lossless, huge files
    'high': 20,       // High quality, large files (~-30% size)
    'quality': 22,    // Good quality, medium files (~-50% size)
    'balanced': 24,   // Balanced, smaller files (~-65% size)
    'standard': 26,   // Standard, small files (~-75% size)
    'aggressive': 28, // Aggressive, tiny files (~-85% size)
};

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const video = formData.get('video') as File;
        const presetsParam = formData.get('presets') as string | null;

        if (!video) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Parse which presets to use (comma-separated list or 'all')
        let selectedPresets: string[];
        if (!presetsParam || presetsParam === 'all') {
            selectedPresets = Object.keys(CRF_PRESETS);
        } else {
            selectedPresets = presetsParam.split(',').map(p => p.trim().toLowerCase());
        }

        // Validate presets
        const validPresets = selectedPresets.filter(p => p in CRF_PRESETS);
        if (validPresets.length === 0) {
            return NextResponse.json({
                error: 'No valid presets selected',
                available: Object.keys(CRF_PRESETS)
            }, { status: 400 });
        }

        console.log(`[Compress Test] Testing ${validPresets.length} presets: ${validPresets.join(', ')}`);

        // Create temp directory
        const tempDir = path.join(process.cwd(), 'tmp', 'compress-test');
        const outputDir = path.join(process.cwd(), 'public', 'compression-test');
        await fs.mkdir(tempDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });

        // Generate unique ID for this test
        const timestamp = Date.now();
        const testId = `test-${timestamp}`;

        // Save original file
        const buffer = Buffer.from(await video.arrayBuffer());
        const extension = path.extname(video.name) || '.mp4';
        const tempInput = path.join(tempDir, `${testId}-original${extension}`);
        await fs.writeFile(tempInput, buffer);

        const originalSize = buffer.length;
        const results: Array<{
            preset: string;
            crf: number;
            size: number;
            sizeFormatted: string;
            reduction: string;
            path: string;
            processingTime: number;
        }> = [];

        // Compress with each preset
        for (const presetName of validPresets) {
            const crf = CRF_PRESETS[presetName as keyof typeof CRF_PRESETS];
            const outputFileName = `${testId}-crf${crf}-${presetName}${extension}`;
            const tempOutput = path.join(tempDir, outputFileName);
            const finalOutput = path.join(outputDir, outputFileName);

            console.log(`[Compress Test] Processing preset: ${presetName} (CRF ${crf})`);
            const startTime = Date.now();

            // FFmpeg command - preserve original FPS, scale to max 1080p
            const ffmpegCommand = `
        ffmpeg -i "${tempInput}" \
          -c:v libx264 \
          -preset medium \
          -crf ${crf} \
          -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
          -c:a aac \
          -b:a 128k \
          -movflags +faststart \
          -y \
          "${tempOutput}"
      `.replace(/\s+/g, ' ').trim();

            try {
                await execAsync(ffmpegCommand);

                // Read compressed file
                const compressedBuffer = await fs.readFile(tempOutput);
                const compressedSize = compressedBuffer.length;
                const processingTime = Date.now() - startTime;

                // Copy to public folder for viewing
                await fs.copyFile(tempOutput, finalOutput);

                // Calculate reduction
                const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);

                results.push({
                    preset: presetName,
                    crf: crf,
                    size: compressedSize,
                    sizeFormatted: formatFileSize(compressedSize),
                    reduction: `${reduction}%`,
                    path: `/compression-test/${outputFileName}`,
                    processingTime: processingTime,
                });

                // Clean up temp output
                await fs.unlink(tempOutput).catch(() => { });
            } catch (error) {
                console.error(`[Compress Test] Failed for preset ${presetName}:`, error);
                results.push({
                    preset: presetName,
                    crf: crf,
                    size: 0,
                    sizeFormatted: 'FAILED',
                    reduction: 'N/A',
                    path: '',
                    processingTime: 0,
                });
            }
        }

        // Clean up temp input
        await fs.unlink(tempInput).catch(() => { });

        // Sort by CRF (quality order)
        results.sort((a, b) => a.crf - b.crf);

        return NextResponse.json({
            message: 'Compression test complete!',
            testId: testId,
            original: {
                name: video.name,
                size: originalSize,
                sizeFormatted: formatFileSize(originalSize),
            },
            results: results,
            comparison: results.map(r => `${r.preset} (CRF ${r.crf}): ${r.sizeFormatted} (${r.reduction} smaller)`).join('\n'),
        });
    } catch (error) {
        console.error('Compression test error:', error);
        return NextResponse.json({
            error: 'Compression test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
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
