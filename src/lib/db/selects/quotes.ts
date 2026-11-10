import { Prisma } from "@/src/generated/prisma";
import { Session } from "@/src/lib/auth";
import { getEffectiveRole } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { Quote, QuoteListItem, QuoteMessage } from "@/src/lib/types/types";
import { getDateRangeFilter } from '@/src/lib/utils/date-filters';
import {
    FetchOptions,
    buildListQuery,
    PrismaUser,
    transformUser,
    userSelect,
    type PagedResult,
} from "../shared";

export const quoteListSelect = {
    id: true,
    views: true,
    uploadedAt: true,
    createdAt: true,
    isPublic: true,
    publishedAt: true,
    uploadedBy: { select: userSelect },
    participants: { select: { user: { select: userSelect } } },
    messages: {
        select: {
            id: true,
            message: true,
            isContext: true,
            user: { select: userSelect },
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' as const },
        take: 5,
    },
    ratingAvg: true,
    ratingCount: true,
} as const;

export const quoteDetailSelect = {
    ...quoteListSelect,
    messages: {
        select: {
            id: true,
            message: true,
            isContext: true,
            user: { select: userSelect },
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' as const },
    },
} as const;

export type PrismaQuoteList = Prisma.QuoteGetPayload<{ select: typeof quoteListSelect }>;
export type PrismaQuoteDetail = Prisma.QuoteGetPayload<{ select: typeof quoteDetailSelect }>;

export function transformQuoteMessage(prismaMessage: { id: string, message: string, isContext: boolean, user: PrismaUser }): QuoteMessage {
    return {
        id: prismaMessage.id,
        message: prismaMessage.message,
        isContext: prismaMessage.isContext,
        user: transformUser(prismaMessage.user),
    };
}

export function transformQuote(prismaQuote: PrismaQuoteDetail): Quote {
    return {
        id: prismaQuote.id,
        messages: prismaQuote.messages?.map(m => transformQuoteMessage(m)) || [],
        participants: prismaQuote.participants?.map(p => transformUser(p.user)) || [],
        uploadedBy: transformUser(prismaQuote.uploadedBy),
        uploadedAt: new Date(prismaQuote.uploadedAt),
        createdAt: new Date(prismaQuote.createdAt),
        views: prismaQuote.views || 0,
        isPublic: prismaQuote.isPublic ?? false,
        publishedAt: prismaQuote.publishedAt ? new Date(prismaQuote.publishedAt) : null,
        averageRating: prismaQuote.ratingAvg ?? undefined,
    };
}

export function transformQuoteListItem(prismaQuote: PrismaQuoteList): QuoteListItem {
    return {
        id: prismaQuote.id,
        messages: prismaQuote.messages?.map(m => transformQuoteMessage(m)) || [],
        participants: prismaQuote.participants?.map(p => transformUser(p.user)) || [],
        uploadedBy: transformUser(prismaQuote.uploadedBy),
        uploadedAt: new Date(prismaQuote.uploadedAt),
        createdAt: new Date(prismaQuote.createdAt),
        views: prismaQuote.views || 0,
        averageRating: prismaQuote.ratingAvg ?? undefined,
        isPublic: prismaQuote.isPublic ?? false,
        publishedAt: prismaQuote.publishedAt ? new Date(prismaQuote.publishedAt) : null,
    };
}

export async function getQuotesForList(session?: Session | null, options?: FetchOptions): Promise<PagedResult<QuoteListItem>> {
    try {
        const { page = 1, limit = 20, search, sort = 'newest', dateRange, participantId, unseenOnly } = options || {};
        const effectiveRole = session !== undefined ? getEffectiveRole(session) : "guest";

        const where: Prisma.QuoteWhereInput = {};

        if (effectiveRole === "guest") {
            where.isPublic = true;
        }

        if (search) {
            where.messages = { some: { message: { contains: search, mode: 'insensitive' } } };
        }

        if (dateRange && dateRange !== 'all') {
            where.createdAt = getDateRangeFilter(dateRange);
        }

        const viewerId = effectiveRole === "guest" ? null : session?.user?.id ?? null;

        if (participantId) {
            where.participants = { some: { userId: participantId } };
        }

        if (unseenOnly && viewerId) {
            where.userViews = { none: { userId: viewerId } };
            where.uploadedById = { not: viewerId };
        }

        const total = await prisma.quote.count({ where });
        const q = await buildListQuery(sort, where, page, limit, (w) => prisma.quote.findMany({ where: w, select: { id: true } }));

        const quotes = await prisma.quote.findMany({
            where: q.where as typeof where,
            select: quoteListSelect,
            orderBy: q.orderBy,
            skip: q.skip,
            take: q.take,
        }) as PrismaQuoteList[];
        const items = q.reorder(quotes).map(transformQuoteListItem);
        if (viewerId && items.length > 0) {
            const seen = new Set(
                (
                    await prisma.userQuoteView.findMany({
                        where: { userId: viewerId, quoteId: { in: items.map((i) => i.id) } },
                        select: { quoteId: true },
                    })
                ).map((v) => v.quoteId)
            );
            for (const item of items) item.isSeen = item.uploadedBy.id === viewerId || seen.has(item.id);
        }
        return { items, total };
    } catch (error) {
        console.error('Error fetching quotes for list:', error);
        return { items: [], total: 0 };
    }
}

export async function getAllQuotes(session?: Session | null, options?: FetchOptions): Promise<Quote[]> {
    try {
        const { page = 1, limit = 20, search, sort = 'newest', dateRange } = options || {};
        const effectiveRole = session !== undefined ? getEffectiveRole(session) : "guest";

        const where: Prisma.QuoteWhereInput = {};

        if (effectiveRole === "guest") {
            where.isPublic = true;
        }

        if (search) {
            where.messages = { some: { message: { contains: search, mode: 'insensitive' } } };
        }

        if (dateRange && dateRange !== 'all') {
            where.createdAt = getDateRangeFilter(dateRange);
        }

        const total = await prisma.quote.count({ where });
        const q = await buildListQuery(sort, where, page, limit, (w) => prisma.quote.findMany({ where: w, select: { id: true } }));

        const quotes = await prisma.quote.findMany({
            where: q.where as typeof where,
            select: quoteDetailSelect,
            orderBy: q.orderBy,
            skip: q.skip,
            take: q.take,
        }) as PrismaQuoteDetail[];
        return q.reorder(quotes).map(transformQuote);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        return [];
    }
}

/** Guests only get public quotes; pass the session (or null) so the rule is always applied. */
export async function getQuoteById(id: string, session: Session | null): Promise<Quote | null> {
    try {
        const where: Prisma.QuoteWhereInput = { id: String(id) };
        if (getEffectiveRole(session) === "guest") {
            where.isPublic = true;
        }
        const quote = await prisma.quote.findFirst({
            where,
            select: quoteDetailSelect,
        });

        if (!quote) return null;
        return transformQuote(quote as PrismaQuoteDetail);
    } catch (error) {
        console.error('Error fetching quote by id:', error);
        return null;
    }
}
