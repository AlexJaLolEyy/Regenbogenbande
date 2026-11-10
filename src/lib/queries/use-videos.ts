import { FilterState } from '@/src/lib/types/filters';
import { VideoListItem } from '@/src/lib/types/types';
import { queryKeys } from './query-keys';
import { PagedList, usePagedList } from './use-paged-list';

export const VIDEOS_PER_PAGE = 15;

export function useVideos(filters: FilterState, page: number, initialData?: PagedList<VideoListItem>) {
    return usePagedList<VideoListItem>({
        endpoint: '/api/videos',
        queryKey: queryKeys.videos.list(filters),
        filters,
        page,
        pageSize: VIDEOS_PER_PAGE,
        initialData,
    });
}
