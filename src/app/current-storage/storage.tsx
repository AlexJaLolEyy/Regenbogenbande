'use server'

import { Picture, Quote, Rating, User, Video } from "@/src/lib/types/types";
import { prisma } from "@/src/lib/prisma";

// ============================================
// TRANSFORMATION FUNCTIONS
// ============================================
// Convert Prisma data (String IDs) to TypeScript interfaces (number IDs)

function transformUser(prismaUser: any): User {
  if (!prismaUser) return null as any;
  
  // Try to parse ID as number, if it's a cuid, use a hash
  let id: number;
  if (typeof prismaUser.id === 'string') {
    const parsed = parseInt(prismaUser.id, 10);
    id = isNaN(parsed) ? hashStringToNumber(prismaUser.id) : parsed;
  } else {
    id = prismaUser.id;
  }

  return {
    id,
    username: prismaUser.username || '',
    password: prismaUser.password || '',
    profilepicture: prismaUser.profilePicture || '',
  };
}

function transformRating(prismaRating: any): Rating {
  if (!prismaRating) return null as any;
  
  let userId: number;
  if (typeof prismaRating.userId === 'string') {
    const parsed = parseInt(prismaRating.userId, 10);
    userId = isNaN(parsed) ? hashStringToNumber(prismaRating.userId) : parsed;
  } else {
    userId = prismaRating.userId;
  }

  return {
    user: userId,
    value: prismaRating.value || 0,
  };
}

function transformVideo(prismaVideo: any): Video {
  if (!prismaVideo) return null as any;

  let id: number;
  if (typeof prismaVideo.id === 'string') {
    const parsed = parseInt(prismaVideo.id, 10);
    id = isNaN(parsed) ? hashStringToNumber(prismaVideo.id) : parsed;
  } else {
    id = prismaVideo.id;
  }

  return {
    id,
    title: prismaVideo.title || '',
    description: prismaVideo.description || null,
    video: prismaVideo.videoUrl || '',
    thumbnail: prismaVideo.thumbnailUrl || '',
    participants: prismaVideo.participants?.map((p: any) => transformUser(p.user)) || [],
    uploadedBy: transformUser(prismaVideo.uploadedBy),
    uploadedAt: prismaVideo.uploadedAt ? new Date(prismaVideo.uploadedAt) : new Date(),
    createdAt: prismaVideo.createdAt ? new Date(prismaVideo.createdAt) : new Date(),
    metadata: {
      views: prismaVideo.views || 0,
      rating: prismaVideo.ratings?.map((r: any) => transformRating(r)) || [],
    },
  };
}

function transformPicture(prismaPicture: any): Picture {
  if (!prismaPicture) return null as any;

  let id: number;
  if (typeof prismaPicture.id === 'string') {
    const parsed = parseInt(prismaPicture.id, 10);
    id = isNaN(parsed) ? hashStringToNumber(prismaPicture.id) : parsed;
  } else {
    id = prismaPicture.id;
  }

  return {
    id,
    title: prismaPicture.title || '',
    description: prismaPicture.description || null,
    img: prismaPicture.imageUrl || '',
    participants: prismaPicture.participants?.map((p: any) => transformUser(p.user)) || [],
    uploadedBy: transformUser(prismaPicture.uploadedBy),
    uploadedAt: prismaPicture.uploadedAt ? new Date(prismaPicture.uploadedAt) : new Date(),
    createdAt: prismaPicture.createdAt ? new Date(prismaPicture.createdAt) : new Date(),
    metadata: {
      views: prismaPicture.views || 0,
      rating: prismaPicture.ratings?.map((r: any) => transformRating(r)) || [],
    },
  };
}

function transformQuoteMessage(prismaMessage: any): { msg: string; user: User } {
  return {
    msg: prismaMessage.message || '',
    user: transformUser(prismaMessage.user),
  };
}

