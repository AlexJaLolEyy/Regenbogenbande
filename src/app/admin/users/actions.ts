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
            take: 500,
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
        take: 500,
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

const ASSIGNABLE_ROLES = ["member", "admin"] as const

function parseAssignableRole(role: string): Role | null {
    return (ASSIGNABLE_ROLES as readonly string[]).includes(role) ? (role as Role) : null
}

export async function createInvite(discordId: string, discordName: string, requestedRole: string = "member") {
    const session = await requireAdminOrOwner()

    const role = parseAssignableRole(requestedRole)
    if (!role) {
        return { success: false, error: "Invalid role" }
    }

    if (!discordId || discordId.length < 17) {
        return { success: false, error: "Invalid Discord ID. It should be a 17-19 digit number." }
    }

    try {
        // An invite must never overwrite the owner (or an existing account's role)
        const existingUser = await prisma.user.findUnique({
            where: { discordId },
            select: { role: true },
        })
        if (existingUser && (existingUser.role as string) === "owner") {
            return { success: false, error: "This Discord ID belongs to the owner" }
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the invite
            const invite = await tx.invite.create({
                data: {
                    discordId,
                    discordName: discordName || null,
                    role,
                    createdById: session.user.id,
                }
            });

            // 2. Create the User record (unverified)
            // This allows the user to be selected as participant/author immediately
            await tx.user.upsert({
                where: { discordId },
                update: {
                    name: discordName || `User ${discordId.slice(-4)}`,
                    role,
                },
                create: {
                    name: discordName || `User ${discordId.slice(-4)}`,
                    discordId,
                    role,
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
                    _count: {
                        select: {
                            uploadedVideos: true,
                            uploadedPictures: true,
                            uploadedQuotes: true,
                            videoParticipants: true,
                            pictureParticipants: true,
                            quoteParticipants: true,
                        }
                    }
                }
            });

            // If the user hasn't logged in yet (no email), we can clean up
            if (user && !user.email) {
                // Check if user has any contributions before deleting
                const hasContributions = Object.values(user._count).some((n) => n > 0);

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

    // Only member/admin are assignable; owner can only be set directly in the database
    const parsedRole = parseAssignableRole(newRole)
    if (!parsedRole) {
        return { success: false, error: "Invalid role" }
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
            data: { role: parsedRole }
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
        // Disable and revoke all active sessions so access ends immediately
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { status: "DISABLED" }
            }),
            prisma.session.deleteMany({ where: { userId } }),
        ])
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Delete user error:", error)
        return { success: false, error: "Failed to delete user" }
    }
}

