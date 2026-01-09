"use server"

import { editVideo, getUserById, getVideoById } from '@/src/app/current-storage/storage';
import { requireContentOwnerOrAdmin } from '@/src/lib/auth-utils';
import { UploadVideo, Video } from '@/src/lib/types/types';
import { redirect } from 'next/navigation';


export async function parseUploadVideoToBackend(video: UploadVideo): Promise<Video> {

    // can happen since the form returns id's instead of full users if they get changed
    // TODO: maybe think about changing the UploadVideo participants + uploaded by to string?

    let participants: User[] = [];
    if (Array.isArray(video.participants)) {
        participants = video.participants;
    } else if (typeof video.participants === "string") {
        const userIds = (video.participants as string).split(",");
        const mappedUser = userIds.map((userid: string) => getUserById(userid));
        participants = (await Promise.all(mappedUser)).filter(Boolean) as User[];
    }

    let uploadedBy: User = video.uploadedBy;
    if (typeof video.uploadedBy === "string") {
        uploadedBy = (await getUserById(video.uploadedBy)) as User;
    }

    // Transform categoryId to category object for the Video type
    const category = { id: video.categoryId, name: '', iconUrl: null };

    return {
        ...video,
        participants: participants.map(u => ({ type: 'user', data: u })),
        uploadedBy,
        category,
        videoUrl: (video as any).videoUrl || "", // Use existing URL if not changed
        thumbnailUrl: (video as any).thumbnailUrl || "",
    } as unknown as Video;
}

export async function updateVideo(video: UploadVideo) {
    if (!video.id) throw new Error("Video ID is required");

    // Fetch existing video to check ownership
    const existingVideo = await getVideoById(video.id);
    if (!existingVideo) throw new Error("Video not found");

    await requireContentOwnerOrAdmin(existingVideo.uploadedBy.id);

    try {
        const backendVideo = await parseUploadVideoToBackend(video);
        // Ensure we keep the original URLs
        backendVideo.videoUrl = existingVideo.videoUrl;
        backendVideo.thumbnailUrl = existingVideo.thumbnailUrl;
        
        await editVideo(backendVideo);
        redirect(`/videos/${video.id}/`);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("Error updating the video : ", error);
    }
}