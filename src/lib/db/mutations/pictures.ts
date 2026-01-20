import { checkOwnerOrAdmin, checkUploadPermission, requireOwner } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { deleteFile } from "@/src/lib/storage-adapter";
import { Picture } from "@/src/lib/types/types";
import { pictureDetailSelect, PrismaPictureDetail, transformPicture } from "../selects/pictures";

function extractKey(url: string) {
    if (!url) return null;
    if (url.includes("/uploads/")) {
        return url.split("/uploads/")[1];
    }
    return null;
}

export async function addPicture(picture: Picture): Promise<Picture> {
    try {
        await checkUploadPermission();

        if (!picture.uploadedBy?.id) {
            throw new Error("uploadedBy is required");
        }

        const uploader = await prisma.user.upsert({
            where: { id: picture.uploadedBy.id },
            update: {
                name: picture.uploadedBy.username,
                image: picture.uploadedBy.profilePicture,
            },
            create: {
                id: picture.uploadedBy.id,
                name: picture.uploadedBy.username,
                image: picture.uploadedBy.profilePicture,
            },
        });

        const createdPicture = await prisma.picture.create({
            data: {
                ...(picture.id ? { id: picture.id } : {}),
                title: picture.title,
                description: picture.description || null,
                imageUrl: picture.imageUrl,
                thumbnailUrl: picture.thumbnailUrl,
                uploadedById: uploader.id,
                categoryId: picture.category.id,
                uploadedAt: picture.uploadedAt,
                createdAt: picture.createdAt,
                views: picture.views || 0,
                isPublic: picture.isPublic ?? false,
                publishedAt: picture.publishedAt,
            },
            select: pictureDetailSelect,
        }) as PrismaPictureDetail;

        for (const participant of picture.participants) {
            await prisma.user.upsert({
                where: { id: participant.id },
                update: { name: participant.username, image: participant.profilePicture },
                create: { id: participant.id, name: participant.username, image: participant.profilePicture },
            });

            await prisma.pictureParticipant.create({
                data: { pictureId: createdPicture.id, userId: participant.id },
            });
        }

        return transformPicture(createdPicture);
    } catch (error) {
        console.error('Error adding picture:', error);
        throw error;
    }
}

export async function updatePicture(picture: Picture): Promise<Picture> {
    try {
        if (!picture.uploadedBy?.id) throw new Error("uploadedBy is required");
        await checkOwnerOrAdmin(picture.uploadedBy.id);

        const updatedPicture = await prisma.picture.update({
            where: { id: picture.id },
            data: {
                title: picture.title,
                description: picture.description || null,
                imageUrl: picture.imageUrl,
                thumbnailUrl: picture.thumbnailUrl,
                categoryId: picture.category.id,
                uploadedAt: picture.uploadedAt,
                createdAt: picture.createdAt,
                views: picture.views || 0,
                isPublic: picture.isPublic ?? false,
                publishedAt: picture.publishedAt,
            },
            select: pictureDetailSelect,
        }) as PrismaPictureDetail;

        await prisma.pictureParticipant.deleteMany({ where: { pictureId: picture.id } });

        for (const participant of picture.participants) {
            await prisma.user.upsert({
                where: { id: participant.id },
                update: { name: participant.username, image: participant.profilePicture },
                create: { id: participant.id, name: participant.username, image: participant.profilePicture },
            });

            await prisma.pictureParticipant.create({
                data: { pictureId: picture.id, userId: participant.id },
            });
        }

        return transformPicture(updatedPicture);
    } catch (error) {
        console.error('Error updating picture:', error);
        throw error;
    }
}

export async function deletePicture(pictureId: string): Promise<void> {
    try {
        const picture = await prisma.picture.findUnique({
            where: { id: pictureId },
            include: { uploadedBy: true }
        });

        if (!picture) throw new Error("Picture not found");
        await checkOwnerOrAdmin(picture.uploadedById);

        const imageKey = extractKey(picture.imageUrl);
        const thumbKey = extractKey(picture.thumbnailUrl);
        if (imageKey) await deleteFile(imageKey);
        if (thumbKey) await deleteFile(thumbKey);

        await prisma.picture.delete({ where: { id: pictureId } });
    } catch (error) {
        console.error('Error deleting picture:', error);
        throw error;
    }
}

export async function publishPicture(pictureId: string): Promise<void> {
    try {
        await requireOwner();
        await prisma.picture.update({
            where: { id: pictureId },
            data: { isPublic: true, publishedAt: new Date() },
        });
    } catch (error) {
        console.error('Error publishing picture:', error);
        throw error;
    }
}

export async function unpublishPicture(pictureId: string): Promise<void> {
    try {
        await requireOwner();
        await prisma.picture.update({
            where: { id: pictureId },
            data: { isPublic: false },
        });
    } catch (error) {
        console.error('Error unpublishing picture:', error);
        throw error;
    }
}
