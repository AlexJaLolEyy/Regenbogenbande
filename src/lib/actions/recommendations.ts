"use server";

import { getEffectiveRole, requireAuth } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";

/** Guests may only see public content; clamp limit to a sane range. */
async function visibility(limit: number) {
  const session = await requireAuth();
  const publicOnly = getEffectiveRole(session) === "guest" ? { isPublic: true } : {};
  return { publicOnly, limit: Math.min(Math.max(Math.floor(limit) || 5, 1), 20) };
}

export async function getVideoRecommendations(videoId: string, categoryId: string, requestedLimit: number = 5) {
  const { publicOnly, limit } = await visibility(requestedLimit);

  // 1. Try to get videos from the same category
  let videos = await prisma.video.findMany({
    where: {
      ...publicOnly,
      categoryId,
      id: { not: videoId },
    },
    take: limit,
    orderBy: [
      { views: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // 2. If we don't have enough, fill with other videos
  if (videos.length < limit) {
    const remainingLimit = limit - videos.length;
    const existingIds = [videoId, ...videos.map(v => v.id)];

    const additionalVideos = await prisma.video.findMany({
      where: {
        ...publicOnly,
        id: { notIn: existingIds },
      },
      take: remainingLimit,
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    videos = [...videos, ...additionalVideos];
  }

  return videos.map(video => ({
    id: video.id,
    title: video.title,
    thumbnailUrl: video.thumbnailUrl,
    views: video.views,
    uploadedBy: {
      id: video.uploadedBy.id,
      username: video.uploadedBy.name,
      profilePicture: video.uploadedBy.image,
    },
    createdAt: video.createdAt,
  }));
}

export async function getPictureRecommendations(pictureId: string, categoryId: string, requestedLimit: number = 5) {
  const { publicOnly, limit } = await visibility(requestedLimit);

  // 1. Try to get pictures from the same category
  let pictures = await prisma.picture.findMany({
    where: {
      ...publicOnly,
      categoryId,
      id: { not: pictureId },
    },
    take: limit,
    orderBy: [
      { views: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // 2. If we don't have enough, fill with other pictures
  if (pictures.length < limit) {
    const remainingLimit = limit - pictures.length;
    const existingIds = [pictureId, ...pictures.map(p => p.id)];

    const additionalPictures = await prisma.picture.findMany({
      where: {
        ...publicOnly,
        id: { notIn: existingIds },
      },
      take: remainingLimit,
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    pictures = [...pictures, ...additionalPictures];
  }

  return pictures.map(picture => ({
    id: picture.id,
    title: picture.title,
    imageUrl: picture.imageUrl,
    thumbnailUrl: picture.thumbnailUrl,
    views: picture.views,
    uploadedBy: {
      id: picture.uploadedBy.id,
      username: picture.uploadedBy.name,
      profilePicture: picture.uploadedBy.image,
    },
    createdAt: picture.createdAt,
  }));
}

