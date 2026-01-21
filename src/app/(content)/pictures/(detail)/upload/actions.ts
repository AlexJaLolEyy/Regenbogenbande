"use server"

import { checkUploadPermission } from '@/src/lib/auth-utils';
import { addPicture } from '@/src/lib/db/mutations/pictures';
import { PictureActionInput, parsePictureActionToBackend } from '@/src/lib/utils/picture-utils';
import { redirect } from 'next/navigation';

/**
 * Creates a picture in the database after file upload
 * Note: picture parameter should NOT contain File objects
 */
export async function createPicture(picture: PictureActionInput, imagePath: string, thumbnailPath?: string) {
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
            status: 'ACTIVE'
        };
    }

    // Parse and convert using extracted utility
    const pictureData = await parsePictureActionToBackend(picture, imagePath, thumbnailPath);

    // Add to database
    const createdPicture = await addPicture(pictureData);

    // Redirect to the picture detail page
    redirect(`/pictures/${createdPicture.id}/`);
}
