"use server"

import { requireContentOwnerOrAdmin } from '@/src/lib/auth-utils';
import { updatePicture } from '@/src/lib/db/mutations/pictures';
import { getPictureById } from '@/src/lib/db/selects/pictures';
import { parsePictureActionToBackend, PictureActionInput } from '@/src/lib/utils/picture-utils';
import { redirect } from 'next/navigation';

export async function updatePictureElement(picture: PictureActionInput) {
    if (!picture.id) throw new Error("Picture ID is required");

    const existingPicture = await getPictureById(picture.id);
    if (!existingPicture) throw new Error("Picture not found");

    await requireContentOwnerOrAdmin(existingPicture.uploadedBy.id);

    try {
        const backendPicture = await parsePictureActionToBackend(
            picture,
            existingPicture.imageUrl,
            existingPicture.thumbnailUrl
        );

        // Preserve metadata
        backendPicture.views = existingPicture.views;
        backendPicture.isPublic = existingPicture.isPublic;
        backendPicture.publishedAt = existingPicture.publishedAt;

        await updatePicture(backendPicture);
        redirect(`/pictures/${picture.id}/`);
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("Error updating the picture : ", error);
        throw error;
    }
}
