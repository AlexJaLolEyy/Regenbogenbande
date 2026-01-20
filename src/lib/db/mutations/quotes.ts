import { checkOwnerOrAdmin, checkUploadPermission, requireOwner } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { Quote } from "@/src/lib/types/types";
import { PrismaQuoteDetail, quoteDetailSelect, transformQuote } from "../selects/quotes";

export async function addQuote(quote: Quote): Promise<Quote> {
    try {
        await checkUploadPermission();

        if (!quote.uploadedBy?.id) {
            throw new Error("uploadedBy is required");
        }

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
            select: quoteDetailSelect,
        }) as PrismaQuoteDetail;

        for (const msg of quote.messages) {
            const author = await prisma.user.upsert({
                where: { id: msg.user.id },
                update: { name: msg.user.username, image: msg.user.profilePicture },
                create: { id: msg.user.id, name: msg.user.username, image: msg.user.profilePicture },
            });

            await prisma.quoteMessage.create({
                data: {
                    quoteId: createdQuote.id,
                    message: msg.message,
                    userId: author.id,
                },
            });
        }

        for (const participant of quote.participants) {
            await prisma.user.upsert({
                where: { id: participant.id },
                update: { name: participant.username, image: participant.profilePicture },
                create: { id: participant.id, name: participant.username, image: participant.profilePicture },
            });

            await prisma.quoteParticipant.create({
                data: { quoteId: createdQuote.id, userId: participant.id },
            });
        }

        return transformQuote(createdQuote);
    } catch (error) {
        console.error('Error adding quote:', error);
        throw error;
    }
}

export async function updateQuote(quote: Quote): Promise<Quote> {
    try {
        if (!quote.uploadedBy?.id) throw new Error("uploadedBy is required");
        await checkOwnerOrAdmin(quote.uploadedBy.id);

        const updatedQuote = await prisma.quote.update({
            where: { id: quote.id },
            data: {
                uploadedAt: quote.uploadedAt,
                createdAt: quote.createdAt,
                views: quote.views || 0,
                isPublic: quote.isPublic ?? false,
                publishedAt: quote.publishedAt,
            },
            select: quoteDetailSelect,
        }) as PrismaQuoteDetail;

        await prisma.quoteMessage.deleteMany({ where: { quoteId: quote.id } });
        for (const msg of quote.messages) {
            const author = await prisma.user.upsert({
                where: { id: msg.user.id },
                update: { name: msg.user.username, image: msg.user.profilePicture },
                create: { id: msg.user.id, name: msg.user.username, image: msg.user.profilePicture },
            });

            await prisma.quoteMessage.create({
                data: {
                    quoteId: quote.id,
                    message: msg.message,
                    userId: author.id,
                },
            });
        }

        await prisma.quoteParticipant.deleteMany({ where: { quoteId: quote.id } });
        for (const participant of quote.participants) {
            await prisma.user.upsert({
                where: { id: participant.id },
                update: { name: participant.username, image: participant.profilePicture },
                create: { id: participant.id, name: participant.username, image: participant.profilePicture },
            });

            await prisma.quoteParticipant.create({
                data: { quoteId: quote.id, userId: participant.id },
            });
        }

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
            include: { uploadedBy: true }
        });

        if (!quote) throw new Error("Quote not found");
        await checkOwnerOrAdmin(quote.uploadedById);

        await prisma.quote.delete({ where: { id: quoteId } });
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
            data: { isPublic: false },
        });
    } catch (error) {
        console.error('Error unpublishing quote:', error);
        throw error;
    }
}
