"use server"

import { addVideo, getUserById } from '@/src/app/current-storage/storage';
import { UploadVideo, User, Video } from '@/src/lib/types/types';
import { redirect } from 'next/navigation';
import { getAllVideos } from '@/src/app/current-storage/storage';

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
            return getUserById(parseInt(userid));
        });
        participants = await Promise.all(userPromises);
    } else if (Array.isArray(video.participants)) {
        // If it's already an array of Users, use it directly
        participants = video.participants;
    }

    // Handle uploadedBy - can be string ID or User object
    let uploadedBy: User;
    if (typeof video.uploadedBy === "string") {
        uploadedBy = await getUserById(parseInt(video.uploadedBy));
    } else {
        uploadedBy = video.uploadedBy;
    }

    // Generate a new ID if not provided (for new uploads)
    let videoId = video.id;
    if (!videoId || videoId === 0) {
        // Get the highest existing ID and add 1
        const allVideos = await getAllVideos();
        const maxId = allVideos.length > 0 
            ? Math.max(...allVideos.map(v => v.id))
            : 0;
        videoId = maxId + 1;
    }

    // Convert UploadVideo to Video
    const videoData: Video = {
        id: videoId,
        title: video.title,
        description: video.description,
        video: videoPath, // Use the path from file upload, not the File object
        thumbnail: thumbnailPath, // Use the thumbnail path
        participants: participants,
        uploadedBy: uploadedBy,
        uploadedAt: video.uploadedAt || new Date(),
        createdAt: video.createdAt || new Date(),
        metadata: {
            views: 0,
            rating: [],
        },
    };

    return videoData;
}

/**
 * Creates a video in the database after file upload
 * Note: video parameter should NOT contain File objects (they cause body size limit errors)
 */
export async function createVideo(video: VideoMetadata, videoPath: string, thumbnailPath: string) {
    // Parse and convert UploadVideo to Video
    const videoData = await parseUploadVideoToBackend(video, videoPath, thumbnailPath);
    
    // Add to database (await it!)
    await addVideo(videoData);
    
    // Redirect to the video detail page
    // Note: redirect() throws a special NEXT_REDIRECT error that Next.js handles
    // This is normal behavior, not an actual error
    redirect(`/videos/${videoData.id}/`);
}