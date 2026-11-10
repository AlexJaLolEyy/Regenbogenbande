import { Prisma } from "@/src/generated/prisma";
import { Session } from "@/src/lib/auth";
import { getEffectiveRole } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { Picture, PictureListItem } from "@/src/lib/types/types";
import { getDateRangeFilter } from '@/src/lib/utils/date-filters';
import {
    categorySelect,
    FetchOptions,
    buildListQuery,
    transformUser,
    userSelect,
    type PagedResult,
} from "../shared";

export const pictureListSelect = {
    id: true,
    title: true,
    thumbnailUrl: true,
    imageUrl: true,
    views: true,
    uploadedAt: true,
    createdAt: true,
    isPublic: true,
    publishedAt: true,
    uploadedBy: { select: userSelect },
    category: { select: categorySelect },
    participants: { select: { user: { select: userSelect } } },
    ratingAvg: true,
    ratingCount: true,
} as const;

export const pictureDetailSelect = {
    ...pictureListSelect,
    description: true,
} as const;

export type PrismaPictureList = Prisma.PictureGetPayload<{ select: typeof pictureListSelect }>;
export type PrismaPictureDetail = Prisma.PictureGetPayload<{ select: typeof pictureDetailSelect }>;

export function transformPicture(prismaPicture: PrismaPictureDetail): Picture {
    return {
        id: prismaPicture.id,
        title: prismaPicture.title || '',
        description: prismaPicture.description || null,
        imageUrl: prismaPicture.imageUrl || '',
        thumbnailUrl: prismaPicture.thumbnailUrl || '',
        participants: prismaPicture.participants?.map(p => transformUser(p.user)) || [],
        uploadedBy: transformUser(prismaPicture.uploadedBy),
        uploadedAt: new Date(prismaPicture.uploadedAt),
        createdAt: new Date(prismaPicture.createdAt),
        views: prismaPicture.views || 0,
        category: prismaPicture.category ? {
            id: prismaPicture.category.id,
            name: prismaPicture.category.name,
            iconUrl: prismaPicture.category.iconUrl || null,
        } : { id: '', name: '', iconUrl: null },
        isPublic: prismaPicture.isPublic ?? false,
        publishedAt: prismaPicture.publishedAt ? new Date(prismaPicture.publishedAt) : null,
        averageRating: prismaPicture.ratingAvg ?? undefined,
    };
}

export function transformPictureListItem(prismaPicture: PrismaPictureList): PictureListItem {
    return {
        id: prismaPicture.id,
        title: prismaPicture.title || '',
        thumbnailUrl: prismaPicture.thumbnailUrl || prismaPicture.imageUrl || '',
        participants: prismaPicture.participants?.map(p => transformUser(p.user)) || [],
        uploadedBy: transformUser(prismaPicture.uploadedBy),
        uploadedAt: new Date(prismaPicture.uploadedAt),
        createdAt: new Date(prismaPicture.createdAt),
        views: prismaPicture.views || 0,
        category: prismaPicture.category ? {
            id: prismaPicture.category.id,
            name: prismaPicture.category.name,
            iconUrl: prismaPicture.category.iconUrl || null,
        } : { id: '', name: '', iconUrl: null },
        averageRating: prismaPicture.ratingAvg ?? undefined,
        isPublic: prismaPicture.isPublic ?? false,
        publishedAt: prismaPicture.publishedAt ? new Date(prismaPicture.publishedAt) : null,
    };
}

export async function getPicturesForList(session?: Session | null, options?: FetchOptions): Promise<PagedResult<PictureListItem>> {
    try {
        const { page = 1, limit = 20, search, sort = 'newest', categoryId, dateRange, participantId, unseenOnly } = options || {};
        const effectiveRole = session !== undefined ? getEffectiveRole(session) : "guest";

        const where: Prisma.PictureWhereInput = {};

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

        const total = await prisma.picture.count({ where });
        const q = await buildListQuery(sort, where, page, limit, (w) => prisma.picture.findMany({ where: w, select: { id: true } }));

        const pictures = await prisma.picture.findMany({
            where: q.where as typeof where,
            select: pictureListSelect,
            orderBy: q.orderBy,
            skip: q.skip,
            take: q.take,
        });
        const items = q.reorder(pictures).map(transformPictureListItem);
        if (viewerId && items.length > 0) {
            const seen = new Set(
                (
                    await prisma.userPictureView.findMany({
                        where: { userId: viewerId, pictureId: { in: items.map((i) => i.id) } },
                        select: { pictureId: true },
                    })
                ).map((v) => v.pictureId)
            );
            for (const item of items) item.isSeen = item.uploadedBy.id === viewerId || seen.has(item.id);
        }
        return { items, total };
    } catch (error) {
        console.error('Error fetching pictures for list:', error);
        return { items: [], total: 0 };
    }
}

export async function getAllPictures(session?: Session | null, options?: FetchOptions): Promise<Picture[]> {
    try {
        const { page = 1, limit = 20, search, sort = 'newest', categoryId, dateRange } = options || {};
        const effectiveRole = session !== undefined ? getEffectiveRole(session) : "guest";

        const where: Prisma.PictureWhereInput = {};

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

        const total = await prisma.picture.count({ where });
        const q = await buildListQuery(sort, where, page, limit, (w) => prisma.picture.findMany({ where: w, select: { id: true } }));

        const pictures = await prisma.picture.findMany({
            where: q.where as typeof where,
            select: pictureDetailSelect,
            orderBy: q.orderBy,
            skip: q.skip,
            take: q.take,
        }) as PrismaPictureDetail[];
        return q.reorder(pictures).map(transformPicture);
    } catch (error) {
        console.error('Error fetching pictures:', error);
        return [];
    }
}

/** Guests only get public pictures; pass the session (or null) so the rule is always applied. */
export async function getPictureById(id: string, session: Session | null): Promise<Picture | null> {
    try {
        const where: Prisma.PictureWhereInput = { id: String(id) };
        if (getEffectiveRole(session) === "guest") {
            where.isPublic = true;
        }
        const picture = await prisma.picture.findFirst({
            where,
            select: pictureDetailSelect,
        });

        if (!picture) return null;
        return transformPicture(picture);
    } catch (error) {
        console.error('Error fetching picture by id:', error);
        return null;
    }
}
