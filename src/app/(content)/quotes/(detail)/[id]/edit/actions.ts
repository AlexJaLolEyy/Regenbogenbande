'use server'

import { checkOwnerOrAdmin } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { UploadQuote } from "@/src/lib/types/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateQuote(id: string, data: UploadQuote) {
    try {
        const existingQuote = await prisma.quote.findUnique({
            where: { id: id },
            include: { uploadedBy: true }
        });

        if (!existingQuote) {
            throw new Error("Quote not found");
        }

        // Check permissions
        await checkOwnerOrAdmin(existingQuote.uploadedBy.id);

        // Delete existing messages and create new ones (simplest update strategy for this schema)
        // Transactional update would be better but simple replace works for now
        await prisma.$transaction(async (tx) => {
            // Delete old messages
            await tx.quoteMessage.deleteMany({
                where: { quoteId: id }
            });

            // Update Quote Details
            await tx.quote.update({
                where: { id: id },
                data: {
                    // If uploadedBy changed, update it
                    uploadedBy: {
                        connect: { id: data.uploadedBy.id }
                    },
                    createdAt: data.createdAt, // Original creation date
                    // uploadedAt usually stays same or updates if desired

                    // Create new messages
                    messages: {
                        create: data.messages.map((msg) => ({
                            message: msg.message,
                            user: { connect: { id: msg.userId } }
                        }))
                    }
                }
            });
        });

    } catch (error: unknown) {
        console.error("Error updating quote:", error);
        throw error;
    }

    revalidatePath("/quotes");
    revalidatePath(`/quotes/${id}`);
    redirect(`/quotes/${id}`);
}
