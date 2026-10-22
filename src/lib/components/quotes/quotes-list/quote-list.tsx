'use client'

import { useQuotes } from "@/src/lib/queries/use-quotes";
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { Button } from "@heroui/react";
import { useState } from "react";
import { QuoteListItem } from "../../../types/types";
import { AnimatedMasonryItem } from "../../motion/animated-grid-item";
import { FilterBar } from "../../navigation/filter-bar";
import { CardSkeleton, EmptyState, LIST_MASONRY, ListPanel } from '../../ui/media-card';
import { PageShell } from '../../ui/page-shell';
import QuoteComponent from "../quote/quote";

export default function QuoteList({ initialQuotes, categories }: { initialQuotes: QuoteListItem[], categories: { id: string; name: string, iconUrl?: string | null }[] }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: isInitialLoading,
  } = useQuotes(filters, initialQuotes);

  const quotes = data?.pages.flat() ?? [];
  const loading = isInitialLoading || (isFetching && !isFetchingNextPage);

  return (
    <PageShell>
      <div className="flex flex-col gap-4 h-[calc(100vh-3rem)] w-full px-4 lg:px-6 pt-4 pb-4 lg:pb-6">
        <FilterBar
          contentType="quote"
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
        />
        <ListPanel
          title="Quotes"
          footer={hasNextPage && (
            <Button
              onPress={() => fetchNextPage()}
              isLoading={isFetchingNextPage}
              variant="flat"
              className="min-w-30 font-medium"
            >
              Load more
            </Button>
          )}
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
                <AnimatedMasonryItem key={quote.id} delay={idx * 0.05} className="break-inside-avoid">
                  <QuoteComponent quote={quote} />
                </AnimatedMasonryItem>
              ))}
            </div>
          ) : (
            <EmptyState title="No quotes available yet" />
          )}
        </ListPanel>
      </div>
    </PageShell>
  );
}
