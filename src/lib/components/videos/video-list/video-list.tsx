"use client";

import { useSession } from '@/src/lib/auth-client';
import { useVideos } from '@/src/lib/queries/use-videos';
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { Pagination, Skeleton } from "@heroui/react";
import { useState } from "react";
import type { VideoListItem } from "../../../types/types";
import { AnimatedGridItem } from "../../motion/animated-grid-item";
import { AppSidebar } from "../../navigation/app-sidebar";
import { MobileSidebar } from '../../navigation/mobile-sidebar';
import { PageShell } from '../../ui/page-shell';
import VideoComponent from "../video/video";

export default function VideoList({
  initialVideos,
  initialTotal,
  categories
}: {
  initialVideos: VideoListItem[],
  initialTotal: number,
  categories: { id: string; name: string, iconUrl?: string | null }[]
}) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const {
    data,
    isFetching,
    isLoading: isInitialLoading,
  } = useVideos(filters, page, { items: initialVideos, total: initialTotal });

  const videos = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 15);
  const loading = isInitialLoading || isFetching;

  const { data: session } = useSession();
  const canUploadContent = session?.user && !session.user.isAnonymous;

  // Reset page when filters change
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <PageShell variant="aurora">
      <div className="flex gap-6 items-start h-screen w-full px-4 lg:px-6 pt-24 pb-4 lg:pb-6">
        <AppSidebar
          className="!h-full !sticky-0"
          contentType="video"
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
        />
        <div className="flex-1 min-w-0 h-full flex flex-col border border-white/10 rounded-3xl bg-black/40 overflow-hidden shadow-2xl relative">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <MobileSidebar
              contentType="video"
              filters={filters}
              onFiltersChange={handleFiltersChange}
              categories={categories}
            />
            <div className="flex justify-between items-center mb-8 pl-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">Trending Videos</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {loading && videos.length === 0 ? (
                Array.from({ length: 15 }).map((_, i) => (
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
                videos.map((video: VideoListItem, idx: number) => (
                  <AnimatedGridItem key={video.id} delay={idx * 0.05}>
                    <VideoComponent video={video} />
                  </AnimatedGridItem>
                ))
              )}
            </div>

            {/* Empty state if no videos */}
            {!loading && videos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-white/40">
                <p className="text-xl font-medium">No videos found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-white/5 bg-black/60 backdrop-blur-md flex justify-center z-10 shrink-0">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                showControls
                loop
                variant="flat"
                classNames={{
                  cursor: "bg-white text-black font-bold",
                  item: "text-white/70 hover:text-white",
                  next: "text-white/70 hover:text-white",
                  prev: "text-white/70 hover:text-white"
                }}
              />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
