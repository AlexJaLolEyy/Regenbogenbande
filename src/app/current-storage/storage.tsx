'use server'

import { Session } from "@/src/lib/auth";
import {
  checkOwnerOrAdmin,
  checkUploadPermission,
  getEffectiveRole,
  requireOwner
} from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { deleteFile } from "@/src/lib/storage-adapter";
import { Prisma } from "@/src/generated/prisma";
import { SortOption, DateRange } from '@/src/lib/types/filters';
import { getDateRangeFilter, getSortOrder } from '@/src/lib/utils/date-filters';
import {
  Category,
  Participant,
  ParticipantPlaceholder,
  Picture,
  Quote,
  Rating,
  User,
  Video
} from "@/src/lib/types/types";

// Note: After schema changes, run `prisma generate` to regenerate types

// ============================================
// TRANSFORMATION FUNCTIONS
// ============================================
// Convert Prisma data (String IDs) to TypeScript interfaces (number IDs)

function transformUser(prismaUser: any): User {
  if (!prismaUser) return null as any;

  return {
    id: prismaUser.id,
    username: prismaUser.name || '',
    profilePicture: prismaUser.image || null,
    status: prismaUser.status,
  };
}

function transformPlaceholder(prismaPlaceholder: any): ParticipantPlaceholder {
  if (!prismaPlaceholder) return null as any;

  return {
    id: prismaPlaceholder.id,
    displayName: prismaPlaceholder.displayName || '',
    discordId: prismaPlaceholder.discordId || null,
    claimedById: prismaPlaceholder.claimedById || null,
  };
}

function transformParticipant(participantRelation: any): Participant {
  // XOR: exactly one of user or placeholder should be set
  if (participantRelation.user) {
    return {
      type: "user",
      data: transformUser(participantRelation.user),
    };
  }
  if (participantRelation.placeholder) {
    return {
      type: "placeholder",
      data: transformPlaceholder(participantRelation.placeholder),
    };
  }
  throw new Error("Invalid participant: neither user nor placeholder");
}

function transformRating(prismaRating: any): Rating {
  if (!prismaRating) return null as any;

  return {
    userId: prismaRating.userId || '',
    value: prismaRating.value || 0,
  };
}

function calculateAvgRating(ratings: { value: number }[]): number | undefined {
  if (!ratings || ratings.length === 0) return undefined;
  const sum = ratings.reduce((acc, r) => acc + r.value, 0);
  return sum / ratings.length;
}

function transformVideo(prismaVideo: any): Video {
  if (!prismaVideo) return null as any;

  return {
    id: prismaVideo.id,
    title: prismaVideo.title || '',
    description: prismaVideo.description || null,
    videoUrl: prismaVideo.videoUrl || '',
    thumbnailUrl: prismaVideo.thumbnailUrl || '',
    participants: prismaVideo.participants?.map((p: any) => transformParticipant(p)) || [],
    uploadedBy: transformUser(prismaVideo.uploadedBy),
    uploadedAt: prismaVideo.uploadedAt ? new Date(prismaVideo.uploadedAt) : new Date(),
    createdAt: prismaVideo.createdAt ? new Date(prismaVideo.createdAt) : new Date(),
    views: prismaVideo.views || 0,
    category: prismaVideo.category ? {
      id: prismaVideo.category.id,
      name: prismaVideo.category.name,
      iconUrl: prismaVideo.category.iconUrl || null,
    } : { id: '', name: '', iconUrl: null },
    isPublic: prismaVideo.isPublic ?? false,
    publishedAt: prismaVideo.publishedAt ? new Date(prismaVideo.publishedAt) : null,
    averageRating: calculateAvgRating(prismaVideo.ratings),
  };
}

