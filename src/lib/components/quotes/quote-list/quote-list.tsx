'use client'

import { QUOTES_PER_PAGE, useQuotes } from "@/src/lib/queries/use-quotes";
import { staggerDelay } from "@/src/lib/motion";
import { FilterState } from '@/src/lib/types/filters';
import { useUrlFilters } from '@/src/lib/hooks/use-url-filters';
import { useState } from "react";
import type { PagedList } from "@/src/lib/queries/use-paged-list";
import { QuoteListItem } from "../../../types/types";
import { AnimatedMasonryItem } from "../../motion/animated-grid-item";
import { FilterBar } from "../../navigation/filter-bar";
import { CardSkeleton, EmptyState, LIST_MASONRY, ListPanel } from '../../ui/media-card';
import { ListPagination } from '../../ui/list-pagination';
import { PageShell } from '../../ui/page-shell';
import QuoteComponent from "../quote/quote";

export default function QuoteList({ initial, categories, people }: { people: { id: string; name: string }[], initial: PagedList<QuoteListItem>, categories: { id: string; name: string, iconUrl?: string | null }[] }) {
  const [filters, setFilters] = useUrlFilters();
  const [page, setPage] = useState(1);

  const { data, isFetching, isLoading: isInitialLoading } = useQuotes(filters, page, initial);

  const quotes = data?.items ?? [];
  const total = data?.total ?? 0;
  const loading = isInitialLoading || isFetching;

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-4 h-[calc(100vh-3rem)] w-full px-4 lg:px-6 pt-4 pb-4 lg:pb-6">
        <FilterBar
          contentType="quote"
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
          people={people}
        />
        <ListPanel scrollResetKey={page}
          title="Quotes"
          subtitle={data ? `${total} ${total === 1 ? "quote" : "quotes"}` : undefined}
          footer={total > QUOTES_PER_PAGE && <ListPagination page={page} total={total} pageSize={QUOTES_PER_PAGE} onChange={setPage} />}
        >
          {loading && quotes.length === 0 ? (
            <div className={LIST_MASONRY}>
              {Array.from({ length: 12 }).map((_, i) => (
                <CardSkeleton key={i} media={i % 2 ? 'h-40' : 'h-28'} className="mb-6 break-inside-avoid" />
              ))}
            </div>
          ) : quotes.length > 0 ? (
            <div className={LIST_MASONRY}>
              {quotes.map((quote, idx) => (
                <AnimatedMasonryItem key={quote.id} delay={staggerDelay(idx)} className="break-inside-avoid">
                  <QuoteComponent quote={quote} />
                </AnimatedMasonryItem>
              ))}
            </div>
          ) : (
            <EmptyState title="No quotes found" hint="Try adjusting your filters" />
          )}
        </ListPanel>
      </div>
    </PageShell>
  );
}
