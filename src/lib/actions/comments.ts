"use server";

import { requireAdmin, requireAuth } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getComments(contentType: 'video' | 'picture' | 'quote', contentId: string) {
  const session = await requireAuth().catch(() => null);
  const userId = session?.user.id;

  const comments = await prisma.comment.findMany({
    where: {
      OR: [
        { videoId: contentType === 'video' ? contentId : undefined },
        { pictureId: contentType === 'picture' ? contentId : undefined },
        { quoteId: contentType === 'quote' ? contentId : undefined },
      ],
      parentId: null, // Only fetch top-level comments initially or include replies
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
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

function formatComment(comment: any, currentUserId?: string) {
  const upvotes = comment.votes.filter((v: any) => v.value === 1).length;
  const downvotes = comment.votes.filter((v: any) => v.value === -1).length;
  const userVote = currentUserId 
    ? comment.votes.find((v: any) => v.userId === currentUserId)?.value 
    : undefined;

  return {
    id: comment.id,
    content: comment.content,
    user: {
      id: comment.user.id,
      username: comment.user.name,
      profilePicture: comment.user.image,
    },
    parentId: comment.parentId,
    replies: comment.replies?.map((reply: any) => formatComment(reply, currentUserId)),
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
  const session = await requireAuth();
  
  const comment = await prisma.comment.create({
    data: {
      content,
      userId: session.user.id,
      videoId: contentType === 'video' ? contentId : undefined,
      pictureId: contentType === 'picture' ? contentId : undefined,
      quoteId: contentType === 'quote' ? contentId : undefined,
      parentId: parentId || undefined,
    },
  });

  const path = contentType === 'quote' ? `/quotes/${contentId}` : `/${contentType}s/${contentId}`;
  revalidatePath(path);
  return comment;
}

export async function deleteComment(commentId: string, contentType: 'video' | 'picture' | 'quote', contentId: string) {
  const session = await requireAuth();
  
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });

  if (!comment) throw new Error("Comment not found");

  // Only author or admin can delete
  if (comment.userId !== session.user.id && session.user.role !== 'admin') {
    await requireAdmin();
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
  const session = await requireAuth();
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
    }).catch(() => {});
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
