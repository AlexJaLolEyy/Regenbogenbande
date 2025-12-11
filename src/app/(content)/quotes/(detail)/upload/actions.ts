"use server"

import { addQuote, getUserById } from '@/src/app/current-storage/storage';
import { Quote, User } from '@/src/lib/types/types';
import { redirect } from 'next/navigation';
import { getAllQuotes } from '@/src/app/current-storage/storage';
import { checkUploadPermission } from '@/src/lib/auth-utils';

interface Message {
  userId: string;
  message: string;
}

interface QuoteFormData {
  uploadedBy: User | string;
  uploadedAt: Date;
  createdAt: Date;
  messages: Message[];
}

/**
 * Creates a quote in the database
 */
export async function createQuote(data: QuoteFormData) {
  await checkUploadPermission();
  // Handle uploadedBy - can be string ID or User object
  let uploadedBy: User;
  if (typeof data.uploadedBy === "string") {
    uploadedBy = await getUserById(parseInt(data.uploadedBy));
  } else {
    uploadedBy = data.uploadedBy;
  }

  // Convert messages to quote format
  const fullQuote = await Promise.all(
    data.messages.map(async (msg) => {
      const userId = typeof msg.userId === 'string' ? parseInt(msg.userId) : msg.userId;
      const user = await getUserById(userId);
      return {
        user: user,
        msg: msg.message,
      };
    })
  );

  // Auto-detect participants from messages (unique users)
  const participantIds = Array.from(new Set(data.messages.map(m => m.userId)));
  const participants = await Promise.all(
    participantIds.map(id => {
      const userId = typeof id === 'string' ? parseInt(id) : id;
      return getUserById(userId);
    })
  );

  // Generate a new ID if not provided
  const allQuotes = await getAllQuotes();
  const maxId = allQuotes.length > 0
    ? Math.max(...allQuotes.map(q => typeof q.id === 'number' ? q.id : parseInt(q.id.toString())))
    : 0;
  const quoteId = maxId + 1;

  // Create quote object
  const quote: Quote = {
    id: quoteId,
    uploadedBy: uploadedBy,
    uploadedAt: data.uploadedAt || new Date(),
    createdAt: data.createdAt || new Date(),
    fullQuote: fullQuote,
    participants: participants,
    metadata: {
      views: 0,
      rating: [],
    },
  };

  // Add to database
  await addQuote(quote);

  // Redirect to the quote detail page
  redirect(`/quotes/${quoteId}/`);
}

