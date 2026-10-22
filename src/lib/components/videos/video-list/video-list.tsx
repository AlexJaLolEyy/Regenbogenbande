"use client";

import { useVideos } from '@/src/lib/queries/use-videos';
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { Pagination } from "@heroui/react";
import { useState } from "react";
import type { VideoListItem } from "../../../types/types";
import { AnimatedGridItem } from "../../motion/animated-grid-item";
import { FilterBar } from "../../navigation/filter-bar";
import { CardSkeleton, EmptyState, LIST_GRID, ListPanel } from '../../ui/media-card';
import { PageShell } from '../../ui/page-shell';
import VideoComponent from "../video/video";

const PAGE_SIZE = 15;

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
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const loading = isInitialLoading || isFetching;

  // Reset page when filters change
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-4 h-[calc(100vh-3rem)] w-full px-4 lg:px-6 pt-4 pb-4 lg:pb-6">
        <FilterBar
          contentType="video"
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
        />
        <ListPanel
          title="Videos"
          footer={totalPages > 1 && (
            <Pagination
              total={totalPages}
              page={page}
              onChange={setPage}
              showControls
              loop
              variant="flat"
              classNames={{ cursor: "bg-primary text-primary-foreground font-semibold" }}
            />
          )}
        >
          <div className={LIST_GRID}>
            {loading && videos.length === 0 ? (
              Array.from({ length: PAGE_SIZE }).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              videos.map((video: VideoListItem, idx: number) => (
                <AnimatedGridItem key={video.id} delay={idx * 0.05}>
                  <VideoComponent video={video} />
                </AnimatedGridItem>
              ))
            )}
          </div>

          {!loading && videos.length === 0 && (
            <EmptyState title="No videos found" hint="Try adjusting your filters" />
          )}
        </ListPanel>
      </div>
    </PageShell>
  );
}
