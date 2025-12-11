"use server"

import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import bcrypt from "bcrypt"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"

// Helper to check admin status
async function checkAdmin() {
    const session = await auth()
    // @ts-expect-error - Dynamic property
    if (session?.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required")
    }
    return session
}

export async function getUsers() {
    await checkAdmin()
    return await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profilePicture: true,
            createdAt: true,
        }
    })
}

export async function createUser(username: string, role: string = "member") {
    await checkAdmin()

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    try {
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: role as Role,
            }
        })

        revalidatePath("/admin/users")
        return { success: true, user, tempPassword }
    } catch (error) {
        console.error("Create user error:", error)
        return { success: false, error: "Failed to create user. Username might be taken." }
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    const session = await checkAdmin()

    // Prevent self-demotion if you are the last admin (optional check, but good for safety)
    // For now just basic protection
    if (session?.user?.id === userId && newRole !== "admin") {
        // Allow for now, but good to warn.
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
    const session = await checkAdmin()

    if (session?.user?.id === userId) {
        return { success: false, error: "You cannot delete your own account" }
    }

    try {
        await prisma.user.delete({
            where: { id: userId }
        })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Delete user error:", error)
        return { success: false, error: "Failed to delete user" }
    }
}
