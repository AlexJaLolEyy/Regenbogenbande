"use server";

import { getEffectiveRole, getSession } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { createHash } from "crypto";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";

type ContentType = 'video' | 'picture' | 'quote';

const DEDUPE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

const PRISMA_TYPE = { video: 'VIDEO', picture: 'PICTURE', quote: 'QUOTE' } as const;

/** Anonymous viewers are identified by sha256(ip + daily salt), never stored raw. */
async function guestHash(): Promise<string> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const secret = process.env.BETTER_AUTH_SECRET || "";
  return createHash("sha256").update(`${ip}|${day}|${secret}`).digest("hex");
}

async function getContentMeta(contentType: ContentType, contentId: string) {
  const select = { uploadedById: true, isPublic: true } as const;
  const where = { id: contentId };
  if (contentType === 'video') return prisma.video.findUnique({ where, select });
  if (contentType === 'picture') return prisma.picture.findUnique({ where, select });
  return prisma.quote.findUnique({ where, select });
}

/**
 * Records a view once per viewer per content per 30 minutes.
 * Dedupe lives in the database (works across serverless instances).
 */
export async function incrementView(contentType: ContentType, contentId: string) {
  if (!(contentType in PRISMA_TYPE)) return { success: false };

  const session = await getSession();
  const role = getEffectiveRole(session);
  const meta = await getContentMeta(contentType, contentId);
  if (!meta) return { success: false };
  if (role === 'guest' && !meta.isPublic) return { success: false };

  // Guests (anonymous sessions) are tracked by hash; real users by id
  const userId = role === 'guest' ? null : session!.user.id;
  const viewerHash = userId ? null : await guestHash();
  const viewerKey = userId ?? viewerHash!;
  const type = PRISMA_TYPE[contentType];
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);

  const counted = await prisma.$transaction(async (tx) => {
    // Serialize concurrent views by the same viewer on the same content
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${contentId}:${viewerKey}`}))`;

    const recent = await tx.contentView.findFirst({
      where: {
        contentType: type,
        contentId,
        viewedAt: { gte: since },
        ...(userId ? { userId } : { viewerHash }),
      },
      select: { id: true },
    });
    if (recent) return false;

    await tx.contentView.create({
      data: { contentType: type, contentId, ownerId: meta.uploadedById, userId, viewerHash },
    });

    if (contentType === 'video') {
      await tx.video.update({ where: { id: contentId }, data: { views: { increment: 1 } } });
      if (userId) {
        await tx.userVideoView.upsert({
          where: { userId_videoId: { userId, videoId: contentId } },
          update: { lastViewedAt: new Date() },
          create: { userId, videoId: contentId },
        });
      }
    } else if (contentType === 'picture') {
      await tx.picture.update({ where: { id: contentId }, data: { views: { increment: 1 } } });
      if (userId) {
        await tx.userPictureView.upsert({
          where: { userId_pictureId: { userId, pictureId: contentId } },
          update: { lastViewedAt: new Date() },
          create: { userId, pictureId: contentId },
        });
      }
    } else {
      await tx.quote.update({ where: { id: contentId }, data: { views: { increment: 1 } } });
      if (userId) {
        await tx.userQuoteView.upsert({
          where: { userId_quoteId: { userId, quoteId: contentId } },
          update: { lastViewedAt: new Date() },
          create: { userId, quoteId: contentId },
        });
      }
    }
    return true;
  });

  if (counted) revalidateTag('analytics', 'max');
  return { success: true };
}
