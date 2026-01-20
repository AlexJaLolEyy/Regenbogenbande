import { User, Video, VideoUploadForm } from "@/src/lib/types/types";
import { getUserById } from "../db/selects/users";

/**
 * Type for video metadata without File objects (for Server Actions)
 */
export type VideoActionInput = Omit<VideoUploadForm, 'video' | 'thumbnail'> & {
    video?: string; // Can be a string path when editing
    thumbnail?: string; // Can be a string path when editing
    views?: number;
    isPublic?: boolean;
    publishedAt?: Date | null;
};

/**
 * Converts VideoActionInput to Video (with string paths) for backend storage
 * Handles user ID resolution if participants/uploadedBy are provided as strings or objects
 */
export async function parseVideoActionToBackend(
    input: VideoActionInput,
    videoPath: string,
    thumbnailPath: string
): Promise<Video> {
    // Handle participants - can be string IDs or User objects
    let participants: User[] = [];

    if (typeof input.participants === "string") {
        const participantsStr = input.participants as string;
        const userIds = participantsStr.split(",").filter((id: string) => id.trim() !== "");
        const userPromises = userIds.map((id: string) => getUserById(id));
        const fetchedUsers = await Promise.all(userPromises);
        participants = fetchedUsers.filter((u: User | null): u is User => u !== null);
    } else if (Array.isArray(input.participants)) {
        participants = input.participants;
    }

    // Handle uploadedBy - can be string ID or User object
    let uploadedBy: User;
    if (typeof input.uploadedBy === "string") {
        const user = await getUserById(input.uploadedBy);
        if (!user) throw new Error(`User with ID ${input.uploadedBy} not found`);
        uploadedBy = user;
    } else {
        uploadedBy = input.uploadedBy;
    }

    // Parse and convert to Video entity
    const videoData: Video = {
        id: input.id || "",
        title: input.title,
        description: input.description || null,
        videoUrl: videoPath,
        thumbnailUrl: thumbnailPath,
        participants: participants,
        uploadedBy: uploadedBy,
        uploadedAt: input.uploadedAt || new Date(),
        createdAt: input.createdAt || new Date(),
        views: input.views || 0,
        category: { id: input.categoryId, name: "", iconUrl: null },
        isPublic: input.isPublic ?? false,
        publishedAt: input.publishedAt || null,
    };

    return videoData;
}
