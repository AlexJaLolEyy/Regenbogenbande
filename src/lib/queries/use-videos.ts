import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { VideoListItem } from '@/src/lib/types/types';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

const VIDEOS_PER_PAGE = 15;

async function fetchVideos(
    filters: FilterState,
    page: number,
    signal?: AbortSignal
): Promise<{ items: VideoListItem[]; total: number }> {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(VIDEOS_PER_PAGE),
    });

    if (filters.search) params.set('search', filters.search);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.dateRange) params.set('dateRange', filters.dateRange);

    const response = await fetch(`/api/videos?${params.toString()}`, { signal });
    if (!response.ok) throw new Error('Failed to fetch videos');
    return response.json();
}

export function useVideos(
    filters: FilterState,
    page: number,
    initialData?: { items: VideoListItem[]; total: number }
) {
    // Only use initialData if filters are at their default state and we are on page 1
    const isDefault =
        filters.search === DEFAULT_FILTERS.search &&
        filters.sort === DEFAULT_FILTERS.sort &&
        filters.categoryId === DEFAULT_FILTERS.categoryId &&
        filters.dateRange === DEFAULT_FILTERS.dateRange &&
        page === 1;

    return useQuery({
        queryKey: [...queryKeys.videos.list(filters), page],
        queryFn: ({ signal }) => fetchVideos(filters, page, signal),
        initialData: (initialData && isDefault)
            ? initialData
            : undefined,
        placeholderData: (previousData) => previousData,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
}
