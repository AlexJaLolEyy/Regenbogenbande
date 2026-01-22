"use server"

import { requireAdmin } from "@/src/lib/auth-utils";
import { pictureListSelect, PrismaPictureList, transformPicture, transformPictureListItem } from "@/src/lib/db/selects/pictures";
import { PrismaQuoteList, quoteListSelect, transformQuote, transformQuoteListItem } from "@/src/lib/db/selects/quotes";
import { PrismaVideoList, transformVideo, transformVideoListItem, videoListSelect } from "@/src/lib/db/selects/videos";
import { prisma } from "@/src/lib/prisma";
import { Picture, PictureListItem, Quote, QuoteListItem, Video, VideoListItem } from "@/src/lib/types/types";
import { revalidatePath } from "next/cache";

export async function getPublishedContent(type: 'video' | 'picture' | 'quote', page: number = 1): Promise<{ items: (VideoListItem | PictureListItem | QuoteListItem)[], total: number }> {
    await requireAdmin();
    const limit = 20;
    const skip = (page - 1) * limit;

    try {
        if (type === 'video') {
            const [items, total] = await Promise.all([
                prisma.video.findMany({
                    where: { isPublic: true },
                    orderBy: { publishedAt: 'desc' },
                    select: videoListSelect,
                    skip,
                    take: limit,
                }),
                prisma.video.count({ where: { isPublic: true } })
            ]);
            return { items: (items as PrismaVideoList[]).map(transformVideoListItem), total };
        }

        if (type === 'picture') {
            const [items, total] = await Promise.all([
                prisma.picture.findMany({
                    where: { isPublic: true },
                    orderBy: { publishedAt: 'desc' },
                    select: pictureListSelect,
                    skip,
                    take: limit,
                }),
                prisma.picture.count({ where: { isPublic: true } })
            ]);
            return { items: (items as PrismaPictureList[]).map(transformPictureListItem), total };
        }

        if (type === 'quote') {
            const [items, total] = await Promise.all([
                prisma.quote.findMany({
                    where: { isPublic: true },
                    orderBy: { publishedAt: 'desc' },
                    select: quoteListSelect,
                    skip,
                    take: limit,
                }),
                prisma.quote.count({ where: { isPublic: true } })
            ]);
            return { items: (items as PrismaQuoteList[]).map(transformQuoteListItem), total };
        }

        return { items: [], total: 0 };
    } catch (error) {
        console.error("Error fetching published content:", error);
        throw error;
    }
}

export async function toggleVisibility(type: string, id: string, isPublic: boolean) {
    await requireAdmin();
    try {
        const data = {
            isPublic,
            publishedAt: isPublic ? new Date() : null
        };

        if (type === 'video') await prisma.video.update({ where: { id }, data });
        else if (type === 'picture') await prisma.picture.update({ where: { id }, data });
        else if (type === 'quote') await prisma.quote.update({ where: { id }, data });

        revalidatePath("/admin/content");
        revalidatePath("/"); // Revalidate lists
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update visibility" };
    }
}

export async function getContentById(type: string, id: string): Promise<Video | Picture | Quote | null> {
    await requireAdmin();
    try {
        if (type === 'video') {
            const item = await prisma.video.findUnique({
                where: { id },
                include: { uploadedBy: true, category: true, ratings: { select: { value: true } }, participants: { include: { user: true } } }
            });
            return item ? transformVideo(item as any) : null;
        }
        if (type === 'picture') {
            const item = await prisma.picture.findUnique({
                where: { id },
                include: { uploadedBy: true, category: true, ratings: { select: { value: true } }, participants: { include: { user: true } } }
            });
            return item ? transformPicture(item as any) : null;
        }
        if (type === 'quote') {
            const item = await prisma.quote.findUnique({
                where: { id },
                include: { uploadedBy: true, ratings: { select: { value: true } }, participants: { include: { user: true } }, messages: { include: { user: true } } }
            });
            return item ? transformQuote(item as any) : null;
        }
        return null;
    } catch (error) {
        return null;
    }
}
