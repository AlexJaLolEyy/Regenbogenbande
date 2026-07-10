"use server"

import { Role } from "@/src/generated/prisma"
import { requireAdminOrOwner } from "@/src/lib/auth-utils"
import { prisma } from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getUsers() {
    await requireAdminOrOwner()

    const [realUsers, anonymousCount] = await Promise.all([
        prisma.user.findMany({
            where: { isAnonymous: false },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
                discordId: true,
                status: true,
                createdAt: true,
            }
        }),
        prisma.user.count({
            where: { isAnonymous: true }
        })
    ]);

    return { realUsers, anonymousCount }
}

export async function getInvites() {
    await requireAdminOrOwner()

    const invites = await prisma.invite.findMany({
        orderBy: { createdAt: "desc" },
    })

    return invites.map(invite => ({
        id: invite.id,
        discordId: invite.discordId,
        discordName: invite.discordName,
        role: invite.role,
        usedAt: invite.usedAt,
        createdAt: invite.createdAt,
    }))
}

export async function createInvite(discordId: string, discordName: string, role: string = "member") {
    const session = await requireAdminOrOwner()

    if (!discordId || discordId.length < 17) {
        return { success: false, error: "Invalid Discord ID. It should be a 17-19 digit number." }
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the invite
            const invite = await tx.invite.create({
                data: {
                    discordId,
                    discordName: discordName || null,
                    role: role as Role,
                    createdById: session.user.id,
                }
            });

            // 2. Create the User record (unverified)
            // This allows the user to be selected as participant/author immediately
            await tx.user.upsert({
                where: { discordId },
                update: {
                    name: discordName || `User ${discordId.slice(-4)}`,
                    role: role as Role,
                },
                create: {
                    name: discordName || `User ${discordId.slice(-4)}`,
                    discordId,
                    role: role as Role,
                    status: "INVITED",
                    image: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${discordId}&backgroundColor=b6e3f4,c0aede,d1d4f9`
                }
            });

            return invite;
        });

        revalidatePath("/admin/users")
        return { success: true, invite: result }
    } catch (error) {
        console.error("Create invite error:", error)
        return { success: false, error: "Failed to create invite. Discord ID might already be invited." }
    }
}

export async function deleteInvite(inviteId: string) {
    await requireAdminOrOwner()

    try {
        const invite = await prisma.invite.findUnique({
            where: { id: inviteId }
        })

        if (invite?.discordId) {
            // Find the user associated with this discordId
            const user = await prisma.user.findUnique({
                where: { discordId: invite.discordId },
                include: {
                    accounts: true,
                    uploadedVideos: true,
                    uploadedPictures: true,
                    uploadedQuotes: true,
                    videoParticipants: true,
                    pictureParticipants: true,
                    quoteParticipants: true
                }
            });

            // If the user hasn't logged in yet (no email), we can clean up
            if (user && !user.email) {
                // Check if user has any contributions before deleting
                const hasContributions = user.uploadedVideos.length > 0 ||
                    user.uploadedPictures.length > 0 ||
                    user.uploadedQuotes.length > 0 ||
                    user.videoParticipants.length > 0 ||
                    user.pictureParticipants.length > 0 ||
                    user.quoteParticipants.length > 0;

                if (!hasContributions) {
                    await prisma.user.delete({
                        where: { id: user.id }
                    });
                } else {
                    // Just un-assign the discordId so they can't log in via this invite
                    // but we keep the record because it's linked to content
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { discordId: null }
                    });
                }
            }
        }

        await prisma.invite.delete({
            where: { id: inviteId }
        })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Delete invite error:", error)
        return { success: false, error: "Failed to delete invite" }
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    const session = await requireAdminOrOwner()

    // Prevent assigning the owner role via UI
    if (newRole === "owner") {
        return { success: false, error: "Owner role can only be assigned directly in the database" }
    }

    // Prevent modifying a user who is currently an owner
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    })

    if ((targetUser?.role as string) === "owner") {
        return { success: false, error: "The owner role cannot be modified via the UI" }
    }

    // Prevent self-demotion (even for owners, they shouldn't demote themselves to member via this UI)
    if (session.user.id === userId) {
        return { success: false, error: "You cannot change your own role status here" }
    }

    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole as Role }
        })
        revalidatePath("/admin/users")
        return { success: true, user }
    } catch (error) {
        console.error("Update role error:", error)
        return { success: false, error: "Failed to update role" }
    }
}

export async function deleteUser(userId: string) {
    const session = await requireAdminOrOwner()

    if (session.user.id === userId) {
        return { success: false, error: "You cannot delete your own account" }
    }

    // Prevent deleting/disabling the owner
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    })

    if ((targetUser?.role as string) === "owner") {
        return { success: false, error: "The owner account cannot be disabled" }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { status: "DISABLED" }
        })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Delete user error:", error)
        return { success: false, error: "Failed to delete user" }
    }
}

