"use client";

import { useSession } from "@/src/lib/auth-client";
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Video } from "../../../types/types";
import { AnimatedGridItem } from "../../motion/animated-grid-item";
import { AppSidebar } from "../../navigation/app-sidebar";
import VideoComponent from "../video/video";

const VIDEOS_PER_PAGE = 20;

export default function VideoList({ initialVideos, categories }: { initialVideos: Video[], categories: { id: string; name: string }[] }) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
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

  const fetchVideos = useCallback(async (currentPage: number, currentFilters: FilterState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(VIDEOS_PER_PAGE),
        ...filtersToParams(currentFilters),
      });
      const response = await fetch(`/api/videos?${params.toString()}`);
      const newVideos = await response.json();
      return newVideos;
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filtersToParams]);

  useEffect(() => {
    const loadFilteredVideos = async () => {
      const newVideos = await fetchVideos(1, filters);
      setVideos(newVideos);
      setPage(1);
      setHasMore(newVideos.length === VIDEOS_PER_PAGE);
    };
    loadFilteredVideos();
  }, [filters, fetchVideos]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    const newVideos = await fetchVideos(page + 1, filters);
    if (newVideos.length < VIDEOS_PER_PAGE) {
      setHasMore(false);
    }
    setVideos(prev => [...prev, ...newVideos]);
    setPage(prev => prev + 1);
  };

  const { data: session } = useSession();
  const canUploadContent = session?.user && !session.user.isAnonymous;

  return (
    <div className="flex gap-8 w-full">
      <AppSidebar
        contentType="video"
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-8 pl-1">
          <h1 className="text-3xl font-bold text-white">Trending Videos</h1>
          {canUploadContent && (
            <Button
              as={Link}
              href="/videos/upload"
              color="primary"
              variant="flat"
            >
              Upload Video
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video, idx) => (
            <AnimatedGridItem key={video.id} delay={idx * 0.05}>
              <VideoComponent video={video} />
            </AnimatedGridItem>
          ))}
        </div>
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
  );
}
