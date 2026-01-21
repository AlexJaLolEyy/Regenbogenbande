"use server"

import { requireContentOwnerOrAdmin } from "@/src/lib/auth-utils";
import { updateQuote } from "@/src/lib/db/mutations/quotes";
import { getQuoteById } from "@/src/lib/db/selects/quotes";
import { parseQuoteActionToBackend, QuoteActionInput } from "@/src/lib/utils/quote-utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateQuoteElement(id: string, data: QuoteActionInput) {
    try {
        const existingQuote = await getQuoteById(id);

        if (!existingQuote) {
            throw new Error("Quote not found");
        }

        // Check permissions
        await requireContentOwnerOrAdmin(existingQuote.uploadedBy.id);

        const backendQuote = await parseQuoteActionToBackend(data);
        backendQuote.id = id;

        // Preserve metadata
        backendQuote.views = existingQuote.views;
        backendQuote.isPublic = existingQuote.isPublic;
        backendQuote.publishedAt = existingQuote.publishedAt;

        await updateQuote(backendQuote);

    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("Error updating quote:", error);
        throw error;
    }

    revalidatePath("/quotes");
    revalidatePath(`/quotes/${id}`);
    redirect(`/quotes/${id}`);
}
