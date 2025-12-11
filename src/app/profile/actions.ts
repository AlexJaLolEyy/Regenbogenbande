"use server"

import { prisma } from "@/src/lib/prisma"
import { checkAuth } from "@/src/lib/auth-utils"
import bcrypt from "bcrypt"
import { revalidatePath } from "next/cache"

export async function updateUsername(newUsername: string) {
    const session = await checkAuth()
    if (!session?.user?.id) return { success: false, error: "User not found" }
    const userId = session.user.id

    if (!newUsername || newUsername.length < 3) {
        return { success: false, error: "Username must be at least 3 characters long" }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { username: newUsername }
        })
        revalidatePath("/profile")
        return { success: true }
    } catch {
        return { success: false, error: "Username already taken or invalid" }
    }
}

export async function updatePassword(newPassword: string) {
    const session = await checkAuth()
    if (!session?.user?.id) return { success: false, error: "User not found" }
    const userId = session.user.id

    if (!newPassword || newPassword.length < 6) {
        return { success: false, error: "Password must be at least 6 characters long" }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        })
        return { success: true }
    } catch {
        return { success: false, error: "Failed to update password" }
    }
}

// TODO: Implement actual file upload for profile picture
// For now, allow setting a URL or handle upload in a separate route that returns a URL
export async function updateProfilePicture(url: string) {
    const session = await checkAuth()
    if (!session?.user?.id) return { success: false, error: "User not found" }
    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { profilePicture: url }
        })
        revalidatePath("/profile")
        // Also validate global nav
        revalidatePath("/", "layout")
        return { success: true }
    } catch {
        return { success: false, error: "Failed to update profile picture" }
    }
}
