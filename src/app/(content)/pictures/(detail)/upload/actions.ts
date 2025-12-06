"use server"

import { addPicture, getUserById } from '@/src/app/current-storage/storage';
import { UploadPicture, User, Picture } from '@/src/lib/types/types';
import { redirect } from 'next/navigation';
import { getAllPictures } from '@/src/app/current-storage/storage';

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
export async function parseUploadPictureToBackend(picture: PictureMetadata, imagePath: string): Promise<Picture> {
    // Handle participants - can be string IDs or User objects
    let participants: User[] = [];
    
    if (typeof picture.participants === "string") {
        // If it's a string, split by comma and fetch each user
        const participantsStr = picture.participants as string;
        const userIds = participantsStr.split(",").filter((id: string) => id.trim() !== "");
        const userPromises = userIds.map((userid: string) => {
            return getUserById(parseInt(userid));
        });
        participants = await Promise.all(userPromises);
    } else if (Array.isArray(picture.participants)) {
        // If it's already an array of Users, use it directly
        participants = picture.participants;
    }

    // Handle uploadedBy - can be string ID or User object
    let uploadedBy: User;
    if (typeof picture.uploadedBy === "string") {
        uploadedBy = await getUserById(parseInt(picture.uploadedBy));
    } else {
        uploadedBy = picture.uploadedBy;
    }

    // Generate a new ID if not provided (for new uploads)
    let pictureId = picture.id;
    if (!pictureId || pictureId === 0) {
        // Get the highest existing ID and add 1
        const allPictures = await getAllPictures();
        const maxId = allPictures.length > 0 
            ? Math.max(...allPictures.map(p => p.id))
            : 0;
        pictureId = maxId + 1;
    }

    // Convert UploadPicture to Picture
    const pictureData: Picture = {
        id: pictureId,
        title: picture.title,
        description: picture.description,
        img: imagePath, // Use the path from file upload, not the File object
        participants: participants,
        uploadedBy: uploadedBy,
        uploadedAt: picture.uploadedAt || new Date(),
        createdAt: picture.createdAt || new Date(),
        metadata: {
            views: 0,
            rating: [],
        },
    };

    return pictureData;
}

/**
 * Creates a picture in the database after file upload
 * Note: picture parameter should NOT contain File objects (they cause body size limit errors)
 */
export async function createPicture(picture: PictureMetadata, imagePath: string) {
    // Parse and convert UploadPicture to Picture
    const pictureData = await parseUploadPictureToBackend(picture, imagePath);
    
    // Add to database (await it!)
    await addPicture(pictureData);
    
    // Redirect to the picture detail page
    // Note: redirect() throws a special NEXT_REDIRECT error that Next.js handles
    // This is normal behavior, not an actual error
    redirect(`/pictures/${pictureData.id}/`);
}

