import { Prisma } from "@/src/generated/prisma";
import { DateRange, SortOption } from "@/src/lib/types/filters";
import { prisma } from "@/src/lib/prisma";
import { getSortOrder } from "@/src/lib/utils/date-filters";
import { createHash } from "crypto";
import { User } from "@/src/lib/types/types";

export interface PagedResult<T> {
    items: T[];
    /** Total matching rows across all pages */
    total: number;
}

export interface FetchOptions {
    page?: number;
    limit?: number;
    search?: string;
    sort?: SortOption;
    categoryId?: string | null;
    dateRange?: DateRange;
    participantId?: string | null;
    unseenOnly?: boolean;
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

/**
 * Builds list query parameters for a sort option.
 * For `random`, ids are ordered by md5(id + hourly seed): shuffled, but stable across
 * pages within the hour so infinite scroll doesn't repeat items. Dataset is small, so
 * fetching ids only is cheap.
 */
export async function buildListQuery<W>(
    sort: SortOption,
    where: W,
    page: number,
    limit: number,
    fetchIds: (where: W) => Promise<{ id: string }[]>
): Promise<{
    where: W | { id: { in: string[] } };
    orderBy: ReturnType<typeof getSortOrder> | undefined;
    skip: number;
    take: number;
    reorder: <T extends { id: string }>(items: T[]) => T[];
}> {
    if (sort !== 'random') {
        return {
            where,
            orderBy: getSortOrder(sort),
            skip: (page - 1) * limit,
            take: limit,
            reorder: (items) => items,
        };
    }

    const seed = new Date().toISOString().slice(0, 13); // changes hourly
    const ids = (await fetchIds(where))
        .map((r) => r.id)
        .map((id) => ({ id, key: createHash('md5').update(id + seed).digest('hex') }))
        .sort((a, b) => (a.key < b.key ? -1 : 1))
        .map((r) => r.id);
    const pageIds = ids.slice((page - 1) * limit, page * limit);
    const position = new Map(pageIds.map((id, i) => [id, i]));

    return {
        where: { id: { in: pageIds } },
        orderBy: undefined,
        skip: 0,
        take: limit,
        reorder: (items) => [...items].sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0)),
    };
}

/** Returns only the IDs that belong to real users, so client-supplied IDs can never create or overwrite users. */
export async function filterExistingUserIds(ids: string[]): Promise<string[]> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return [];
    const users = await prisma.user.findMany({ where: { id: { in: unique } }, select: { id: true } });
    return users.map((u) => u.id);
}

