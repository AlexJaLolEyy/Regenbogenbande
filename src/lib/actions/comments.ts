"use server";

import { getEffectiveRole, getSession, requireAdminOrOwner, requireUploadPermission } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { Comment } from '@/src/lib/types/types';
import { revalidatePath, revalidateTag } from "next/cache";

type ContentType = 'video' | 'picture' | 'quote';

function contentKey(contentType: ContentType) {
  if (contentType !== 'video' && contentType !== 'picture' && contentType !== 'quote') {
    throw new Error("Invalid content type");
  }
  return `${contentType}Id` as 'videoId' | 'pictureId' | 'quoteId';
}

async function isContentPublic(contentType: ContentType, contentId: string): Promise<boolean> {
  const select = { isPublic: true } as const;
  const where = { id: contentId };
  const row =
    contentType === 'video' ? await prisma.video.findUnique({ where, select })
    : contentType === 'picture' ? await prisma.picture.findUnique({ where, select })
    : await prisma.quote.findUnique({ where, select });
  return row?.isPublic === true;
}

export async function getComments(contentType: ContentType, contentId: string) {
  const session = await getSession();
  const userId = session?.user.id;

  // Guests may only read comments on public content
  if (getEffectiveRole(session) === 'guest') {
    const isPublic = await isContentPublic(contentType, contentId);
    if (!isPublic) return [];
  }

  const comments = await prisma.comment.findMany({
    where: {
      [contentKey(contentType)]: contentId,
      parentId: null, // Only top-level comments; replies are included below
    },
    take: 200,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          status: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              status: true,
            },
          },
          votes: true,
        },
      },
      votes: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return comments.map(comment => formatComment(comment, userId));
}

// Type for comment with relations from Prisma query
interface CommentWithRelations {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
    status: 'INVITED' | 'ACTIVE' | 'DISABLED';
  };
  replies?: CommentWithRelations[];
  votes: {
    userId: string;
    value: number;
  }[];
}

function formatComment(comment: CommentWithRelations, currentUserId?: string): Comment {
  const upvotes = comment.votes.filter((v) => v.value === 1).length;
  const downvotes = comment.votes.filter((v) => v.value === -1).length;
  const userVote = currentUserId
    ? comment.votes.find((v) => v.userId === currentUserId)?.value
    : undefined;

  return {
    id: comment.id,
    content: comment.content,
    user: {
      id: comment.user.id,
      username: comment.user.name,
      profilePicture: comment.user.image,
      status: comment.user.status,
    },
    parentId: comment.parentId,
    replies: comment.replies?.map((reply) => formatComment(reply, currentUserId)),
    upvotes,
    downvotes,
    userVote,
    createdAt: comment.createdAt,
  };
}

export async function addComment(
  contentType: 'video' | 'picture' | 'quote',
  contentId: string,
  content: string,
  parentId?: string
) {
  const session = await requireUploadPermission();

  const trimmed = content?.trim();
  if (!trimmed || trimmed.length > 2000) {
    throw new Error("Invalid comment");
  }

  const comment = await prisma.comment.create({
    data: {
      content: trimmed,
      userId: session.user.id,
      [contentKey(contentType)]: contentId,
      parentId: parentId || undefined,
    },
  });

  const path = contentType === 'quote' ? `/quotes/${contentId}` : `/${contentType}s/${contentId}`;
  revalidatePath(path);
  revalidateTag('analytics', 'max');
  return comment;
}

export async function deleteComment(commentId: string, contentType: 'video' | 'picture' | 'quote', contentId: string) {
  const session = await requireUploadPermission();

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) throw new Error("Comment not found");

  // Only author, admin or owner can delete
  if (comment.userId !== session.user.id) {
    await requireAdminOrOwner();
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  const path = contentType === 'quote' ? `/quotes/${contentId}` : `/${contentType}s/${contentId}`;
  revalidatePath(path);
}

export async function voteComment(
  commentId: string,
  value: number,
  contentType: 'video' | 'picture' | 'quote',
  contentId: string
) {
  const session = await requireUploadPermission();
  const userId = session.user.id;

  if (value !== 1 && value !== -1 && value !== 0) {
    throw new Error("Invalid vote value");
  }

  if (value === 0) {
    // Remove vote
    await prisma.commentVote.delete({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    }).catch(() => { });
  } else {
    // Upsert vote
    await prisma.commentVote.upsert({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
      update: {
        value,
      },
      create: {
        userId,
        commentId,
        value,
      },
    });
  }

  const path = contentType === 'quote' ? `/quotes/${contentId}` : `/${contentType}s/${contentId}`;
  revalidatePath(path);
}
