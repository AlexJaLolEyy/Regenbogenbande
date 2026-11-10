"use server";

import { getSession, requireUploadPermission } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

type ContentType = 'video' | 'picture' | 'quote';

function targetKey(contentType: ContentType) {
  if (contentType !== 'video' && contentType !== 'picture' && contentType !== 'quote') {
    throw new Error("Invalid content type");
  }
  return `${contentType}Id` as 'videoId' | 'pictureId' | 'quoteId';
}

export async function rateMedia(
  contentType: ContentType,
  contentId: string,
  value: number
) {
  const session = await requireUploadPermission();
  const userId = session.user.id;

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error("Invalid rating value. Must be between 1 and 5.");
  }

  const key = targetKey(contentType);

  // Upsert the rating and refresh the denormalized aggregate atomically
  await prisma.$transaction(async (tx) => {
    const existing = await tx.rating.findFirst({ where: { userId, [key]: contentId }, select: { id: true } });
    if (existing) {
      await tx.rating.update({ where: { id: existing.id }, data: { value } });
    } else {
      await tx.rating.create({ data: { userId, value, [key]: contentId } });
    }

    const agg = await tx.rating.aggregate({
      where: { [key]: contentId },
      _avg: { value: true },
      _count: { _all: true },
    });
    const data = { ratingAvg: agg._avg.value, ratingCount: agg._count._all };

    if (contentType === 'video') await tx.video.update({ where: { id: contentId }, data });
    else if (contentType === 'picture') await tx.picture.update({ where: { id: contentId }, data });
    else await tx.quote.update({ where: { id: contentId }, data });
  });

  revalidatePath(`/${contentType === 'quote' ? 'quotes' : contentType + 's'}/${contentId}`);
  revalidateTag('analytics', 'max');
}

export async function getUserRating(
  contentType: ContentType,
  contentId: string
) {
  const session = await getSession();
  if (!session) return null;

  const rating = await prisma.rating.findFirst({
    where: {
      userId: session.user.id,
      [targetKey(contentType)]: contentId,
    },
  });

  return rating?.value || null;
}
