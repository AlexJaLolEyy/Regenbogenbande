import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { VideoListItem } from '@/src/lib/types/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from './query-keys';

const VIDEOS_PER_PAGE = 20;

async function fetchVideos(
    filters: FilterState,
    page: number,
    signal?: AbortSignal
): Promise<VideoListItem[]> {
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

export function useVideos(filters: FilterState, initialData?: VideoListItem[]) {
    // Only use initialData if filters are at their default state
    const isDefault =
        filters.search === DEFAULT_FILTERS.search &&
        filters.sort === DEFAULT_FILTERS.sort &&
        filters.categoryId === DEFAULT_FILTERS.categoryId &&
        filters.dateRange === DEFAULT_FILTERS.dateRange;

    return useInfiniteQuery({
        queryKey: queryKeys.videos.list(filters),
        queryFn: ({ pageParam, signal }) => fetchVideos(filters, pageParam, signal),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === VIDEOS_PER_PAGE ? allPages.length + 1 : undefined;
        },
        initialData: (initialData && isDefault)
            ? { pages: [initialData], pageParams: [1] }
            : undefined,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
}
