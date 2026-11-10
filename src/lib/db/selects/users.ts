import { prisma } from "@/src/lib/prisma";
import { User } from "@/src/lib/types/types";
import { transformUser, userSelect } from "../shared";

export async function getAllUsers(): Promise<User[]> {
    try {
        const users = await prisma.user.findMany({
            where: {
                status: { not: 'DISABLED' }
            },
            select: userSelect,
            orderBy: {
                createdAt: 'desc',
            },
        });
        return users.map(transformUser);
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

export async function getAllSelectableParticipants(): Promise<User[]> {
    try {
        const users = await prisma.user.findMany({
            where: {
                isAnonymous: false,
                status: { in: ['INVITED', 'ACTIVE'] }
            },
            select: userSelect,
            orderBy: { createdAt: 'desc' },
        });

        return users.map(transformUser);
    } catch (error) {
        console.error('Error fetching selectable participants:', error);
        return [];
    }
}

export async function getUserById(id: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: userSelect,
        });
        return user ? transformUser(user) : null;
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        return null;
    }
}
