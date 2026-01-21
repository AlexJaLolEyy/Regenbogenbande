"use server"

import { requireContentOwnerOrAdmin } from '@/src/lib/auth-utils';
import { updateVideo } from '@/src/lib/db/mutations/videos';
import { getVideoById } from '@/src/lib/db/selects/videos';
import { parseVideoActionToBackend, VideoActionInput } from '@/src/lib/utils/video-utils';
import { redirect } from 'next/navigation';

export async function updateVideoElement(video: VideoActionInput) {
    if (!video.id) throw new Error("Video ID is required");

    // Fetch existing video to check ownership
    const existingVideo = await getVideoById(video.id);
    if (!existingVideo) throw new Error("Video not found");

    await requireContentOwnerOrAdmin(existingVideo.uploadedBy.id);

    try {
        // Use existing URLs and metadata that aren't being edited
        const videoData = await parseVideoActionToBackend(
            video,
            existingVideo.videoUrl,
            existingVideo.thumbnailUrl
        );

        videoData.views = existingVideo.views;
        videoData.isPublic = existingVideo.isPublic;
        videoData.publishedAt = existingVideo.publishedAt;

        await updateVideo(videoData);
        redirect(`/videos/${video.id}/`);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("Error updating the video : ", error);
    }
}
