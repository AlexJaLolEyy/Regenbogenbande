import { checkOwnerOrAdmin, checkUploadPermission, getEffectiveRole, requireOwner } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { revalidateTag } from "next/cache";
import { Quote } from "@/src/lib/types/types";
import { filterExistingUserIds } from "../shared";
import { PrismaQuoteDetail, quoteDetailSelect, transformQuote } from "../selects/quotes";

/** Keeps only participants / message authors that are real users. */
async function resolveQuoteUsers(quote: Quote) {
    const validIds = new Set(
        await filterExistingUserIds([
            ...quote.participants.map((p) => p.id),
            ...quote.messages.map((m) => m.user.id),
        ])
    );
    return {
        participantIds: Array.from(new Set(quote.participants.map((p) => p.id))).filter((id) => validIds.has(id)),
        messages: quote.messages.filter((m) => validIds.has(m.user.id)),
    };
}

export async function addQuote(quote: Quote): Promise<Quote> {
    try {
        const session = await checkUploadPermission();
        // Only the owner can publish; everyone else's uploads start private.
        const isOwner = getEffectiveRole(session) === "owner";
        const { participantIds, messages } = await resolveQuoteUsers(quote);

        const createdQuote = await prisma.$transaction(async (tx) => {
            const created = await tx.quote.create({
                data: {
                    // Always the signed-in user, never a client-supplied ID
                    uploadedById: session.user.id,
                    uploadedAt: quote.uploadedAt,
                    createdAt: quote.createdAt,
                    views: 0,
                    isPublic: isOwner ? (quote.isPublic ?? false) : false,
                    publishedAt: isOwner && quote.isPublic ? (quote.publishedAt ?? new Date()) : null,
                },
                select: { id: true },
            });

            if (messages.length > 0) {
                await tx.quoteMessage.createMany({
                    data: messages.map((msg) => ({
                        quoteId: created.id,
                        message: msg.message,
                        userId: msg.user.id,
                        isContext: msg.isContext ?? false,
                    })),
                });
            }

            if (participantIds.length > 0) {
                await tx.quoteParticipant.createMany({
                    data: participantIds.map((userId) => ({ quoteId: created.id, userId })),
                    skipDuplicates: true,
                });
            }

            return tx.quote.findUniqueOrThrow({ where: { id: created.id }, select: quoteDetailSelect });
        }) as PrismaQuoteDetail;

        revalidateTag('analytics', 'max');
        return transformQuote(createdQuote);
    } catch (error) {
        console.error('Error adding quote:', error);
        throw error;
    }
}

export async function updateQuote(quote: Quote): Promise<Quote> {
    try {
        // Ownership comes from the database, not from the client payload
        const existing = await prisma.quote.findUnique({
            where: { id: quote.id },
            select: { uploadedById: true },
        });
        if (!existing) throw new Error("Quote not found");
        await checkOwnerOrAdmin(existing.uploadedById);

        const { participantIds, messages } = await resolveQuoteUsers(quote);

        // isPublic / publishedAt / views are intentionally not editable here
        const updatedQuote = await prisma.$transaction(async (tx) => {
            await tx.quote.update({
                where: { id: quote.id },
                data: {
                    uploadedAt: quote.uploadedAt,
                    createdAt: quote.createdAt,
                },
            });

            await tx.quoteMessage.deleteMany({ where: { quoteId: quote.id } });
            if (messages.length > 0) {
                await tx.quoteMessage.createMany({
                    data: messages.map((msg) => ({
                        quoteId: quote.id,
                        message: msg.message,
                        userId: msg.user.id,
                        isContext: msg.isContext ?? false,
                    })),
                });
            }

            await tx.quoteParticipant.deleteMany({ where: { quoteId: quote.id } });
            if (participantIds.length > 0) {
                await tx.quoteParticipant.createMany({
                    data: participantIds.map((userId) => ({ quoteId: quote.id, userId })),
                    skipDuplicates: true,
                });
            }

            return tx.quote.findUniqueOrThrow({ where: { id: quote.id }, select: quoteDetailSelect });
        }) as PrismaQuoteDetail;

        return transformQuote(updatedQuote);
    } catch (error) {
        console.error('Error updating quote:', error);
        throw error;
    }
}

export async function deleteQuote(quoteId: string): Promise<void> {
    try {
        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            select: { uploadedById: true },
        });

        if (!quote) throw new Error("Quote not found");
        await checkOwnerOrAdmin(quote.uploadedById);

        await prisma.quote.delete({ where: { id: quoteId } });
        revalidateTag('analytics', 'max');
    } catch (error) {
        console.error('Error deleting quote:', error);
        throw error;
    }
}

export async function publishQuote(quoteId: string): Promise<void> {
    try {
        await requireOwner();
        await prisma.quote.update({
            where: { id: quoteId },
            data: { isPublic: true, publishedAt: new Date() },
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
            data: { isPublic: false, publishedAt: null },
        });
    } catch (error) {
        console.error('Error unpublishing quote:', error);
        throw error;
    }
}
