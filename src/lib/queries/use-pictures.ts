import { FilterState } from '@/src/lib/types/filters';
import { PictureListItem } from '@/src/lib/types/types';
import { queryKeys } from './query-keys';
import { PagedList, usePagedList } from './use-paged-list';

export const PICTURES_PER_PAGE = 20;

export function usePictures(filters: FilterState, page: number, initialData?: PagedList<PictureListItem>) {
    return usePagedList<PictureListItem>({
        endpoint: '/api/pictures',
        queryKey: queryKeys.pictures.list(filters),
        filters,
        page,
        pageSize: PICTURES_PER_PAGE,
        initialData,
    });
}