function transformQuote(prismaQuote: any): Quote {
  if (!prismaQuote) return null as any;

  let id: number;
  if (typeof prismaQuote.id === 'string') {
    const parsed = parseInt(prismaQuote.id, 10);
    id = isNaN(parsed) ? hashStringToNumber(prismaQuote.id) : parsed;
  } else {
    id = prismaQuote.id;
  }

  return {
    id,
    fullQuote: prismaQuote.messages?.map((m: any) => transformQuoteMessage(m)) || [],
    participants: prismaQuote.participants?.map((p: any) => transformUser(p.user)) || [],
    uploadedBy: transformUser(prismaQuote.uploadedBy),
    uploadedAt: prismaQuote.uploadedAt ? new Date(prismaQuote.uploadedAt) : new Date(),
    createdAt: prismaQuote.createdAt ? new Date(prismaQuote.createdAt) : new Date(),
    metadata: {
      views: prismaQuote.views || 0,
      rating: prismaQuote.ratings?.map((r: any) => transformRating(r)) || [],
    },
  };
}

// Simple hash function to convert string to number
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// ============================================
// GET ALL FUNCTIONS
// ============================================

export async function getAllVideos(): Promise<Video[]> {
  try {
    const videos = await prisma.video.findMany({
      include: {
        uploadedBy: true,
        participants: {
          include: {
            user: true,
          },
        },
        ratings: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return videos.map(transformVideo);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
}

export async function getAllPictures(): Promise<Picture[]> {
  try {
    const pictures = await prisma.picture.findMany({
      include: {
        uploadedBy: true,
        participants: {
          include: {
            user: true,
          },
        },
        ratings: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return pictures.map(transformPicture);
  } catch (error) {
    console.error('Error fetching pictures:', error);
    return [];
  }
}

export async function getAllQuotes(): Promise<Quote[]> {
  try {
    const quotes = await prisma.quote.findMany({
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
          include: {
            user: true,
          },
        },
        ratings: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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

// ============================================
// GET BY ID FUNCTIONS
// ============================================

export async function getVideoById(id: number): Promise<Video> {
  try {
    // Try to find by numeric ID first, then by string
    const video = await prisma.video.findFirst({
      where: {
        OR: [
          { id: String(id) },
          { id: id.toString() },
        ],
      },
      include: {
        uploadedBy: true,
        participants: {
          include: {
            user: true,
          },
        },
        ratings: {
          include: {
            user: true,
          },
        },
      },
    });
    return transformVideo(video);
  } catch (error) {
    console.error('Error fetching video by ID:', error);
    return null as any;
  }
}

export async function getPictureById(id: number): Promise<Picture> {
  try {
    const picture = await prisma.picture.findFirst({
      where: {
        OR: [
          { id: String(id) },
          { id: id.toString() },
        ],
      },
      include: {
        uploadedBy: true,
        participants: {
          include: {
            user: true,
          },
        },
        ratings: {
          include: {
            user: true,
          },
        },
      },
    });
    return transformPicture(picture);
  } catch (error) {
    console.error('Error fetching picture by ID:', error);
    return null as any;
  }
}

export async function getQuoteById(id: number): Promise<Quote> {
  try {
    const quote = await prisma.quote.findFirst({
      where: {
        OR: [
          { id: String(id) },
          { id: id.toString() },
        ],
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
          include: {
            user: true,
          },
        },
        ratings: {
          include: {
            user: true,
          },
        },
      },
    });
    return transformQuote(quote);
  } catch (error) {
    console.error('Error fetching quote by ID:', error);
    return null as any;
  }
}

export async function getUserById(id: number): Promise<User> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: String(id) },
          { id: id.toString() },
        ],
      },
    });
    return transformUser(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null as any;
  }
}

// ============================================
// ADD FUNCTIONS
// ============================================

export async function addVideo(video: Video): Promise<void> {
  try {
    // Ensure uploadedBy user exists
    const uploader = await prisma.user.upsert({
      where: { id: String(video.uploadedBy.id) },
      update: {
        username: video.uploadedBy.username,
        profilePicture: video.uploadedBy.profilepicture,
      },
      create: {
        id: String(video.uploadedBy.id),
        username: video.uploadedBy.username,
        password: video.uploadedBy.password,
        profilePicture: video.uploadedBy.profilepicture,
      },
    });

    // Create video
    const createdVideo = await prisma.video.create({
      data: {
        id: String(video.id),
        title: video.title,
        description: video.description || null,
        videoUrl: video.video,
        thumbnailUrl: video.thumbnail,
        uploadedById: uploader.id,
        uploadedAt: video.uploadedAt,
        createdAt: video.createdAt,
        views: video.metadata.views || 0,
      },
    });

    // Add participants
    for (const participant of video.participants) {
      const user = await prisma.user.upsert({
        where: { id: String(participant.id) },
        update: {
          username: participant.username,
          profilePicture: participant.profilepicture,
        },
        create: {
          id: String(participant.id),
          username: participant.username,
          password: participant.password,
          profilePicture: participant.profilepicture,
        },
      });

      await prisma.videoParticipant.create({
        data: {
          videoId: createdVideo.id,
          userId: user.id,
        },
      });
    }

    // Add ratings
    for (const rating of video.metadata.rating || []) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: String(rating.user) },
            { id: rating.user.toString() },
          ],
        },
      });

      if (user) {
        await prisma.rating.create({
          data: {
            videoId: createdVideo.id,
            userId: user.id,
            value: rating.value,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error adding video:', error);
    throw error;
  }
}

export async function addPicture(picture: Picture): Promise<void> {
  try {
    // Ensure uploadedBy user exists
    const uploader = await prisma.user.upsert({
      where: { id: String(picture.uploadedBy.id) },
      update: {
        username: picture.uploadedBy.username,
        profilePicture: picture.uploadedBy.profilepicture,
      },
      create: {
        id: String(picture.uploadedBy.id),
        username: picture.uploadedBy.username,
        password: picture.uploadedBy.password,
        profilePicture: picture.uploadedBy.profilepicture,
      },
    });

    // Create picture
    const createdPicture = await prisma.picture.create({
      data: {
        id: String(picture.id),
        title: picture.title,
        description: picture.description || null,
        imageUrl: picture.img,
        uploadedById: uploader.id,
        uploadedAt: picture.uploadedAt,
        createdAt: picture.createdAt,
        views: picture.metadata.views || 0,
      },
    });

    // Add participants
    for (const participant of picture.participants) {
      const user = await prisma.user.upsert({
        where: { id: String(participant.id) },
        update: {
          username: participant.username,
          profilePicture: participant.profilepicture,
        },
        create: {
          id: String(participant.id),
          username: participant.username,
          password: participant.password,
          profilePicture: participant.profilepicture,
        },
      });

      await prisma.pictureParticipant.create({
        data: {
          pictureId: createdPicture.id,
          userId: user.id,
        },
      });
    }

    // Add ratings
    for (const rating of picture.metadata.rating || []) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: String(rating.user) },
            { id: rating.user.toString() },
          ],
        },
      });

      if (user) {
        await prisma.rating.create({
          data: {
            pictureId: createdPicture.id,
            userId: user.id,
            value: rating.value,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error adding picture:', error);
    throw error;
  }
}

export async function addQuote(quote: Quote): Promise<void> {
  try {
    // Ensure uploadedBy user exists
    const uploader = await prisma.user.upsert({
      where: { id: String(quote.uploadedBy.id) },
      update: {
        username: quote.uploadedBy.username,
        profilePicture: quote.uploadedBy.profilepicture,
      },
      create: {
        id: String(quote.uploadedBy.id),
        username: quote.uploadedBy.username,
        password: quote.uploadedBy.password,
        profilePicture: quote.uploadedBy.profilepicture,
      },
    });

    // Create quote
    const createdQuote = await prisma.quote.create({
      data: {
        id: String(quote.id),
        uploadedById: uploader.id,
        uploadedAt: quote.uploadedAt,
        createdAt: quote.createdAt,
        views: quote.metadata.views || 0,
      },
    });

    // Add messages
    for (const message of quote.fullQuote) {
      const user = await prisma.user.upsert({
        where: { id: String(message.user.id) },
        update: {
          username: message.user.username,
          profilePicture: message.user.profilepicture,
        },
        create: {
          id: String(message.user.id),
          username: message.user.username,
          password: message.user.password,
          profilePicture: message.user.profilepicture,
        },
      });

      await prisma.quoteMessage.create({
        data: {
          quoteId: createdQuote.id,
          userId: user.id,
          message: message.msg,
        },
      });
    }

    // Add participants (auto-detected from messages)
    const participantIds = Array.from(new Set(quote.fullQuote.map(m => String(m.user.id))));
    for (const participantId of participantIds) {
      const user = await prisma.user.findFirst({
        where: { id: participantId },
      });

      if (user) {
        await prisma.quoteParticipant.create({
          data: {
            quoteId: createdQuote.id,
            userId: user.id,
          },
        });
      }
    }

    // Add ratings
    for (const rating of quote.metadata.rating || []) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: String(rating.user) },
            { id: rating.user.toString() },
          ],
        },
      });

      if (user) {
        await prisma.rating.create({
          data: {
            quoteId: createdQuote.id,
            userId: user.id,
            value: rating.value,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error adding quote:', error);
    throw error;
  }
}

export async function addUser(user: User): Promise<void> {
  try {
    await prisma.user.upsert({
      where: { id: String(user.id) },
      update: {
        username: user.username,
        password: user.password,
        profilePicture: user.profilepicture,
      },
      create: {
        id: String(user.id),
        username: user.username,
        password: user.password,
        profilePicture: user.profilepicture,
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

export async function deleteVideo(videoId: number): Promise<void> {
  try {
    await prisma.video.delete({
      where: { id: String(videoId) },
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
}

export async function deletePicture(pictureId: number): Promise<void> {
  try {
    await prisma.picture.delete({
      where: { id: String(pictureId) },
    });
  } catch (error) {
    console.error('Error deleting picture:', error);
    throw error;
  }
}

export async function deleteQuote(quoteId: number): Promise<void> {
  try {
    await prisma.quote.delete({
      where: { id: String(quoteId) },
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }
}

export async function deleteUser(userid: number): Promise<void> {
  try {
    await prisma.user.delete({
      where: { id: String(userid) },
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
    // Update video
    await prisma.video.update({
      where: { id: String(updatedVideo.id) },
      data: {
        title: updatedVideo.title,
        description: updatedVideo.description || null,
        videoUrl: updatedVideo.video,
        thumbnailUrl: updatedVideo.thumbnail,
        uploadedAt: updatedVideo.uploadedAt,
        createdAt: updatedVideo.createdAt,
        views: updatedVideo.metadata.views || 0,
      },
    });

    // Delete existing participants and ratings
    await prisma.videoParticipant.deleteMany({
      where: { videoId: String(updatedVideo.id) },
    });
    await prisma.rating.deleteMany({
      where: {
        videoId: String(updatedVideo.id),
      },
    });

    // Re-add participants
    for (const participant of updatedVideo.participants) {
      const user = await prisma.user.upsert({
        where: { id: String(participant.id) },
        update: {
          username: participant.username,
          profilePicture: participant.profilepicture,
        },
        create: {
          id: String(participant.id),
          username: participant.username,
          password: participant.password,
          profilePicture: participant.profilepicture,
        },
      });

      await prisma.videoParticipant.create({
        data: {
          videoId: String(updatedVideo.id),
          userId: user.id,
        },
      });
    }

    // Re-add ratings
    for (const rating of updatedVideo.metadata.rating || []) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: String(rating.user) },
            { id: rating.user.toString() },
          ],
        },
      });

      if (user) {
        await prisma.rating.create({
          data: {
            videoId: String(updatedVideo.id),
            userId: user.id,
            value: rating.value,
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
    await prisma.picture.update({
      where: { id: String(updatedPicture.id) },
      data: {
        title: updatedPicture.title,
        description: updatedPicture.description || null,
        imageUrl: updatedPicture.img,
        uploadedAt: updatedPicture.uploadedAt,
        createdAt: updatedPicture.createdAt,
        views: updatedPicture.metadata.views || 0,
      },
    });

    // Delete and re-add participants and ratings (similar to video)
    await prisma.pictureParticipant.deleteMany({
      where: { pictureId: String(updatedPicture.id) },
    });
    await prisma.rating.deleteMany({
      where: {
        pictureId: String(updatedPicture.id),
      },
    });

    for (const participant of updatedPicture.participants) {
      const user = await prisma.user.upsert({
        where: { id: String(participant.id) },
        update: {
          username: participant.username,
          profilePicture: participant.profilepicture,
        },
        create: {
          id: String(participant.id),
          username: participant.username,
          password: participant.password,
          profilePicture: participant.profilepicture,
        },
      });

      await prisma.pictureParticipant.create({
        data: {
          pictureId: String(updatedPicture.id),
          userId: user.id,
        },
      });
    }

    for (const rating of updatedPicture.metadata.rating || []) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: String(rating.user) },
            { id: rating.user.toString() },
          ],
        },
      });

      if (user) {
        await prisma.rating.create({
          data: {
            pictureId: String(updatedPicture.id),
            userId: user.id,
            value: rating.value,
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
    await prisma.quote.update({
      where: { id: String(updatedQuote.id) },
      data: {
        uploadedAt: updatedQuote.uploadedAt,
        createdAt: updatedQuote.createdAt,
        views: updatedQuote.metadata.views || 0,
      },
    });

    // Delete and re-add messages, participants, ratings
    await prisma.quoteMessage.deleteMany({
      where: { quoteId: String(updatedQuote.id) },
    });
    await prisma.quoteParticipant.deleteMany({
      where: { quoteId: String(updatedQuote.id) },
    });
    await prisma.rating.deleteMany({
      where: {
        quoteId: String(updatedQuote.id),
      },
    });

    // Re-add messages
    for (const message of updatedQuote.fullQuote) {
      const user = await prisma.user.upsert({
        where: { id: String(message.user.id) },
        update: {
          username: message.user.username,
          profilePicture: message.user.profilepicture,
        },
        create: {
          id: String(message.user.id),
          username: message.user.username,
          password: message.user.password,
          profilePicture: message.user.profilepicture,
        },
      });

      await prisma.quoteMessage.create({
        data: {
          quoteId: String(updatedQuote.id),
          userId: user.id,
          message: message.msg,
        },
      });
    }

    // Re-add participants
    const participantIds = Array.from(new Set(updatedQuote.fullQuote.map(m => String(m.user.id))));
    for (const participantId of participantIds) {
      const user = await prisma.user.findFirst({
        where: { id: participantId },
      });

      if (user) {
        await prisma.quoteParticipant.create({
          data: {
            quoteId: String(updatedQuote.id),
            userId: user.id,
          },
        });
      }
    }

    // Re-add ratings
    for (const rating of updatedQuote.metadata.rating || []) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: String(rating.user) },
            { id: rating.user.toString() },
          ],
        },
      });

      if (user) {
        await prisma.rating.create({
          data: {
            quoteId: String(updatedQuote.id),
            userId: user.id,
            value: rating.value,
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
    await prisma.user.update({
      where: { id: String(updatedUser.id) },
      data: {
        username: updatedUser.username,
        password: updatedUser.password,
        profilePicture: updatedUser.profilepicture,
      },
    });
  } catch (error) {
    console.error('Error editing user:', error);
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
