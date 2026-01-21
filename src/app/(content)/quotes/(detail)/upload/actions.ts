"use server"

import { checkUploadPermission } from '@/src/lib/auth-utils';
import { addQuote } from '@/src/lib/db/mutations/quotes';
import { QuoteUploadForm } from '@/src/lib/types/types';
import { parseQuoteActionToBackend } from '@/src/lib/utils/quote-utils';
import { redirect } from 'next/navigation';

/**
 * Creates a quote in the database
 */
export async function createQuote(data: QuoteUploadForm) {
  const session = await checkUploadPermission();

  // Fallback: If uploadedBy is missing, use session user
  if (!data.uploadedBy) {
    data.uploadedBy = {
      id: session.user.id,
      username: session.user.name,
      profilePicture: session.user.image || null,
      status: 'ACTIVE'
    };
  }

  // Parse and convert using extracted utility
  const quoteData = await parseQuoteActionToBackend(data);

  // Add to database
  const createdQuote = await addQuote(quoteData);

  // Redirect to the quote detail page
  redirect(`/quotes/${createdQuote.id}/`);
}
