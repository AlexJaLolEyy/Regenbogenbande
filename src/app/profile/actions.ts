"use server"

import { requireAuth } from "@/src/lib/auth-utils"
import { prisma } from "@/src/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateDisplayName(newName: string) {
    const session = await requireAuth()
    const userId = session.user.id

    if (!newName || newName.length < 2) {
        return { success: false, error: "Display name must be at least 2 characters long" }
    }

    if (newName.length > 32) {
        return { success: false, error: "Display name must be 32 characters or less" }
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { name: newName }
        })
        revalidatePath("/profile")
        revalidatePath("/", "layout")
        return { success: true }
    } catch {
        return { success: false, error: "Failed to update display name" }
    }
}

export async function updateProfilePicture(url: string) {
    const session = await requireAuth()
    
    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: url }
        })
        revalidatePath("/profile")
        revalidatePath("/", "layout")
        return { success: true }
    } catch {
        return { success: false, error: "Failed to update profile picture" }
    }
}
