import { Picture, PictureUploadForm, User } from '@/src/lib/types/types';
import { getUserById } from '../db/selects/users';

/**
 * Type for picture metadata without File objects (for Server Actions)
 */
export type PictureActionInput = Omit<PictureUploadForm, 'img'> & {
    img?: never;
    views?: number;
    isPublic?: boolean;
    publishedAt?: Date | null;
};

/**
 * Converts PictureActionInput (without File object) to Picture (with string paths)
 * Also handles user ID resolution if participants/uploadedBy are strings
 */
export async function parsePictureActionToBackend(
    input: PictureActionInput,
    imagePath: string,
    thumbnailPath?: string
): Promise<Picture> {
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

    // Convert to Picture entity
    const pictureData: Picture = {
        id: input.id || "",
        title: input.title,
        description: input.description || null,
        imageUrl: imagePath,
        thumbnailUrl: thumbnailPath || "",
        participants: participants,
        uploadedBy: uploadedBy,
        uploadedAt: input.uploadedAt || new Date(),
        createdAt: input.createdAt || new Date(),
        views: input.views || 0,
        category: { id: input.categoryId, name: "", iconUrl: null },
        isPublic: input.isPublic ?? false,
        publishedAt: input.publishedAt || null,
    };

    return pictureData;
}
