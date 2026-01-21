"use server"

import { checkUploadPermission } from '@/src/lib/auth-utils';
import { addVideo } from '@/src/lib/db/mutations/videos';
import { parseVideoActionToBackend, VideoActionInput } from '@/src/lib/utils/video-utils';
import { redirect } from 'next/navigation';

/**
 * Creates a video in the database after file upload
 * Note: video parameter should NOT contain File objects (they cause body size limit errors)
 */
export async function createVideo(video: VideoActionInput, videoPath: string, thumbnailPath: string) {
    const session = await checkUploadPermission();

    if (!video.categoryId) {
        throw new Error("categoryId is required");
    }

    // Fallback: If uploadedBy is missing, use session user
    if (!video.uploadedBy) {
        video.uploadedBy = {
            id: session.user.id,
            username: session.user.name,
            profilePicture: session.user.image || null,
            status: 'ACTIVE'
        };
    }

    // Parse and convert input to Video entity
    const videoData = await parseVideoActionToBackend(video, videoPath, thumbnailPath);

    // Add to database
    const createdVideo = await addVideo(videoData);

    // Redirect to the video detail page
    redirect(`/videos/${createdVideo.id}/`);
}
