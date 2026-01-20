import { Quote, QuoteUploadForm, User } from '@/src/lib/types/types';
import { getUserById } from '../db/selects/users';

/**
 * Type for quote metadata (same as QuoteUploadForm but explicit)
 */
export type QuoteActionInput = QuoteUploadForm & {
    views?: number;
    isPublic?: boolean;
    publishedAt?: Date | null;
};

/**
 * Converts QuoteActionInput to Quote (with User objects and re-mapped messages)
 * Also handles user ID resolution
 */
export async function parseQuoteActionToBackend(
    input: QuoteActionInput
): Promise<Quote> {
    // 1. Handle uploadedBy
    let uploadedBy: User;
    if (typeof input.uploadedBy === "string") {
        const user = await getUserById(input.uploadedBy);
        if (!user) throw new Error(`User with ID ${input.uploadedBy} not found`);
        uploadedBy = user;
    } else {
        uploadedBy = input.uploadedBy;
    }

    // 2. Convert messages to backend format
    const messages = await Promise.all(
        input.messages.map(async (msg, i) => {
            const user = await getUserById(msg.userId);

            if (!user) {
                throw new Error(`Speaker with ID ${msg.userId} not found.`);
            }
            return {
                id: String(i),
                message: msg.message,
                user
            };
        })
    );

    // 3. Auto-detect participants from messages (unique users)
    const uniqueUsers = Array.from(new Map(messages.map(m => [m.user.id, m.user])).values());

    // 4. Create Quote object
    const quote: Quote = {
        id: input.id || "",
        uploadedBy: uploadedBy,
        uploadedAt: input.uploadedAt || new Date(),
        createdAt: input.createdAt || new Date(),
        messages: messages,
        participants: uniqueUsers,
        views: input.views || 0,
        isPublic: input.isPublic ?? false,
        publishedAt: input.publishedAt || null,
    };

    return quote;
}
