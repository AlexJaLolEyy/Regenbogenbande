"use server"

import { requireAuth } from "@/src/lib/auth-utils"
import { prisma } from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateDisplayName(newName: string) {
    const session = await requireAuth()
    const userId = session.user.id

    if (!newName || newName.length < 2) {
        return { success: false, error: "Display name must be at least 2 characters long" }
    }

    if (newName.length > 32) {
        return { success: false, error: "Display name must be 32 characters or less" }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { name: newName }
        })
        revalidatePath("/profile")
        revalidatePath("/", "layout")
        return { success: true }
    } catch {
        return { success: false, error: "Failed to update display name" }
    }
}

export async function updateProfilePicture(url: string) {
    const session = await requireAuth()

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: url }
        })
        revalidatePath("/profile")
        revalidatePath("/", "layout")
        return { success: true }
    } catch {
        return { success: false, error: "Failed to update profile picture" }
    }
}

export async function getUserStats() {
    const session = await requireAuth();
    const userId = session.user.id;

    try {
        const [
            videoCount,
            pictureCount,
            quoteCount,
            ratings,
            videoViews,
            pictureViews,
            quoteViews
        ] = await Promise.all([
            prisma.video.count({ where: { uploadedById: userId } }),
            prisma.picture.count({ where: { uploadedById: userId } }),
            prisma.quote.count({ where: { uploadedById: userId } }),
            prisma.rating.findMany({ where: { userId }, select: { value: true } }),
            prisma.video.aggregate({ where: { uploadedById: userId }, _sum: { views: true } }),
            prisma.picture.aggregate({ where: { uploadedById: userId }, _sum: { views: true } }),
            prisma.quote.aggregate({ where: { uploadedById: userId }, _sum: { views: true } }),
        ]);

        // Monthly stats for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const [vHistory, pHistory, qHistory] = await Promise.all([
            prisma.video.findMany({
                where: { uploadedById: userId, createdAt: { gte: sixMonthsAgo } },
                select: { createdAt: true }
            }),
            prisma.picture.findMany({
                where: { uploadedById: userId, createdAt: { gte: sixMonthsAgo } },
                select: { createdAt: true }
            }),
            prisma.quote.findMany({
                where: { uploadedById: userId, createdAt: { gte: sixMonthsAgo } },
                select: { createdAt: true }
            }),
        ]);

        const monthlyActivity = Array.from({ length: 6 }).map((_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const monthLabel = date.toLocaleString('default', { month: 'short' });
            const month = date.getMonth();
            const year = date.getFullYear();

            const count =
                vHistory.filter(h => h.createdAt.getMonth() === month && h.createdAt.getFullYear() === year).length +
                pHistory.filter(h => h.createdAt.getMonth() === month && h.createdAt.getFullYear() === year).length +
                qHistory.filter(h => h.createdAt.getMonth() === month && h.createdAt.getFullYear() === year).length;

            return { label: monthLabel, count };
        });

        return {
            success: true,
            stats: {
                counts: {
                    videos: videoCount,
                    pictures: pictureCount,
                    quotes: quoteCount,
                    total: videoCount + pictureCount + quoteCount
                },
                ratings: {
                    count: ratings.length,
                    average: ratings.length > 0
                        ? (ratings.reduce((acc, r) => acc + r.value, 0) / ratings.length).toFixed(1)
                        : null
                },
                views: (videoViews._sum.views || 0) + (pictureViews._sum.views || 0) + (quoteViews._sum.views || 0),
                monthlyActivity
            }
        };
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return { success: false, error: "Failed to fetch stats" };
    }
}
