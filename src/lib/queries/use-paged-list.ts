import { useQuery } from '@tanstack/react-query';
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';

export interface PagedList<T> {
    items: T[];
    total: number;
}

interface UsePagedListOptions<T> {
    /** API route, e.g. '/api/videos' */
    endpoint: string;
    queryKey: readonly unknown[];
    filters: FilterState;
    page: number;
    pageSize: number;
    /** Server-rendered first page; only used for page 1 with default filters */
    initialData?: PagedList<T>;
}

async function fetchPage<T>(
    endpoint: string,
    filters: FilterState,
    page: number,
    pageSize: number,
    signal?: AbortSignal
): Promise<PagedList<T>> {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (filters.search) params.set('search', filters.search);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.dateRange) params.set('dateRange', filters.dateRange);
    if (filters.participantId) params.set('participantId', filters.participantId);
    if (filters.unseenOnly) params.set('unseenOnly', '1');

    const response = await fetch(`${endpoint}?${params.toString()}`, { signal });
    if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
    return response.json();
}

/** Shared numbered-pagination query used by the video, picture and quote lists. */
export function usePagedList<T>({ endpoint, queryKey, filters, page, pageSize, initialData }: UsePagedListOptions<T>) {
    const isDefault =
        filters.search === DEFAULT_FILTERS.search &&
        filters.sort === DEFAULT_FILTERS.sort &&
        filters.categoryId === DEFAULT_FILTERS.categoryId &&
        filters.dateRange === DEFAULT_FILTERS.dateRange &&
        filters.participantId === DEFAULT_FILTERS.participantId &&
        filters.unseenOnly === DEFAULT_FILTERS.unseenOnly &&
        page === 1;

    return useQuery({
        queryKey: [...queryKey, page],
        queryFn: ({ signal }) => fetchPage<T>(endpoint, filters, page, pageSize, signal),
        initialData: initialData && isDefault ? initialData : undefined,
        placeholderData: (previous) => previous,
        staleTime: 1000 * 60 * 5,
    });
}
