import { Prisma } from "@/src/generated/prisma";
import { Session } from "@/src/lib/auth";
import { getEffectiveRole } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { Video, VideoListItem } from "@/src/lib/types/types";
import { getDateRangeFilter } from '@/src/lib/utils/date-filters';
import {
    categorySelect,
    FetchOptions,
    buildListQuery,
    transformUser,
    userSelect,
    type PagedResult,
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
    ratingAvg: true,
    ratingCount: true,
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
        averageRating: prismaVideo.ratingAvg ?? undefined,
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
        averageRating: prismaVideo.ratingAvg ?? undefined,
        isPublic: prismaVideo.isPublic ?? false,
        publishedAt: prismaVideo.publishedAt ? new Date(prismaVideo.publishedAt) : null,
    };
}

export async function getVideosForList(session?: Session | null, options?: FetchOptions): Promise<PagedResult<VideoListItem>> {
    try {
        const { page = 1, limit = 20, search, sort = 'newest', categoryId, dateRange, participantId, unseenOnly } = options || {};
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

        const viewerId = effectiveRole === "guest" ? null : session?.user?.id ?? null;

        if (participantId) {
            where.participants = { some: { userId: participantId } };
        }

        if (unseenOnly && viewerId) {
            where.userViews = { none: { userId: viewerId } };
            where.uploadedById = { not: viewerId };
        }

        const total = await prisma.video.count({ where });
        const q = await buildListQuery(sort, where, page, limit, (w) => prisma.video.findMany({ where: w, select: { id: true } }));

        const videos = await prisma.video.findMany({
            where: q.where as typeof where,
            select: videoListSelect,
            orderBy: q.orderBy,
            skip: q.skip,
            take: q.take,
        });
        const items = q.reorder(videos).map(transformVideoListItem);
        if (viewerId && items.length > 0) {
            const seen = new Set(
                (
                    await prisma.userVideoView.findMany({
                        where: { userId: viewerId, videoId: { in: items.map((i) => i.id) } },
                        select: { videoId: true },
                    })
                ).map((v) => v.videoId)
            );
            for (const item of items) item.isSeen = item.uploadedBy.id === viewerId || seen.has(item.id);
        }
        return { items, total };
    } catch (error) {
        console.error('Error fetching videos for list:', error);
        return { items: [], total: 0 };
    }
}

export async function getAllVideos(session?: Session | null, options?: FetchOptions): Promise<Video[]> {
    try {
        const { page = 1, limit = 15, search, sort = 'newest', categoryId, dateRange } = options || {};
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

        const total = await prisma.video.count({ where });
        const q = await buildListQuery(sort, where, page, limit, (w) => prisma.video.findMany({ where: w, select: { id: true } }));

        const videos = await prisma.video.findMany({
            where: q.where as typeof where,
            select: videoDetailSelect,
            orderBy: q.orderBy,
            skip: q.skip,
            take: q.take,
        });
        return q.reorder(videos).map(transformVideo);
    } catch (error) {
        console.error('Error fetching videos:', error);
        return [];
    }
}

/** Guests only get public videos; pass the session (or null) so the rule is always applied. */
export async function getVideoById(id: string, session: Session | null): Promise<Video | null> {
    try {
        const where: Prisma.VideoWhereInput = { id };
        if (getEffectiveRole(session) === "guest") {
            where.isPublic = true;
        }
        const video = await prisma.video.findFirst({
            where,
            select: videoDetailSelect,
        });
        return video ? transformVideo(video as PrismaVideoDetail) : null;
    } catch (error) {
        console.error('Error fetching video by ID:', error);
        return null;
    }
}
