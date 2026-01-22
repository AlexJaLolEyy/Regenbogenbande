import { Prisma } from "@/src/generated/prisma";
import { Session } from "@/src/lib/auth";
import { getEffectiveRole } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { Video, VideoListItem } from "@/src/lib/types/types";
import { getDateRangeFilter, getSortOrder } from '@/src/lib/utils/date-filters';
import {
    calculateAvgRating,
    categorySelect,
    FetchOptions,
    transformUser,
    userSelect
} from "../shared";

export const videoListSelect = {
    id: true,
    title: true,
    thumbnailUrl: true,
    views: true,
    uploadedAt: true,
    createdAt: true,
    isPublic: true,
    publishedAt: true,
    uploadedBy: { select: userSelect },
    category: { select: categorySelect },
    participants: {
        select: {
            user: { select: userSelect }
        }
    },
    ratings: {
        select: {
            value: true
        }
    }
} as const;

export const videoDetailSelect = {
    ...videoListSelect,
    description: true,
    videoUrl: true,
} as const;

export type PrismaVideoList = Prisma.VideoGetPayload<{ select: typeof videoListSelect }>;
export type PrismaVideoDetail = Prisma.VideoGetPayload<{ select: typeof videoDetailSelect }>;

export function transformVideo(prismaVideo: PrismaVideoDetail): Video {
    return {
        id: prismaVideo.id,
        title: prismaVideo.title || '',
        description: prismaVideo.description || null,
        videoUrl: prismaVideo.videoUrl || '',
        thumbnailUrl: prismaVideo.thumbnailUrl || '',
        participants: prismaVideo.participants?.map(p => transformUser(p.user)) || [],
        uploadedBy: transformUser(prismaVideo.uploadedBy),
        uploadedAt: new Date(prismaVideo.uploadedAt),
        createdAt: new Date(prismaVideo.createdAt),
        views: prismaVideo.views || 0,
        category: prismaVideo.category ? {
            id: prismaVideo.category.id,
            name: prismaVideo.category.name,
            iconUrl: prismaVideo.category.iconUrl || null,
        } : { id: '', name: '', iconUrl: null },
        isPublic: prismaVideo.isPublic ?? false,
        publishedAt: prismaVideo.publishedAt ? new Date(prismaVideo.publishedAt) : null,
        averageRating: calculateAvgRating(prismaVideo.ratings),
    };
}

export function transformVideoListItem(prismaVideo: PrismaVideoList): VideoListItem {
    return {
        id: prismaVideo.id,
        title: prismaVideo.title || '',
        thumbnailUrl: prismaVideo.thumbnailUrl || '',
        participants: prismaVideo.participants?.map(p => transformUser(p.user)) || [],
        uploadedBy: transformUser(prismaVideo.uploadedBy),
        uploadedAt: new Date(prismaVideo.uploadedAt),
        createdAt: new Date(prismaVideo.createdAt),
        views: prismaVideo.views || 0,
        category: prismaVideo.category ? {
            id: prismaVideo.category.id,
            name: prismaVideo.category.name,
            iconUrl: prismaVideo.category.iconUrl || null,
        } : { id: '', name: '', iconUrl: null },
        averageRating: calculateAvgRating(prismaVideo.ratings),
        isPublic: prismaVideo.isPublic ?? false,
        publishedAt: prismaVideo.publishedAt ? new Date(prismaVideo.publishedAt) : null,
    };
}

export async function getVideosForList(session?: Session | null, options?: FetchOptions): Promise<VideoListItem[]> {
    try {
        const { page = 1, limit = 20, search, sort = 'newest', categoryId, dateRange } = options || {};
        const effectiveRole = session !== undefined ? getEffectiveRole(session) : "guest";

        const where: Prisma.VideoWhereInput = {};

        if (effectiveRole === "guest") {
            where.isPublic = true;
        }

        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (dateRange && dateRange !== 'all') {
            where.createdAt = getDateRangeFilter(dateRange);
        }

        const orderBy = getSortOrder(sort);

        const videos = await prisma.video.findMany({
            where,
            select: videoListSelect,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        });
        return videos.map(transformVideoListItem);
    } catch (error) {
        console.error('Error fetching videos for list:', error);
        return [];
    }
}

export async function getAllVideos(session?: Session | null, options?: FetchOptions): Promise<Video[]> {
    try {
        const { page = 1, limit = 20, search, sort = 'newest', categoryId, dateRange } = options || {};
        const effectiveRole = session !== undefined ? getEffectiveRole(session) : "guest";

        const where: Prisma.VideoWhereInput = {};

        if (effectiveRole === "guest") {
            where.isPublic = true;
        }

        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (dateRange && dateRange !== 'all') {
            where.createdAt = getDateRangeFilter(dateRange);
        }

        const orderBy = getSortOrder(sort);

        const videos = await prisma.video.findMany({
            where,
            select: videoDetailSelect,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        });
        return videos.map(transformVideo);
    } catch (error) {
        console.error('Error fetching videos:', error);
        return [];
    }
}

export async function getVideoById(id: string): Promise<Video | null> {
    try {
        const video = await prisma.video.findUnique({
            where: { id },
            select: videoDetailSelect,
        });
        return video ? transformVideo(video as PrismaVideoDetail) : null;
    } catch (error) {
        console.error('Error fetching video by ID:', error);
        return null;
    }
}
