"use server"

import { addQuote, getUserById } from '@/src/app/current-storage/storage';
import { checkUploadPermission } from '@/src/lib/auth-utils';
import { Quote, User } from '@/src/lib/types/types';
import { redirect } from 'next/navigation';

interface Message {
  userId: string;
  message: string;
}

interface QuoteFormData {
  id?: string;
  uploadedBy: User | string;
  uploadedAt: Date;
  createdAt: Date;
  messages: Message[];
}

/**
 * Creates a quote in the database
 */
export async function createQuote(data: QuoteFormData) {
  const session = await checkUploadPermission();

  // Handle uploadedBy - can be string ID or User object
  let uploadedBy: User;
  if (!data.uploadedBy) {
    uploadedBy = {
      id: session.user.id,
      username: session.user.name,
      profilePicture: session.user.image || null,
    };
  } else if (typeof data.uploadedBy === "string") {
    const user = await getUserById(data.uploadedBy);
    if (!user) throw new Error(`User with ID ${data.uploadedBy} not found`);
    uploadedBy = user;
  } else {
    uploadedBy = data.uploadedBy;
  }

  // Convert messages to quote format
  const fullQuote = await Promise.all(
    data.messages.map(async (msg) => {
      const user = await getUserById(msg.userId);
      
      if (!user) {
        throw new Error(`Speaker with ID ${msg.userId} not found. Please make sure all speakers are valid users or invited members.`);
      }
      return {
        user,
        msg: msg.message,
      };
    })
  );

  // Auto-detect participants from messages (unique users)
  // We already have the fullQuote with users, so we can use that
  const uniqueUsers = Array.from(new Map(fullQuote.map(fq => [fq.user.id, fq.user])).values());
  
  // Create quote object
  const quote: Quote = {
    id: data.id || "", // Prisma will generate if empty
    uploadedBy: uploadedBy,
    uploadedAt: data.uploadedAt || new Date(),
    createdAt: data.createdAt || new Date(),
    messages: fullQuote.map((fq, i) => ({ id: String(i), message: fq.msg, user: fq.user })),
    participants: uniqueUsers.map(u => ({ type: 'user', data: u })),
    views: 0,
    isPublic: false,
    publishedAt: null,
  };

  // Add to database
  const createdQuote = await addQuote(quote);

  // Redirect to the quote detail page
  redirect(`/quotes/${createdQuote.id}/`);
}
