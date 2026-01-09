"use server";

import { requireAuth } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

export async function rateMedia(
  contentType: 'video' | 'picture' | 'quote',
  contentId: string,
  value: number
) {
  const session = await requireAuth();
  const userId = session.user.id;

  if (value < 1 || value > 5) {
    throw new Error("Invalid rating value. Must be between 1 and 5.");
  }

  await prisma.rating.upsert({
    where: {
      userId_videoId: contentType === 'video' ? { userId, videoId: contentId } : undefined,
      userId_pictureId: contentType === 'picture' ? { userId, pictureId: contentId } : undefined,
      userId_quoteId: contentType === 'quote' ? { userId, quoteId: contentId } : undefined,
    },
    update: {
      value,
    },
    create: {
      userId,
      value,
      videoId: contentType === 'video' ? contentId : undefined,
      pictureId: contentType === 'picture' ? contentId : undefined,
      quoteId: contentType === 'quote' ? contentId : undefined,
    },
  });

  revalidatePath(`/${contentType === 'quote' ? 'quotes' : contentType + 's'}/${contentId}`);
}

export async function getUserRating(
  contentType: 'video' | 'picture' | 'quote',
  contentId: string
) {
  const session = await requireAuth().catch(() => null);
  if (!session) return null;

  const rating = await prisma.rating.findFirst({
    where: {
      userId: session.user.id,
      videoId: contentType === 'video' ? contentId : undefined,
      pictureId: contentType === 'picture' ? contentId : undefined,
      quoteId: contentType === 'quote' ? contentId : undefined,
    },
  });

  return rating?.value || null;
}
