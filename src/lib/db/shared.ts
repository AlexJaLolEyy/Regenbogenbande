import { Prisma } from "@/src/generated/prisma";
import { DateRange, SortOption } from "@/src/lib/types/filters";
import { User } from "@/src/lib/types/types";

export interface FetchOptions {
    page?: number;
    limit?: number;
    search?: string;
    sort?: SortOption;
    categoryId?: string | null;
    dateRange?: DateRange;
}

export const userSelect = {
    id: true,
    name: true,
    image: true,
    status: true,
} as const;

export const categorySelect = {
    id: true,
    name: true,
    iconUrl: true,
} as const;

export type PrismaUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export function transformUser(prismaUser: PrismaUser): User {
    return {
        id: prismaUser.id,
        username: prismaUser.name || '',
        profilePicture: prismaUser.image || null,
        status: prismaUser.status as User['status'],
    };
}

export function calculateAvgRating(ratings: { value: number }[]): number | undefined {
    if (!ratings || ratings.length === 0) return undefined;
    const sum = ratings.reduce((acc, r) => acc + r.value, 0);
    return sum / ratings.length;
}
