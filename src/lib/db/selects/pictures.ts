import { Prisma } from "@/src/generated/prisma";
import { Session } from "@/src/lib/auth";
import { getEffectiveRole } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { Picture, PictureListItem } from "@/src/lib/types/types";
import { getDateRangeFilter, getSortOrder } from '@/src/lib/utils/date-filters';
import {
    calculateAvgRating,
    categorySelect,
    FetchOptions,
    transformUser,
    userSelect
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
    ratings: { select: { value: true } },
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
        averageRating: calculateAvgRating(prismaPicture.ratings),
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
        averageRating: calculateAvgRating(prismaPicture.ratings),
    };
}

export async function getPicturesForList(session?: Session | null, options?: FetchOptions): Promise<PictureListItem[]> {
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

        const orderBy = getSortOrder(sort);

        const pictures = await prisma.picture.findMany({
            where,
            select: pictureListSelect,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        });
        return pictures.map(transformPictureListItem);
    } catch (error) {
        console.error('Error fetching pictures for list:', error);
        return [];
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

        const orderBy = getSortOrder(sort);

        const pictures = await prisma.picture.findMany({
            where,
            select: pictureDetailSelect,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        }) as PrismaPictureDetail[];
        return pictures.map(transformPicture);
    } catch (error) {
        console.error('Error fetching pictures:', error);
        return [];
    }
}

export async function getPictureById(id: string): Promise<Picture | null> {
    try {
        const picture = await prisma.picture.findUnique({
            where: { id: String(id) },
            select: pictureDetailSelect,
        });

        if (!picture) return null;
        return transformPicture(picture);
    } catch (error) {
        console.error('Error fetching picture by id:', error);
        return null;
    }
}
