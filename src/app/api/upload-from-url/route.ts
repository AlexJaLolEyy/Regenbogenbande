import { uploadFile } from '@/src/lib/storage-adapter';
import { NextResponse } from 'next/server';

// API route for downloading medal files like video and thumbnail and uploading them to R2 
export async function POST(req: Request) {
    try {
        const { videoUrl, thumbnailUrl, title } = await req.json();

        if (!videoUrl) {
            return NextResponse.json({ error: 'No video URL provided' }, { status: 400 });
        }

        const sanitizeFilename = (name: string) => {
            return name
                .replace(/[^a-z0-9]/gi, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase()
                .substring(0, 100);
        };

        const uniqueId = crypto.randomUUID();
        const baseName = title && title.trim() ? sanitizeFilename(title.trim()) : 'medal-clip';

        // 1. Download and upload video
        console.log(`[Upload From URL] Downloading video from: ${videoUrl}`);
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);

        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        const videoContentType = videoResponse.headers.get('content-type') || 'video/mp4';
        const videoExtension = videoUrl.split('.').pop()?.split(/[#?]/)[0] || 'mp4';
        const videoFileName = `${baseName}-${uniqueId}.${videoExtension}`;

        const finalVideoUrl = await uploadFile(videoBuffer, `videos/${videoFileName}`, videoContentType);

        // 2. Download and upload thumbnail (if provided)
        let finalThumbnailUrl = '';
        if (thumbnailUrl) {
            console.log(`[Upload From URL] Downloading thumbnail from: ${thumbnailUrl}`);
            try {
                const thumbResponse = await fetch(thumbnailUrl);
                if (thumbResponse.ok) {
                    const thumbBuffer = Buffer.from(await thumbResponse.arrayBuffer());
                    const thumbContentType = thumbResponse.headers.get('content-type') || 'image/jpeg';
                    const thumbExtension = thumbnailUrl.split('.').pop()?.split(/[#?]/)[0] || 'jpg';
                    const thumbFileName = `${baseName}-${uniqueId}-thumb.${thumbExtension}`;

                    finalThumbnailUrl = await uploadFile(thumbBuffer, `thumbnails/${thumbFileName}`, thumbContentType);
                }
            } catch (thumbError) {
                console.warn('[Upload From URL] Thumbnail download/upload failed:', thumbError);
            }
        }

        return NextResponse.json({
            message: 'Files uploaded to R2 successfully!',
            videoPath: finalVideoUrl,
            thumbnailPath: finalThumbnailUrl,
        });
    } catch (error) {
        console.error('[Upload From URL] Error:', error);
        return NextResponse.json({
            error: 'Upload from URL failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
