"use server";

import { requireAuth } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { headers } from "next/headers";

// In-memory cache for rate limiting anonymous views by IP
// Note: This only works if the server doesn't restart frequently (like in serverless)
// but for a small friend group app it's a good start.
const anonymousViewCache = new Map<string, number>();

export async function incrementView(
  contentType: 'video' | 'picture' | 'quote',
  contentId: string
) {
  const session = await requireAuth().catch(() => null);
  const userId = session?.user.id;
  const now = Date.now();
  const cooldown = 60 * 1000; // 60 seconds

  let shouldIncrement = false;

  if (userId) {
    // Check for logged in user view tracking
    if (contentType === 'video') {
      const lastView = await prisma.userVideoView.findUnique({
        where: { userId_videoId: { userId, videoId: contentId } }
      });
      if (!lastView || now - lastView.viewedAt.getTime() > cooldown) {
        await prisma.userVideoView.upsert({
          where: { userId_videoId: { userId, videoId: contentId } },
          update: { viewedAt: new Date() },
          create: { userId, videoId: contentId }
        });
        shouldIncrement = true;
      }
    } else if (contentType === 'picture') {
      const lastView = await prisma.userPictureView.findUnique({
        where: { userId_pictureId: { userId, pictureId: contentId } }
      });
      if (!lastView || now - lastView.viewedAt.getTime() > cooldown) {
        await prisma.userPictureView.upsert({
          where: { userId_pictureId: { userId, pictureId: contentId } },
          update: { viewedAt: new Date() },
          create: { userId, pictureId: contentId }
        });
        shouldIncrement = true;
      }
    } else if (contentType === 'quote') {
      // Quotes don't have a view tracking table, use session storage/cache pattern
      const cacheKey = `quote_${userId}_${contentId}`;
      const lastView = anonymousViewCache.get(cacheKey);
      if (!lastView || now - lastView > cooldown) {
        anonymousViewCache.set(cacheKey, now);
        shouldIncrement = true;
      }
    }
  } else {
    // Anonymous view tracking by IP
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "unknown";
    const cacheKey = `${contentType}_${ip}_${contentId}`;
    const lastView = anonymousViewCache.get(cacheKey);

    if (!lastView || now - lastView > cooldown) {
      anonymousViewCache.set(cacheKey, now);
      shouldIncrement = true;
    }
  }

  if (shouldIncrement) {
    if (contentType === 'video') {
      await prisma.video.update({
        where: { id: contentId },
        data: { views: { increment: 1 } }
      });
    } else if (contentType === 'picture') {
      await prisma.picture.update({
        where: { id: contentId },
        data: { views: { increment: 1 } }
      });
    } else if (contentType === 'quote') {
      await prisma.quote.update({
        where: { id: contentId },
        data: { views: { increment: 1 } }
      });
    }
  }

  return { success: true };
}
