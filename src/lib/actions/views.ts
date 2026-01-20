"use server";

import { requireAuth } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { headers } from "next/headers";

import { buildViewCacheKey, checkViewRateLimit } from "@/src/lib/services/rate-limiter";

export async function incrementView(
  contentType: 'video' | 'picture' | 'quote',
  contentId: string
) {
  const session = await requireAuth().catch(() => null);
  const userId = session?.user.id;
  const cooldown = 60 * 1000; // 60 seconds

  let shouldIncrement = false;

  if (userId) {
    // Check for logged in user view tracking (database-backed for persistence)
    if (contentType === 'video') {
      const lastView = await prisma.userVideoView.findUnique({
        where: { userId_videoId: { userId, videoId: contentId } }
      });
      if (!lastView || Date.now() - lastView.viewedAt.getTime() > cooldown) {
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
      if (!lastView || Date.now() - lastView.viewedAt.getTime() > cooldown) {
        await prisma.userPictureView.upsert({
          where: { userId_pictureId: { userId, pictureId: contentId } },
          update: { viewedAt: new Date() },
          create: { userId, pictureId: contentId }
        });
        shouldIncrement = true;
      }
    } else if (contentType === 'quote') {
      // Quotes don't have a view tracking table, use in-memory best-effort rate limiting
      const cacheKey = buildViewCacheKey('quote', contentId, userId);
      const result = checkViewRateLimit(cacheKey, cooldown);
      shouldIncrement = result.allowed;
    }
  } else {
    // Anonymous view tracking by IP (in-memory best-effort rate limiting)
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "unknown";
    const cacheKey = buildViewCacheKey(contentType, contentId, ip);
    const result = checkViewRateLimit(cacheKey, cooldown);
    shouldIncrement = result.allowed;
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
