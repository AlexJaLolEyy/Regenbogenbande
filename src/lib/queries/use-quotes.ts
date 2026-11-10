import { FilterState } from '@/src/lib/types/filters';
import { QuoteListItem } from '@/src/lib/types/types';
import { queryKeys } from './query-keys';
import { PagedList, usePagedList } from './use-paged-list';

export const QUOTES_PER_PAGE = 20;

export function useQuotes(filters: FilterState, page: number, initialData?: PagedList<QuoteListItem>) {
    return usePagedList<QuoteListItem>({
        endpoint: '/api/quotes',
        queryKey: queryKeys.quotes.list(filters),
        filters,
        page,
        pageSize: QUOTES_PER_PAGE,
        initialData,
    });
}
