export type SortOption = 'newest' | 'oldest' | 'popular' | 'random';
export type DateRange = 'all' | 'this-week' | 'last-30-days' | 'this-year' | '2024' | '2023' | '2022' | '2021' | '2020' | '2019' | '2018';

export interface FilterState {
  search: string;
  sort: SortOption;
  categoryId: string | null;
  dateRange: DateRange;
  /** Only content this user is tagged in */
  participantId: string | null;
  /** Only content the current user has not seen yet */
  unseenOnly: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  sort: 'newest',
  categoryId: null,
  dateRange: 'all',
  participantId: null,
  unseenOnly: false,
};
