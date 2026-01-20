import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { QuoteListItem } from '@/src/lib/types/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

const QUOTES_PER_PAGE = 20;

async function fetchQuotes(
    filters: FilterState,
    page: number,
    signal?: AbortSignal
): Promise<QuoteListItem[]> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(QUOTES_PER_PAGE),
    });

    if (filters.search) params.set('search', filters.search);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.dateRange) params.set('dateRange', filters.dateRange);

    const response = await fetch(`/api/quotes?${params.toString()}`, { signal });
    if (!response.ok) throw new Error('Failed to fetch quotes');
    return response.json();
}

export function useQuotes(filters: FilterState, initialData?: QuoteListItem[]) {
    // Only use initialData if filters are at their default state
    const isDefault =
        filters.search === DEFAULT_FILTERS.search &&
        filters.sort === DEFAULT_FILTERS.sort &&
        filters.categoryId === DEFAULT_FILTERS.categoryId &&
        filters.dateRange === DEFAULT_FILTERS.dateRange;

    return useInfiniteQuery({
        queryKey: queryKeys.quotes.list(filters),
        queryFn: ({ pageParam, signal }) => fetchQuotes(filters, pageParam, signal),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === QUOTES_PER_PAGE ? allPages.length + 1 : undefined;
        },
        initialData: (initialData && isDefault)
            ? { pages: [initialData], pageParams: [1] }
            : undefined,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
}
