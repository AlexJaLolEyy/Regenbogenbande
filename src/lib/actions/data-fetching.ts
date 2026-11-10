"use server"

import { requireAuth } from '@/src/lib/auth-utils';
import { getAllCategories as _getAllCategories } from '@/src/lib/db/selects/categories';
import { getAllSelectableParticipants as _getAllSelectableParticipants, getAllUsers as _getAllUsers, getUserById as _getUserById } from '@/src/lib/db/selects/users';
import { Category, User } from '@/src/lib/types/types';

// Re-export as server actions for client components.
// Every action requires a session (guests have anonymous sessions).
export async function getAllSelectableParticipants(): Promise<User[]> {
    await requireAuth();
    return _getAllSelectableParticipants();
}

export async function getAllUsers(): Promise<User[]> {
    await requireAuth();
    return _getAllUsers();
}

export async function getUserById(id: string): Promise<User | null> {
    await requireAuth();
    return _getUserById(id);
}

export async function getAllCategories(): Promise<Category[]> {
    await requireAuth();
    return _getAllCategories();
}
