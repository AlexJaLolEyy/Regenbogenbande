"use server"

import { Role } from "@/src/generated/prisma"
import { requireAdmin } from "@/src/lib/auth-utils"
import { prisma } from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getUsers() {
    await requireAdmin()
    return await prisma.user.findMany({
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
    })
}

export async function getInvites() {
    await requireAdmin()

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
    const session = await requireAdmin()

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
            const user = await tx.user.upsert({
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
    await requireAdmin()

    try {
        const invite = await prisma.invite.findUnique({
            where: { id: inviteId }
        })

        if (invite?.discordId) {
            // Find the user associated with this discordId
            const user = await prisma.user.findUnique({
                where: { discordId: invite.discordId },
                include: { accounts: true }
            });

            // If the user hasn't logged in yet (no email), we can clean up
            if (user && !user.email) {
                await prisma.user.delete({
                    where: { id: user.id }
                });
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
    const session = await requireAdmin()

    // Prevent self-demotion
    if (session.user.id === userId && newRole !== "admin") {
        return { success: false, error: "You cannot remove your own admin status" }
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
    const session = await requireAdmin()

    if (session.user.id === userId) {
        return { success: false, error: "You cannot delete your own account" }
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
