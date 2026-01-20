'use client'

import { useSession } from "@/src/lib/auth-client";
import { useQuotes } from "@/src/lib/queries/use-quotes";
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { Button, Link, Skeleton } from "@heroui/react";
import { useState } from "react";
import { QuoteListItem } from "../../../types/types";
import { AnimatedMasonryItem } from "../../motion/animated-grid-item";
import { AppSidebar } from "../../navigation/app-sidebar";
import QuoteComponent from "../quote/quote";

export default function QuoteList({ initialQuotes, categories }: { initialQuotes: QuoteListItem[], categories: { id: string; name: string }[] }) {
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

  const { data: session } = useSession();
  const canUploadContent = session?.user && !session.user.isAnonymous;

  return (
    <div className="flex gap-8 w-full">
      <AppSidebar
        contentType="quote"
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />
      <div className="flex-1 min-w-0">
        <div className="max-w-400 mx-auto space-y-8">
          <div className="flex justify-between items-center mb-8 pl-1">
            <div>
              <h1 className="text-3xl font-bold text-white">All Quotes</h1>
              <p className="text-white/40 text-sm">Refined Gallery</p>
            </div>
            <div className="flex items-center gap-4">
              {canUploadContent && (
                <Button
                  as={Link}
                  href="/quotes/upload"
                  color="primary"
                  variant="flat"
                >
                  Upload Quote
                </Button>
              )}
              <div className="text-sm text-white/50 border border-white/10 px-3 py-1 rounded-full">
                {quotes?.length ?? 0} Arrived
              </div>
            </div>
          </div>

          {loading && quotes.length === 0 ? (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="break-inside-avoid bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                  <div className="p-6 space-y-4">
                    <div className="flex gap-4">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2 rounded" />
                        <Skeleton className="h-10 w-full rounded" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <div className="flex gap-2">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="w-16 h-3 rounded" />
                      </div>
                      <Skeleton className="w-12 h-3 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : quotes && quotes.length > 0 ? (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {quotes.map((quote, idx) => (
                <AnimatedMasonryItem key={quote.id} delay={idx * 0.05} className="break-inside-avoid">
                  <QuoteComponent quote={quote} />
                </AnimatedMasonryItem>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-white/30">
              No quotes available yet.
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
                variant="flat"
                className="min-w-30 font-bold"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
