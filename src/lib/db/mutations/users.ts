import { prisma } from "@/src/lib/prisma";
import { User } from "@/src/lib/types/types";

export async function addUser(user: User): Promise<void> {
    try {
        if (!user?.id) {
            throw new Error("user.id is required");
        }

        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                name: user.username,
                image: user.profilePicture,
            },
            create: {
                id: user.id,
                name: user.username,
                image: user.profilePicture,
            },
        });
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
}

export async function editUser(updatedUser: User): Promise<void> {
    try {
        if (!updatedUser?.id) {
            throw new Error("user.id is required");
        }

        await prisma.user.update({
            where: { id: updatedUser.id },
            data: {
                name: updatedUser.username,
                image: updatedUser.profilePicture,
            },
        });
    } catch (error) {
        console.error('Error editing user:', error);
        throw error;
    }
}

export async function deleteUser(userId: string): Promise<void> {
    try {
        await prisma.user.delete({
            where: { id: userId },
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}
