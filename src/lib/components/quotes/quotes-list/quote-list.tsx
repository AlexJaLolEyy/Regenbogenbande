'use client'

import { useSession } from "@/src/lib/auth-client";
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { Button, Link, Spinner } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { Quote } from "../../../types/types";
import { AnimatedMasonryItem } from "../../motion/animated-grid-item";
import { AppSidebar } from "../../navigation/app-sidebar";
import QuoteComponent from "../quote/quote";

export default function QuoteList({ initialQuotes, categories }: { initialQuotes: Quote[], categories: { id: string; name: string }[] }) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filtersToParams = useCallback((currentFilters: FilterState) => {
    const params: Record<string, string> = {};
    if (currentFilters.search) params.search = currentFilters.search;
    if (currentFilters.sort) params.sort = currentFilters.sort;
    if (currentFilters.categoryId) params.categoryId = currentFilters.categoryId;
    if (currentFilters.dateRange) params.dateRange = currentFilters.dateRange;
    return params;
  }, []);

  const fetchQuotes = useCallback(async (currentPage: number, currentFilters: FilterState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(20), // Assuming 20 quotes per page
        ...filtersToParams(currentFilters),
      });
      const response = await fetch(`/api/quotes?${params.toString()}`);
      const newQuotes = await response.json();
      return newQuotes;
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filtersToParams]);

  useEffect(() => {
    const loadFilteredQuotes = async () => {
      const newQuotes = await fetchQuotes(1, filters);
      setQuotes(newQuotes);
      setPage(1);
      setHasMore(newQuotes.length === 20);
    };
    loadFilteredQuotes();
  }, [filters, fetchQuotes]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    const newQuotes = await fetchQuotes(page + 1, filters);
    if (newQuotes.length < 20) {
      setHasMore(false);
    }
    setQuotes(prev => [...prev, ...newQuotes]);
    setPage(prev => prev + 1);
  };

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
        <div className="max-w-[1600px] mx-auto space-y-8">
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

          {quotes && quotes.length > 0 ? (
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

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={loadMore}
                disabled={loading}
                variant="flat"
                className="min-w-[120px] flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Loading...</span>
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