function transformPicture(prismaPicture: any): Picture {
  if (!prismaPicture) return null as any;

  return {
    id: prismaPicture.id,
    title: prismaPicture.title || '',
    description: prismaPicture.description || null,
    imageUrl: prismaPicture.imageUrl || '',
    thumbnailUrl: prismaPicture.thumbnailUrl || '',
    participants: prismaPicture.participants?.map((p: any) => transformParticipant(p)) || [],
    uploadedBy: transformUser(prismaPicture.uploadedBy),
    uploadedAt: prismaPicture.uploadedAt ? new Date(prismaPicture.uploadedAt) : new Date(),
    createdAt: prismaPicture.createdAt ? new Date(prismaPicture.createdAt) : new Date(),
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

function transformQuoteMessage(prismaMessage: any): { id: string; message: string; user: User } {
  return {
    id: prismaMessage.id || '',
    message: prismaMessage.message || '',
    user: transformUser(prismaMessage.user),
  };
}

function transformQuote(prismaQuote: any): Quote {
  if (!prismaQuote) return null as any;

  return {
    id: prismaQuote.id,
    messages: prismaQuote.messages?.map((m: any) => transformQuoteMessage(m)) || [],
    participants: prismaQuote.participants?.map((p: any) => transformParticipant(p)) || [],
    uploadedBy: transformUser(prismaQuote.uploadedBy),
    uploadedAt: prismaQuote.uploadedAt ? new Date(prismaQuote.uploadedAt) : new Date(),
    createdAt: prismaQuote.createdAt ? new Date(prismaQuote.createdAt) : new Date(),
    views: prismaQuote.views || 0,
    isPublic: prismaQuote.isPublic ?? false,
    publishedAt: prismaQuote.publishedAt ? new Date(prismaQuote.publishedAt) : null,
    averageRating: calculateAvgRating(prismaQuote.ratings),
  };
}

// Common include for participant relations (supports both User and Placeholder)
const participantInclude = {
  user: true,
  placeholder: true,
};

interface FetchOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort?: SortOption;
  categoryId?: string | null;
  dateRange?: DateRange;
}

// ============================================
// GET ALL FUNCTIONS
// ============================================

export async function getAllVideos(session?: Session | null, options?: FetchOptions): Promise<Video[]> {
  try {
    const { page = 1, limit = 20, search, sort = 'newest', categoryId, dateRange } = options || {};
    const effectiveRole = session !== undefined ? getEffectiveRole(session) : "guest";

    const where: Prisma.VideoWhereInput = {};

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

    const videos = await prisma.video.findMany({
      where,
      include: {
        uploadedBy: true,
        category: true,
        participants: {
          include: participantInclude,
        },
        ratings: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });
    return videos.map(transformVideo);
  } catch (error) {
    console.error('Error fetching videos:', error);
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
      include: {
        uploadedBy: true,
        category: true,
        participants: {
          include: participantInclude,
        },
        ratings: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });
    return pictures.map(transformPicture);
  } catch (error) {
    console.error('Error fetching pictures:', error);
    return [];
  }
}

export async function getAllQuotes(session?: Session | null, options?: FetchOptions): Promise<Quote[]> {
  try {
    const { page = 1, limit = 20, search, sort = 'newest', categoryId, dateRange } = options || {};
    const effectiveRole = session !== undefined ? getEffectiveRole(session) : "guest";

    const where: Prisma.QuoteWhereInput = {};

    if (effectiveRole === "guest") {
      where.isPublic = true;
    }

    if (search) {
      where.messages = { some: { message: { contains: search, mode: 'insensitive' } } };
    }

    if (categoryId) {
      // Quotes don't have categories directly, but messages could be categorized
      // This requires a more complex query or a different schema design
      // For now, we will ignore category filter for quotes
      console.warn("Category filtering is not supported for quotes with the current schema.");
    }

    if (dateRange && dateRange !== 'all') {
      where.createdAt = getDateRangeFilter(dateRange);
    }

    const orderBy = getSortOrder(sort);

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        uploadedBy: true,
        messages: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        participants: {
          include: participantInclude,
        },
        ratings: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });
    return quotes.map(transformQuote);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        status: { not: 'DISABLED' }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return users.map(transformUser);
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getAllSelectableParticipants(): Promise<Participant[]> {
  try {
    // 1. Fetch all users who are INVITED or ACTIVE
    const users = await prisma.user.findMany({
      where: { 
        isAnonymous: false,
        status: { in: ['INVITED', 'ACTIVE'] }
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Map users to participants
    return users.map(u => ({
      type: "user",
      data: transformUser(u),
    }));
  } catch (error) {
    console.error('Error fetching selectable participants:', error);
    return [];
  }
}

export async function getAllCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      iconUrl: c.iconUrl,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// ============================================
// GET BY ID FUNCTIONS
// ============================================

export async function getVideoById(id: string): Promise<Video | null> {
  try {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        uploadedBy: true,
        category: true,
        participants: {
          include: participantInclude,
        },
        ratings: true,
      },
    });
    return video ? transformVideo(video) : null;
  } catch (error) {
    console.error('Error fetching video by ID:', error);
    return null;
  }
}

export async function getPictureById(id: string): Promise<Picture | null> {
  try {
    const picture = await prisma.picture.findUnique({
      where: { id },
      include: {
        uploadedBy: true,
        category: true,
        participants: {
          include: participantInclude,
        },
        ratings: true,
      },
    });
    return picture ? transformPicture(picture) : null;
  } catch (error) {
    console.error('Error fetching picture by ID:', error);
    return null;
  }
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        uploadedBy: true,
        messages: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        participants: {
          include: participantInclude,
        },
        ratings: true,
      },
    });
    return quote ? transformQuote(quote) : null;
  } catch (error) {
    console.error('Error fetching quote by ID:', error);
    return null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? transformUser(user) : null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

// ============================================
// ADD FUNCTIONS
// ============================================

export async function addVideo(video: Video): Promise<Video> {
  try {
    await checkUploadPermission();
    
    // Null safety check
    if (!video.uploadedBy?.id) {
      throw new Error("uploadedBy is required");
    }

    // Ensure uploadedBy user exists
    const uploader = await prisma.user.upsert({
      where: { id: video.uploadedBy.id },
      update: {
        name: video.uploadedBy.username,
        image: video.uploadedBy.profilePicture,
      },
      create: {
        id: video.uploadedBy.id,
        name: video.uploadedBy.username,
        image: video.uploadedBy.profilePicture,
      },
    });

    // Create video
    const createdVideo = await prisma.video.create({
      data: {
        ...(video.id ? { id: video.id } : {}),
        title: video.title,
        description: video.description || null,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        uploadedById: uploader.id,
        categoryId: video.category.id,
        uploadedAt: video.uploadedAt,
        createdAt: video.createdAt,
        views: video.views || 0,
        isPublic: video.isPublic ?? false,
        publishedAt: video.publishedAt,
      },
      include: {
        uploadedBy: true,
        category: true,
        participants: {
          include: participantInclude,
        },
      },
    });

    // Add participants (supports both User and Placeholder)
    for (const participant of video.participants) {
      if (participant.type === "user") {
        const user = await prisma.user.upsert({
          where: { id: participant.data.id },
          update: {
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
          create: {
            id: participant.data.id,
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
        });

        await prisma.videoParticipant.create({
          data: {
            videoId: createdVideo.id,
            userId: user.id,
          },
        });
      } else if (participant.type === "placeholder") {
        await prisma.videoParticipant.create({
          data: {
            videoId: createdVideo.id,
            placeholderId: participant.data.id,
          },
        });
      }
    }

    return transformVideo(createdVideo);
  } catch (error) {
    console.error('Error adding video:', error);
    throw error;
  }
}

export async function addPicture(picture: Picture): Promise<Picture> {
  try {
    await checkUploadPermission();
    
    // Null safety check
    if (!picture.uploadedBy?.id) {
      throw new Error("uploadedBy is required");
    }

    // Ensure uploadedBy user exists
    const uploader = await prisma.user.upsert({
      where: { id: picture.uploadedBy.id },
      update: {
        name: picture.uploadedBy.username,
        image: picture.uploadedBy.profilePicture,
      },
      create: {
        id: picture.uploadedBy.id,
        name: picture.uploadedBy.username,
        image: picture.uploadedBy.profilePicture,
      },
    });

    // Create picture
    const createdPicture = await prisma.picture.create({
      data: {
        ...(picture.id ? { id: picture.id } : {}),
        title: picture.title,
        description: picture.description || null,
        imageUrl: picture.imageUrl,
        thumbnailUrl: picture.thumbnailUrl,
        uploadedById: uploader.id,
        categoryId: picture.category.id,
        uploadedAt: picture.uploadedAt,
        createdAt: picture.createdAt,
        views: picture.views || 0,
        isPublic: picture.isPublic ?? false,
        publishedAt: picture.publishedAt,
      },
      include: {
        uploadedBy: true,
        category: true,
        participants: {
          include: participantInclude,
        },
      },
    });

    // Add participants (supports both User and Placeholder)
    for (const participant of picture.participants) {
      if (participant.type === "user") {
        const user = await prisma.user.upsert({
          where: { id: participant.data.id },
          update: {
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
          create: {
            id: participant.data.id,
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
        });

        await prisma.pictureParticipant.create({
          data: {
            pictureId: createdPicture.id,
            userId: user.id,
          },
        });
      } else if (participant.type === "placeholder") {
        await prisma.pictureParticipant.create({
          data: {
            pictureId: createdPicture.id,
            placeholderId: participant.data.id,
          },
        });
      }
    }

    return transformPicture(createdPicture);
  } catch (error) {
    console.error('Error adding picture:', error);
    throw error;
  }
}

export async function addQuote(quote: Quote): Promise<Quote> {
  try {
    await checkUploadPermission();
    
    // Null safety check
    if (!quote.uploadedBy?.id) {
      throw new Error("uploadedBy is required");
    }

    // Ensure uploadedBy user exists
    const uploader = await prisma.user.upsert({
      where: { id: quote.uploadedBy.id },
      update: {
        name: quote.uploadedBy.username,
        image: quote.uploadedBy.profilePicture,
      },
      create: {
        id: quote.uploadedBy.id,
        name: quote.uploadedBy.username,
        image: quote.uploadedBy.profilePicture,
      },
    });

    // Create quote
    const createdQuote = await prisma.quote.create({
      data: {
        ...(quote.id ? { id: quote.id } : {}),
        uploadedById: uploader.id,
        uploadedAt: quote.uploadedAt,
        createdAt: quote.createdAt,
        views: quote.views || 0,
        isPublic: quote.isPublic ?? false,
        publishedAt: quote.publishedAt,
      },
      include: {
        uploadedBy: true,
        messages: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        participants: {
          include: participantInclude,
        },
      },
    });

    // Add messages
    for (const message of quote.messages) {
      if (!message.user?.id) {
        console.warn(`Skipping message without user: ${message.message}`);
        continue;
      }

      const user = await prisma.user.upsert({
        where: { id: message.user.id },
        update: {
          name: message.user.username,
          image: message.user.profilePicture,
        },
        create: {
          id: message.user.id,
          name: message.user.username,
          image: message.user.profilePicture,
        },
      });

      await prisma.quoteMessage.create({
        data: {
          quoteId: createdQuote.id,
          userId: user.id,
          message: message.message,
        },
      });
    }

    // Add participants (supports both User and Placeholder)
    for (const participant of quote.participants) {
      if (participant.type === "user") {
        const user = await prisma.user.upsert({
          where: { id: participant.data.id },
          update: {
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
          create: {
            id: participant.data.id,
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
        });

        await prisma.quoteParticipant.create({
          data: {
            quoteId: createdQuote.id,
            userId: user.id,
          },
        });
      } else if (participant.type === "placeholder") {
        await prisma.quoteParticipant.create({
          data: {
            quoteId: createdQuote.id,
            placeholderId: participant.data.id,
          },
        });
      }
    }

    return transformQuote(createdQuote);
  } catch (error) {
    console.error('Error adding quote:', error);
    throw error;
  }
}

export async function addUser(user: User): Promise<void> {
  try {
    if (!user?.id) {
      throw new Error("user.id is required");
    }
    
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.username,
        image: user.profilePicture,
      },
      create: {
        id: user.id,
        name: user.username,
        image: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
}

// ============================================
// DELETE FUNCTIONS
// ============================================

export async function deleteVideo(videoId: string): Promise<void> {
  try {
    // 1. Fetch video to get owner and file path
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { uploadedBy: true }
    });

    if (!video) {
      throw new Error("Video not found");
    }

    // 2. Check Permission (Admin or Owner)
    await checkOwnerOrAdmin(video.uploadedById);

    // 3. Delete from Storage (R2/Local)
    // Helper to extract key from URL
    const extractKey = (url: string) => {
      if (!url) return null;
      if (url.includes("/uploads/")) {
        return url.split("/uploads/")[1];
      }
      if (url.includes("/videos/")) return "videos/" + url.split("/videos/")[1];
      if (url.includes("/thumbnails/")) return "thumbnails/" + url.split("/thumbnails/")[1];
      return null;
    };

    const videoKey = extractKey(video.videoUrl);
    const thumbnailKey = extractKey(video.thumbnailUrl || "");

    if (videoKey) await deleteFile(videoKey);
    if (thumbnailKey) await deleteFile(thumbnailKey);

    // 4. Delete from Database
    await prisma.video.delete({
      where: { id: videoId },
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
}

export async function deletePicture(pictureId: string): Promise<void> {
  try {
    const picture = await prisma.picture.findUnique({
      where: { id: pictureId },
      include: { uploadedBy: true }
    });

    if (!picture) throw new Error("Picture not found");

    await checkOwnerOrAdmin(picture.uploadedById);

    // Extract keys
    const extractKey = (url: string) => {
      if (!url) return null;
      if (url.includes("/uploads/")) return url.split("/uploads/")[1];
      if (url.includes("/pictures/")) return "pictures/" + url.split("/pictures/")[1];
      if (url.includes("/thumbnails/")) return "thumbnails/" + url.split("/thumbnails/")[1];
      return null;
    };

    const imgKey = extractKey(picture.imageUrl);
    const thumbKey = extractKey(picture.thumbnailUrl || "");

    if (imgKey) await deleteFile(imgKey);
    if (thumbKey) await deleteFile(thumbKey);

    await prisma.picture.delete({
      where: { id: pictureId },
    });
  } catch (error) {
    console.error('Error deleting picture:', error);
    throw error;
  }
}

export async function deleteQuote(quoteId: string): Promise<void> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });
    if (!quote) throw new Error("Quote not found");

    await checkOwnerOrAdmin(quote.uploadedById);

    await prisma.quote.delete({
      where: { id: quoteId },
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// ============================================
// EDIT FUNCTIONS
// ============================================

export async function editVideo(updatedVideo: Video): Promise<void> {
  try {
    // Null safety check
    if (!updatedVideo.uploadedBy?.id) {
      throw new Error("uploadedBy is required");
    }

    await checkOwnerOrAdmin(updatedVideo.uploadedBy.id);
    
    // Update video
    await prisma.video.update({
      where: { id: updatedVideo.id },
      data: {
        title: updatedVideo.title,
        description: updatedVideo.description || null,
        videoUrl: updatedVideo.videoUrl,
        thumbnailUrl: updatedVideo.thumbnailUrl,
        categoryId: updatedVideo.category.id,
        uploadedAt: updatedVideo.uploadedAt,
        createdAt: updatedVideo.createdAt,
        views: updatedVideo.views || 0,
        isPublic: updatedVideo.isPublic ?? false,
        publishedAt: updatedVideo.publishedAt,
      },
    });

    // Delete existing participants
    await prisma.videoParticipant.deleteMany({
      where: { videoId: updatedVideo.id },
    });

    // Re-add participants (supports both User and Placeholder)
    for (const participant of updatedVideo.participants) {
      if (participant.type === "user") {
        const user = await prisma.user.upsert({
          where: { id: participant.data.id },
          update: {
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
          create: {
            id: participant.data.id,
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
        });

        await prisma.videoParticipant.create({
          data: {
            videoId: updatedVideo.id,
            userId: user.id,
          },
        });
      } else if (participant.type === "placeholder") {
        await prisma.videoParticipant.create({
          data: {
            videoId: updatedVideo.id,
            placeholderId: participant.data.id,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error editing video:', error);
    throw error;
  }
}

export async function editPicture(updatedPicture: Picture): Promise<void> {
  try {
    // Null safety check
    if (!updatedPicture.uploadedBy?.id) {
      throw new Error("uploadedBy is required");
    }

    await checkOwnerOrAdmin(updatedPicture.uploadedBy.id);
    
    await prisma.picture.update({
      where: { id: updatedPicture.id },
      data: {
        title: updatedPicture.title,
        description: updatedPicture.description || null,
        imageUrl: updatedPicture.imageUrl,
        thumbnailUrl: updatedPicture.thumbnailUrl,
        categoryId: updatedPicture.category.id,
        uploadedAt: updatedPicture.uploadedAt,
        createdAt: updatedPicture.createdAt,
        views: updatedPicture.views || 0,
        isPublic: updatedPicture.isPublic ?? false,
        publishedAt: updatedPicture.publishedAt,
      },
    });

    // Delete existing participants
    await prisma.pictureParticipant.deleteMany({
      where: { pictureId: updatedPicture.id },
    });

    // Re-add participants (supports both User and Placeholder)
    for (const participant of updatedPicture.participants) {
      if (participant.type === "user") {
        const user = await prisma.user.upsert({
          where: { id: participant.data.id },
          update: {
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
          create: {
            id: participant.data.id,
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
        });

        await prisma.pictureParticipant.create({
          data: {
            pictureId: updatedPicture.id,
            userId: user.id,
          },
        });
      } else if (participant.type === "placeholder") {
        await prisma.pictureParticipant.create({
          data: {
            pictureId: updatedPicture.id,
            placeholderId: participant.data.id,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error editing picture:', error);
    throw error;
  }
}

export async function editQuote(updatedQuote: Quote): Promise<void> {
  try {
    // Null safety check
    if (!updatedQuote.uploadedBy?.id) {
      throw new Error("uploadedBy is required");
    }

    await checkOwnerOrAdmin(updatedQuote.uploadedBy.id);

    await prisma.quote.update({
      where: { id: updatedQuote.id },
      data: {
        uploadedAt: updatedQuote.uploadedAt,
        createdAt: updatedQuote.createdAt,
        views: updatedQuote.views || 0,
        isPublic: updatedQuote.isPublic ?? false,
        publishedAt: updatedQuote.publishedAt,
      },
    });

    // Delete and re-add messages, participants
    await prisma.quoteMessage.deleteMany({
      where: { quoteId: updatedQuote.id },
    });
    await prisma.quoteParticipant.deleteMany({
      where: { quoteId: updatedQuote.id },
    });

    // Re-add messages
    for (const message of updatedQuote.messages) {
      const user = await prisma.user.upsert({
        where: { id: message.user.id },
        update: {
          name: message.user.username,
          image: message.user.profilePicture,
        },
        create: {
          id: message.user.id,
          name: message.user.username,
          image: message.user.profilePicture,
        },
      });

      await prisma.quoteMessage.create({
        data: {
          quoteId: updatedQuote.id,
          userId: user.id,
          message: message.message,
        },
      });
    }

    // Re-add participants (supports both User and Placeholder)
    for (const participant of updatedQuote.participants) {
      if (participant.type === "user") {
        const user = await prisma.user.upsert({
          where: { id: participant.data.id },
          update: {
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
          create: {
            id: participant.data.id,
            name: participant.data.username,
            image: participant.data.profilePicture,
          },
        });

        await prisma.quoteParticipant.create({
          data: {
            quoteId: updatedQuote.id,
            userId: user.id,
          },
        });
      } else if (participant.type === "placeholder") {
        await prisma.quoteParticipant.create({
          data: {
            quoteId: updatedQuote.id,
            placeholderId: participant.data.id,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error editing quote:', error);
    throw error;
  }
}

export async function editUser(updatedUser: User): Promise<void> {
  try {
    if (!updatedUser?.id) {
      throw new Error("user.id is required");
    }
    
    await prisma.user.update({
      where: { id: updatedUser.id },
      data: {
        name: updatedUser.username,
        image: updatedUser.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error editing user:', error);
    throw error;
  }
}

// ============================================
// PUBLISH/UNPUBLISH FUNCTIONS (Owner-only)
// ============================================

export async function publishVideo(videoId: string): Promise<void> {
  try {
    await requireOwner();
    
    await prisma.video.update({
      where: { id: videoId },
      data: { 
        isPublic: true, 
        publishedAt: new Date() 
      },
    });
  } catch (error) {
    console.error('Error publishing video:', error);
    throw error;
  }
}

export async function unpublishVideo(videoId: string): Promise<void> {
  try {
    await requireOwner();
    
    await prisma.video.update({
      where: { id: videoId },
      data: { isPublic: false },
      // Note: publishedAt is NOT cleared - keeps history
    });
  } catch (error) {
    console.error('Error unpublishing video:', error);
    throw error;
  }
}

export async function publishPicture(pictureId: string): Promise<void> {
  try {
    await requireOwner();
    
    await prisma.picture.update({
      where: { id: pictureId },
      data: { 
        isPublic: true, 
        publishedAt: new Date() 
      },
    });
  } catch (error) {
    console.error('Error publishing picture:', error);
    throw error;
  }
}

export async function unpublishPicture(pictureId: string): Promise<void> {
  try {
    await requireOwner();
    
    await prisma.picture.update({
      where: { id: pictureId },
      data: { isPublic: false },
    });
  } catch (error) {
    console.error('Error unpublishing picture:', error);
    throw error;
  }
}

export async function publishQuote(quoteId: string): Promise<void> {
  try {
    await requireOwner();
    
    await prisma.quote.update({
      where: { id: quoteId },
      data: { 
        isPublic: true, 
        publishedAt: new Date() 
      },
    });
  } catch (error) {
    console.error('Error publishing quote:', error);
    throw error;
  }
}

export async function unpublishQuote(quoteId: string): Promise<void> {
  try {
    await requireOwner();
    
    await prisma.quote.update({
      where: { id: quoteId },
      data: { isPublic: false },
    });
  } catch (error) {
    console.error('Error unpublishing quote:', error);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function calculateMediaRating(ratings: Rating[]): Promise<number> {
  if (ratings.length !== 0) {
    return ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length;
  } else {
    return 0;
  }
}
