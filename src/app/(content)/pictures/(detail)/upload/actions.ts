"use server"

import { addPicture, getUserById } from '@/src/app/current-storage/storage';
import { checkUploadPermission } from '@/src/lib/auth-utils';
import { Picture, UploadPicture, User } from '@/src/lib/types/types';
import { redirect } from 'next/navigation';

/**
 * Type for picture metadata without File objects (for Server Actions)
 */
type PictureMetadata = Omit<UploadPicture, 'img'> & {
    img?: never; // Explicitly exclude File
};

/**
 * Converts UploadPicture (with File object) to Picture (with string path)
 * Also handles user ID resolution if participants/uploadedBy are strings
 */
export async function parseUploadPictureToBackend(picture: PictureMetadata, imagePath: string, thumbnailPath?: string): Promise<Picture> {
    // Handle participants - can be string IDs or User objects
    let participants: User[] = [];

    if (typeof picture.participants === "string") {
        // If it's a string, split by comma and fetch each user
        const participantsStr = picture.participants as string;
        const userIds = participantsStr.split(",").filter((id: string) => id.trim() !== "");
        const userPromises = userIds.map((userid: string) => {
            return getUserById(userid);
        });
        const fetchedUsers = await Promise.all(userPromises);
        participants = fetchedUsers.filter((u): u is User => u !== null);
    } else if (Array.isArray(picture.participants)) {
        // If it's already an array of Users, use it directly
        participants = picture.participants;
    }

    // Handle uploadedBy - can be string ID or User object
    let uploadedBy: User;
    if (typeof picture.uploadedBy === "string") {
        const user = await getUserById(picture.uploadedBy);
        if (!user) throw new Error(`User with ID ${picture.uploadedBy} not found`);
        uploadedBy = user;
    } else {
        uploadedBy = picture.uploadedBy;
    }

    // Convert UploadPicture to Picture
    const pictureData: Picture = {
        id: picture.id || "", // Prisma will generate if empty
        title: picture.title,
        description: picture.description || null,
        imageUrl: imagePath,
        thumbnailUrl: thumbnailPath || "",
        participants: participants.map(u => ({ type: 'user', data: u })),
        uploadedBy: uploadedBy,
        uploadedAt: picture.uploadedAt || new Date(),
        createdAt: picture.createdAt || new Date(),
        views: 0,
        category: { id: picture.categoryId, name: "", iconUrl: null },
        isPublic: false,
        publishedAt: null,
    };

    return pictureData;
}

/**
 * Creates a picture in the database after file upload
 * Note: picture parameter should NOT contain File objects (they cause body size limit errors)
 */
export async function createPicture(picture: PictureMetadata, imagePath: string, thumbnailPath?: string) {
    const session = await checkUploadPermission();
    
    if (!picture.categoryId) {
        throw new Error("categoryId is required");
    }

    // Fallback: If uploadedBy is missing, use session user
    if (!picture.uploadedBy) {
        picture.uploadedBy = {
            id: session.user.id,
            username: session.user.name,
            profilePicture: session.user.image || null,
        };
    }

    // Parse and convert UploadPicture to Picture
    const pictureData = await parseUploadPictureToBackend(picture, imagePath, thumbnailPath);

    // Add to database (await it!)
    const createdPicture = await addPicture(pictureData);

    // Redirect to the picture detail page
    redirect(`/pictures/${createdPicture.id}/`);
}
