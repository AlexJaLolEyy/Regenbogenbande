import { checkOwnerOrAdmin, checkUploadPermission, getEffectiveRole, requireOwner } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { revalidateTag } from "next/cache";
import { deleteFile, extractStorageKey } from "@/src/lib/storage-adapter";
import { Video } from "@/src/lib/types/types";
import { filterExistingUserIds } from "../shared";
import { PrismaVideoDetail, transformVideo, videoDetailSelect } from "../selects/videos";

export async function addVideo(video: Video): Promise<Video> {
    try {
        const session = await checkUploadPermission();
        // Only the owner can publish; everyone else's uploads start private.
        const isOwner = getEffectiveRole(session) === "owner";
        const participantIds = await filterExistingUserIds(video.participants.map((p) => p.id));

        const createdVideo = await prisma.$transaction(async (tx) => {
            const created = await tx.video.create({
                data: {
                    title: video.title,
                    description: video.description || null,
                    videoUrl: video.videoUrl,
                    thumbnailUrl: video.thumbnailUrl,
                    // Always the signed-in user, never a client-supplied ID
                    uploadedById: session.user.id,
                    categoryId: video.category.id,
                    uploadedAt: video.uploadedAt,
                    createdAt: video.createdAt,
                    views: 0,
                    isPublic: isOwner ? (video.isPublic ?? false) : false,
                    publishedAt: isOwner && video.isPublic ? (video.publishedAt ?? new Date()) : null,
                },
                select: { id: true },
            });

            if (participantIds.length > 0) {
                await tx.videoParticipant.createMany({
                    data: participantIds.map((userId) => ({ videoId: created.id, userId })),
                    skipDuplicates: true,
                });
            }

            return tx.video.findUniqueOrThrow({ where: { id: created.id }, select: videoDetailSelect });
        });

        revalidateTag('analytics', 'max');
        return transformVideo(createdVideo as PrismaVideoDetail);
    } catch (error) {
        console.error('Error adding video:', error);
        throw error;
    }
}

export async function updateVideo(video: Video): Promise<Video> {
    try {
        // Ownership comes from the database, not from the client payload
        const existing = await prisma.video.findUnique({
            where: { id: video.id },
            select: { uploadedById: true },
        });
        if (!existing) throw new Error("Video not found");
        await checkOwnerOrAdmin(existing.uploadedById);

        const participantIds = await filterExistingUserIds(video.participants.map((p) => p.id));

        // isPublic / publishedAt / views are intentionally not editable here
        const updatedVideo = await prisma.$transaction(async (tx) => {
            await tx.video.update({
                where: { id: video.id },
                data: {
                    title: video.title,
                    description: video.description || null,
                    videoUrl: video.videoUrl,
                    thumbnailUrl: video.thumbnailUrl,
                    categoryId: video.category.id,
                    uploadedAt: video.uploadedAt,
                    createdAt: video.createdAt,
                },
            });

            await tx.videoParticipant.deleteMany({ where: { videoId: video.id } });
            if (participantIds.length > 0) {
                await tx.videoParticipant.createMany({
                    data: participantIds.map((userId) => ({ videoId: video.id, userId })),
                    skipDuplicates: true,
                });
            }

            return tx.video.findUniqueOrThrow({ where: { id: video.id }, select: videoDetailSelect });
        });

        return transformVideo(updatedVideo as PrismaVideoDetail);
    } catch (error) {
        console.error('Error updating video:', error);
        throw error;
    }
}

export async function deleteVideo(videoId: string): Promise<void> {
    try {
        const video = await prisma.video.findUnique({
            where: { id: videoId },
            select: { uploadedById: true, videoUrl: true, thumbnailUrl: true },
        });

        if (!video) throw new Error("Video not found");
        await checkOwnerOrAdmin(video.uploadedById);

        await prisma.video.delete({ where: { id: videoId } });
        revalidateTag('analytics', 'max');

        // Best effort: a failed storage delete must not resurrect the DB row
        for (const key of [extractStorageKey(video.videoUrl), extractStorageKey(video.thumbnailUrl)]) {
            if (key) await deleteFile(key).catch((e) => console.error('Failed to delete R2 object', key, e));
        }
    } catch (error) {
        console.error('Error deleting video:', error);
        throw error;
    }
}

export async function publishVideo(videoId: string): Promise<void> {
    try {
        await requireOwner();
        await prisma.video.update({
            where: { id: videoId },
            data: { isPublic: true, publishedAt: new Date() },
        });
    } catch (error) {
        console.error('Error publishing video:', error);
        throw error;
    }
}

export async function unpublishVideo(videoId: string): Promise<void> {
    try {
        await requireOwner();
        await prisma.video.update({
            where: { id: videoId },
            data: { isPublic: false, publishedAt: null },
        });
    } catch (error) {
        console.error('Error unpublishing video:', error);
        throw error;
    }
}
