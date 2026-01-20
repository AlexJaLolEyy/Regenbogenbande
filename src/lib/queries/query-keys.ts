import { FilterState } from '@/src/lib/types/filters';

export const queryKeys = {
    videos: {
        all: ['videos'] as const,
        lists: () => [...queryKeys.videos.all, 'list'] as const,
        list: (filters: FilterState) => [...queryKeys.videos.lists(), filters] as const,
    },
    pictures: {
        all: ['pictures'] as const,
        lists: () => [...queryKeys.pictures.all, 'list'] as const,
        list: (filters: FilterState) => [...queryKeys.pictures.lists(), filters] as const,
    },
    quotes: {
        all: ['quotes'] as const,
        lists: () => [...queryKeys.quotes.all, 'list'] as const,
        list: (filters: FilterState) => [...queryKeys.quotes.lists(), filters] as const,
    },
};
