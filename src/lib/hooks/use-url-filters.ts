"use client";

import { DateRange, DEFAULT_FILTERS, FilterState, SortOption } from "@/src/lib/types/filters";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const SORTS: SortOption[] = ["newest", "oldest", "popular", "random"];

function parse(params: URLSearchParams): FilterState {
    const sort = params.get("sort") as SortOption | null;
    return {
        search: params.get("q") ?? DEFAULT_FILTERS.search,
        sort: sort && SORTS.includes(sort) ? sort : DEFAULT_FILTERS.sort,
        categoryId: params.get("category") || DEFAULT_FILTERS.categoryId,
        dateRange: (params.get("date") as DateRange | null) ?? DEFAULT_FILTERS.dateRange,
        participantId: params.get("person") || DEFAULT_FILTERS.participantId,
        unseenOnly: params.get("unseen") === "1",
    };
}

export function filtersAreDefault(f: FilterState): boolean {
    return (
        f.search === DEFAULT_FILTERS.search &&
        f.sort === DEFAULT_FILTERS.sort &&
        f.categoryId === DEFAULT_FILTERS.categoryId &&
        f.dateRange === DEFAULT_FILTERS.dateRange &&
        f.participantId === DEFAULT_FILTERS.participantId &&
        f.unseenOnly === DEFAULT_FILTERS.unseenOnly
    );
}

/**
 * List filter state that is initialised from, and mirrored to, the URL
 * (?category= &sort= &q= &date= &person= &unseen=1). The URL is updated with
 * history.replaceState so no server round-trip is triggered.
 */
export function useUrlFilters(): [FilterState, (next: FilterState) => void] {
    const searchParams = useSearchParams();
    const [filters, setFilters] = useState<FilterState>(() => parse(new URLSearchParams(searchParams.toString())));

    const update = useCallback((next: FilterState) => {
        setFilters(next);
        const p = new URLSearchParams();
        if (next.search) p.set("q", next.search);
        if (next.sort !== DEFAULT_FILTERS.sort) p.set("sort", next.sort);
        if (next.categoryId) p.set("category", next.categoryId);
        if (next.dateRange !== DEFAULT_FILTERS.dateRange) p.set("date", next.dateRange);
        if (next.participantId) p.set("person", next.participantId);
        if (next.unseenOnly) p.set("unseen", "1");
        const qs = p.toString();
        window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    }, []);

    return [filters, update];
}
