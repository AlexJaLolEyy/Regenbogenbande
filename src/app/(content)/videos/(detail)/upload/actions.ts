"use server"

import { addVideo, getUserById } from '@/src/app/current-storage/storage';
import { checkUploadPermission } from '@/src/lib/auth-utils';
import { UploadVideo, User, Video } from '@/src/lib/types/types';
import { redirect } from 'next/navigation';

/**
 * Type for video metadata without File objects (for Server Actions)
 */
type VideoMetadata = Omit<UploadVideo, 'video' | 'thumbnail'> & {
    video?: never; // Explicitly exclude File
    thumbnail?: never; // Explicitly exclude File
};

/**
 * Converts UploadVideo (with File objects) to Video (with string paths)
 * Also handles user ID resolution if participants/uploadedBy are strings
 */
export async function parseUploadVideoToBackend(video: VideoMetadata, videoPath: string, thumbnailPath: string): Promise<Video> {
    // Handle participants - can be string IDs or User objects
    let participants: User[] = [];

    if (typeof video.participants === "string") {
        // If it's a string, split by comma and fetch each user
        const participantsStr = video.participants as string;
        const userIds = participantsStr.split(",").filter((id: string) => id.trim() !== "");
        const userPromises = userIds.map((userid: string) => {
            return getUserById(userid);
        });
        const fetchedUsers = await Promise.all(userPromises);
        participants = fetchedUsers.filter((u): u is User => u !== null);
    } else if (Array.isArray(video.participants)) {
        // If it's already an array of Users, use it directly
        participants = video.participants;
    }

    // Handle uploadedBy - can be string ID or User object
    let uploadedBy: User;
    if (typeof video.uploadedBy === "string") {
        const user = await getUserById(video.uploadedBy);
        if (!user) throw new Error(`User with ID ${video.uploadedBy} not found`);
        uploadedBy = user;
    } else {
        uploadedBy = video.uploadedBy;
    }

    // Parse and convert UploadVideo to Video
    const videoData: Video = {
        id: video.id || "", // Prisma will generate if empty
        title: video.title,
        description: video.description || null,
        videoUrl: videoPath,
        thumbnailUrl: thumbnailPath,
        participants: participants.map(u => ({ type: 'user', data: u })),
        uploadedBy: uploadedBy,
        uploadedAt: video.uploadedAt || new Date(),
        createdAt: video.createdAt || new Date(),
        views: 0,
        category: { id: video.categoryId, name: "", iconUrl: null }, // Partial category is fine for addVideo
        isPublic: false,
        publishedAt: null,
    };

    return videoData;
}

/**
 * Creates a video in the database after file upload
 * Note: video parameter should NOT contain File objects (they cause body size limit errors)
 */
export async function createVideo(video: VideoMetadata, videoPath: string, thumbnailPath: string) {
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
        };
    }

    // Parse and convert UploadVideo to Video
    const videoData = await parseUploadVideoToBackend(video, videoPath, thumbnailPath);

    // Add to database (await it!)
    const createdVideo = await addVideo(videoData);

    // Redirect to the video detail page
    redirect(`/videos/${createdVideo.id}/`);
}
