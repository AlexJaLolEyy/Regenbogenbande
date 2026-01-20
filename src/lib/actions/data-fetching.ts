"use server"

import { getAllCategories as _getAllCategories } from '@/src/lib/db/selects/categories';
import { getAllSelectableParticipants as _getAllSelectableParticipants, getAllUsers as _getAllUsers, getUserById as _getUserById } from '@/src/lib/db/selects/users';
import { Category, User } from '@/src/lib/types/types';

// Re-export as server actions for client components
export async function getAllSelectableParticipants(): Promise<User[]> {
    return _getAllSelectableParticipants();
}

export async function getAllUsers(): Promise<User[]> {
    return _getAllUsers();
}

export async function getUserById(id: string): Promise<User | null> {
    return _getUserById(id);
}

export async function getAllCategories(): Promise<Category[]> {
    return _getAllCategories();
}
