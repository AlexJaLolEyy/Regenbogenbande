import { guardApi } from '@/src/lib/api-auth';
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, readLimited, safeFetch } from '@/src/lib/safe-fetch';
import { uploadFile } from '@/src/lib/storage-adapter';
import { NextResponse } from 'next/server';

const VIDEO_TYPES: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
};
const IMAGE_TYPES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

// API route for downloading medal files like video and thumbnail and uploading them to R2 
export async function POST(req: Request) {
    const guard = await guardApi('member');
    if (guard.response) return guard.response;

    try {
        const { videoUrl, thumbnailUrl, title } = await req.json();

        if (!videoUrl || typeof videoUrl !== 'string') {
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
        const baseName = typeof title === 'string' && title.trim() ? sanitizeFilename(title.trim()) : 'medal-clip';

        // 1. Download and upload video
        const videoResponse = await safeFetch(videoUrl);
        if (!videoResponse.ok) throw new Error('Failed to fetch video');

        const videoContentType = (videoResponse.headers.get('content-type') || 'video/mp4').split(';')[0].trim();
        const videoExtension = VIDEO_TYPES[videoContentType];
        if (!videoExtension) {
            return NextResponse.json({ error: 'Unsupported video type' }, { status: 400 });
        }
        const videoBuffer = await readLimited(videoResponse, MAX_VIDEO_BYTES);
        const videoFileName = `${baseName}-${uniqueId}.${videoExtension}`;

        const finalVideoUrl = await uploadFile(videoBuffer, `videos/${videoFileName}`, videoContentType);

        // 2. Download and upload thumbnail (if provided)
        let finalThumbnailUrl = '';
        if (thumbnailUrl && typeof thumbnailUrl === 'string') {
            try {
                const thumbResponse = await safeFetch(thumbnailUrl);
                if (thumbResponse.ok) {
                    const thumbContentType = (thumbResponse.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
                    const thumbExtension = IMAGE_TYPES[thumbContentType];
                    if (thumbExtension) {
                        const thumbBuffer = await readLimited(thumbResponse, MAX_IMAGE_BYTES);
                        const thumbFileName = `${baseName}-${uniqueId}-thumb.${thumbExtension}`;
                        finalThumbnailUrl = await uploadFile(thumbBuffer, `thumbnails/${thumbFileName}`, thumbContentType);
                    }
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
        return NextResponse.json({ error: 'Upload from URL failed' }, { status: 500 });
    }
}
