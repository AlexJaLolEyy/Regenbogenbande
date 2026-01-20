"use client";

import { useSession } from '@/src/lib/auth-client';
import { useVideos } from '@/src/lib/queries/use-videos';
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { Button, Skeleton, Spinner } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import type { VideoListItem } from "../../../types/types";
import { AnimatedGridItem } from "../../motion/animated-grid-item";
import { AppSidebar } from "../../navigation/app-sidebar";
import VideoComponent from "../video/video";

export default function VideoList({ initialVideos, categories }: { initialVideos: VideoListItem[], categories: { id: string; name: string }[] }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: isInitialLoading,
  } = useVideos(filters, initialVideos);

  const videos = data?.pages.flat() ?? [];
  const loading = isInitialLoading || (isFetching && !isFetchingNextPage);

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
          {loading && videos.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#0a0a0a]/40 border border-white/5 rounded-2xl overflow-hidden shadow-lg animate-pulse">
                <Skeleton className="aspect-video w-full rounded-none" disableAnimation={false} />
                <div className="p-4 space-y-3 bg-black/40">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-3 w-1/4 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            videos.map((video, idx) => (
              <AnimatedGridItem key={video.id} delay={idx * 0.05}>
                <VideoComponent video={video} />
              </AnimatedGridItem>
            ))
          )}
        </div>
        {hasNextPage && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              variant="flat"
              className="min-w-30 flex items-center gap-2"
            >
              {isFetchingNextPage ? (
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
