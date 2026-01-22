import { Prisma } from "@/src/generated/prisma";
import { Session } from "@/src/lib/auth";
import { getEffectiveRole } from "@/src/lib/auth-utils";
import { prisma } from "@/src/lib/prisma";
import { Quote, QuoteListItem, QuoteMessage } from "@/src/lib/types/types";
import { getDateRangeFilter, getSortOrder } from '@/src/lib/utils/date-filters';
import {
    calculateAvgRating,
    FetchOptions,
    PrismaUser,
    transformUser,
    userSelect
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
    ratings: { select: { value: true } },
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
        averageRating: calculateAvgRating(prismaQuote.ratings),
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
        averageRating: calculateAvgRating(prismaQuote.ratings),
        isPublic: prismaQuote.isPublic ?? false,
        publishedAt: prismaQuote.publishedAt ? new Date(prismaQuote.publishedAt) : null,
    };
}

export async function getQuotesForList(session?: Session | null, options?: FetchOptions): Promise<QuoteListItem[]> {
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

        const orderBy = getSortOrder(sort);

        const quotes = await prisma.quote.findMany({
            where,
            select: quoteListSelect,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        }) as PrismaQuoteList[];
        return quotes.map(transformQuoteListItem);
    } catch (error) {
        console.error('Error fetching quotes for list:', error);
        return [];
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

        const orderBy = getSortOrder(sort);

        const quotes = await prisma.quote.findMany({
            where,
            select: quoteDetailSelect,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        }) as PrismaQuoteDetail[];
        return quotes.map(transformQuote);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        return [];
    }
}

export async function getQuoteById(id: string): Promise<Quote | null> {
    try {
        const quote = await prisma.quote.findUnique({
            where: { id: String(id) },
            select: quoteDetailSelect,
        });

        if (!quote) return null;
        return transformQuote(quote as PrismaQuoteDetail);
    } catch (error) {
        console.error('Error fetching quote by id:', error);
        return null;
    }
}
