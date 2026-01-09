"use server"

import { editPicture, getPictureById, getUserById } from '@/src/app/current-storage/storage';
import { requireContentOwnerOrAdmin } from '@/src/lib/auth-utils';
import { Picture, UploadPicture, User } from '@/src/lib/types/types';
import { redirect } from 'next/navigation';

export async function parseUploadPictureToBackend(picture: UploadPicture): Promise<Picture> {
    let participants: User[] = [];

    if (typeof picture.participants === "string") {
        const userIds = (picture.participants as string).split(",").filter(id => id.trim() !== "");
        const userPromises = userIds.map((userid: string) => getUserById(userid));
        participants = (await Promise.all(userPromises)).filter(Boolean) as User[];
    } else if (Array.isArray(picture.participants)) {
        participants = picture.participants;
    }

    let uploadedBy: User;
    if (typeof picture.uploadedBy === "string") {
        uploadedBy = (await getUserById(picture.uploadedBy)) as User;
    } else {
        uploadedBy = picture.uploadedBy;
    }

    // Transform categoryId to category object
    const category = { id: picture.categoryId, name: '', iconUrl: null };

    return {
        ...picture,
        participants: participants.map(u => ({ type: 'user', data: u })),
        uploadedBy,
        category,
        imageUrl: (picture as any).imageUrl || "", 
        thumbnailUrl: (picture as any).thumbnailUrl || "",
    } as unknown as Picture;
}

export async function updatePicture(picture: UploadPicture) {
    if (!picture.id) throw new Error("Picture ID is required");

    const existingPicture = await getPictureById(picture.id);
    if (!existingPicture) throw new Error("Picture not found");

    await requireContentOwnerOrAdmin(existingPicture.uploadedBy.id);

    try {
        const backendPicture = await parseUploadPictureToBackend(picture);
        // Ensure we keep the original image path
        backendPicture.imageUrl = existingPicture.imageUrl;
        backendPicture.thumbnailUrl = existingPicture.thumbnailUrl;
        
        await editPicture(backendPicture);
        redirect(`/pictures/${picture.id}/`);
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("Error updating the picture : ", error);
    }
}
