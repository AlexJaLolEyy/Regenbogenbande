import { checkOwnerOrAdmin, checkUploadPermission, requireOwner } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { deleteFile } from "@/src/lib/storage-adapter";
import { Video } from "@/src/lib/types/types";
import { PrismaVideoDetail, transformVideo, videoDetailSelect } from "../selects/videos";

function extractKey(url: string) {
    if (!url) return null;
    if (url.includes("/uploads/")) {
        return url.split("/uploads/")[1];
    }
    return null;
}

export async function addVideo(video: Video): Promise<Video> {
    try {
        await checkUploadPermission();

        if (!video.uploadedBy?.id) {
            throw new Error("uploadedBy is required");
        }

        const uploader = await prisma.user.upsert({
            where: { id: video.uploadedBy.id },
            update: {
                name: video.uploadedBy.username,
                image: video.uploadedBy.profilePicture,
            },
            create: {
                id: video.uploadedBy.id,
                name: video.uploadedBy.username,
                image: video.uploadedBy.profilePicture,
            },
        });

        const createdVideo = await prisma.video.create({
            data: {
                ...(video.id ? { id: video.id } : {}),
                title: video.title,
                description: video.description || null,
                videoUrl: video.videoUrl,
                thumbnailUrl: video.thumbnailUrl,
                uploadedById: uploader.id,
                categoryId: video.category.id,
                uploadedAt: video.uploadedAt,
                createdAt: video.createdAt,
                views: video.views || 0,
                isPublic: video.isPublic ?? false,
                publishedAt: video.publishedAt,
            },
            select: videoDetailSelect,
        });

        for (const participant of video.participants) {
            await prisma.user.upsert({
                where: { id: participant.id },
                update: { name: participant.username, image: participant.profilePicture },
                create: { id: participant.id, name: participant.username, image: participant.profilePicture },
            });

            await prisma.videoParticipant.create({
                data: { videoId: createdVideo.id, userId: participant.id },
            });
        }

        return transformVideo(createdVideo as PrismaVideoDetail);
    } catch (error) {
        console.error('Error adding video:', error);
        throw error;
    }
}

export async function updateVideo(video: Video): Promise<Video> {
    try {
        if (!video.uploadedBy?.id) throw new Error("uploadedBy is required");
        await checkOwnerOrAdmin(video.uploadedBy.id);

        const updatedVideo = await prisma.video.update({
            where: { id: video.id },
            data: {
                title: video.title,
                description: video.description || null,
                videoUrl: video.videoUrl,
                thumbnailUrl: video.thumbnailUrl,
                categoryId: video.category.id,
                uploadedAt: video.uploadedAt,
                createdAt: video.createdAt,
                views: video.views || 0,
                isPublic: video.isPublic ?? false,
                publishedAt: video.publishedAt,
            },
            select: videoDetailSelect,
        });

        await prisma.videoParticipant.deleteMany({ where: { videoId: video.id } });

        for (const participant of video.participants) {
            await prisma.user.upsert({
                where: { id: participant.id },
                update: { name: participant.username, image: participant.profilePicture },
                create: { id: participant.id, name: participant.username, image: participant.profilePicture },
            });

            await prisma.videoParticipant.create({
                data: { videoId: video.id, userId: participant.id },
            });
        }

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
            include: { uploadedBy: true }
        });

        if (!video) throw new Error("Video not found");
        await checkOwnerOrAdmin(video.uploadedById);

        const videoKey = extractKey(video.videoUrl);
        const thumbKey = extractKey(video.thumbnailUrl);
        if (videoKey) await deleteFile(videoKey);
        if (thumbKey) await deleteFile(thumbKey);

        await prisma.video.delete({ where: { id: videoId } });
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
            data: { isPublic: false },
        });
    } catch (error) {
        console.error('Error unpublishing video:', error);
        throw error;
    }
}
