import { checkOwnerOrAdmin, checkUploadPermission, getEffectiveRole, requireOwner } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { revalidateTag } from "next/cache";
import { deleteFile, extractStorageKey } from "@/src/lib/storage-adapter";
import { Picture } from "@/src/lib/types/types";
import { filterExistingUserIds } from "../shared";
import { pictureDetailSelect, PrismaPictureDetail, transformPicture } from "../selects/pictures";

export async function addPicture(picture: Picture): Promise<Picture> {
    try {
        const session = await checkUploadPermission();
        // Only the owner can publish; everyone else's uploads start private.
        const isOwner = getEffectiveRole(session) === "owner";
        const participantIds = await filterExistingUserIds(picture.participants.map((p) => p.id));

        const createdPicture = await prisma.$transaction(async (tx) => {
            const created = await tx.picture.create({
                data: {
                    title: picture.title,
                    description: picture.description || null,
                    imageUrl: picture.imageUrl,
                    thumbnailUrl: picture.thumbnailUrl,
                    // Always the signed-in user, never a client-supplied ID
                    uploadedById: session.user.id,
                    categoryId: picture.category.id,
                    uploadedAt: picture.uploadedAt,
                    createdAt: picture.createdAt,
                    views: 0,
                    isPublic: isOwner ? (picture.isPublic ?? false) : false,
                    publishedAt: isOwner && picture.isPublic ? (picture.publishedAt ?? new Date()) : null,
                },
                select: { id: true },
            });

            if (participantIds.length > 0) {
                await tx.pictureParticipant.createMany({
                    data: participantIds.map((userId) => ({ pictureId: created.id, userId })),
                    skipDuplicates: true,
                });
            }

            return tx.picture.findUniqueOrThrow({ where: { id: created.id }, select: pictureDetailSelect });
        }) as PrismaPictureDetail;

        revalidateTag('analytics', 'max');
        return transformPicture(createdPicture);
    } catch (error) {
        console.error('Error adding picture:', error);
        throw error;
    }
}

export async function updatePicture(picture: Picture): Promise<Picture> {
    try {
        // Ownership comes from the database, not from the client payload
        const existing = await prisma.picture.findUnique({
            where: { id: picture.id },
            select: { uploadedById: true },
        });
        if (!existing) throw new Error("Picture not found");
        await checkOwnerOrAdmin(existing.uploadedById);

        const participantIds = await filterExistingUserIds(picture.participants.map((p) => p.id));

        // isPublic / publishedAt / views are intentionally not editable here
        const updatedPicture = await prisma.$transaction(async (tx) => {
            await tx.picture.update({
                where: { id: picture.id },
                data: {
                    title: picture.title,
                    description: picture.description || null,
                    imageUrl: picture.imageUrl,
                    thumbnailUrl: picture.thumbnailUrl,
                    categoryId: picture.category.id,
                    uploadedAt: picture.uploadedAt,
                    createdAt: picture.createdAt,
                },
            });

            await tx.pictureParticipant.deleteMany({ where: { pictureId: picture.id } });
            if (participantIds.length > 0) {
                await tx.pictureParticipant.createMany({
                    data: participantIds.map((userId) => ({ pictureId: picture.id, userId })),
                    skipDuplicates: true,
                });
            }

            return tx.picture.findUniqueOrThrow({ where: { id: picture.id }, select: pictureDetailSelect });
        }) as PrismaPictureDetail;

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
            select: { uploadedById: true, imageUrl: true, thumbnailUrl: true },
        });

        if (!picture) throw new Error("Picture not found");
        await checkOwnerOrAdmin(picture.uploadedById);

        await prisma.picture.delete({ where: { id: pictureId } });
        revalidateTag('analytics', 'max');

        // Best effort: a failed storage delete must not resurrect the DB row
        for (const key of [extractStorageKey(picture.imageUrl), extractStorageKey(picture.thumbnailUrl)]) {
            if (key) await deleteFile(key).catch((e) => console.error('Failed to delete R2 object', key, e));
        }
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
            data: { isPublic: false, publishedAt: null },
        });
    } catch (error) {
        console.error('Error unpublishing picture:', error);
        throw error;
    }
}
