"use server";

import { prisma } from "@/src/lib/prisma";

export async function getVideoRecommendations(videoId: string, categoryId: string, limit: number = 5) {
  console.log(`[Recommendations] Fetching videos for videoId: ${videoId}, categoryId: ${categoryId}`);

  // 1. Try to get videos from the same category
  let videos = await prisma.video.findMany({
    where: {
      categoryId,
      id: { not: videoId },
      isPublic: false,
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

  console.log(`[Recommendations] Found ${videos.length} videos in same category`);

  // 2. If we don't have enough, fill with other public videos
  if (videos.length < limit) {
    const remainingLimit = limit - videos.length;
    const existingIds = [videoId, ...videos.map(v => v.id)];

    const additionalVideos = await prisma.video.findMany({
      where: {
        id: { notIn: existingIds },
        isPublic: true,
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

    console.log(`[Recommendations] Found ${additionalVideos.length} additional videos`);
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

export async function getPictureRecommendations(pictureId: string, categoryId: string, limit: number = 5) {
  console.log(`[Recommendations] Fetching pictures for pictureId: ${pictureId}, categoryId: ${categoryId}`);

  // 1. Try to get pictures from the same category
  let pictures = await prisma.picture.findMany({
    where: {
      categoryId,
      id: { not: pictureId },
      isPublic: true,
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

  console.log(`[Recommendations] Found ${pictures.length} pictures in same category`);

  // 2. If we don't have enough, fill with other public pictures
  if (pictures.length < limit) {
    const remainingLimit = limit - pictures.length;
    const existingIds = [pictureId, ...pictures.map(p => p.id)];

    const additionalPictures = await prisma.picture.findMany({
      where: {
        id: { notIn: existingIds },
        isPublic: true,
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

    console.log(`[Recommendations] Found ${additionalPictures.length} additional pictures`);
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

