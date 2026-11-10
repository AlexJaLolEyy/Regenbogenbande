"use client";

import { useVideos, VIDEOS_PER_PAGE } from '@/src/lib/queries/use-videos';
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { useState } from "react";
import type { PagedList } from "@/src/lib/queries/use-paged-list";
import type { VideoListItem } from "../../../types/types";
import { AnimatedGridItem } from "../../motion/animated-grid-item";
import { FilterBar } from "../../navigation/filter-bar";
import { CardSkeleton, EmptyState, LIST_GRID, ListPanel } from '../../ui/media-card';
import { ListPagination } from '../../ui/list-pagination';
import { PageShell } from '../../ui/page-shell';
import VideoComponent from "../video/video";

export default function VideoList({
  initial,
  categories,
  people,
}: {
  initial: PagedList<VideoListItem>,
  people: { id: string; name: string }[],
  categories: { id: string; name: string, iconUrl?: string | null }[]
}) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const {
    data,
    isFetching,
    isLoading: isInitialLoading,
  } = useVideos(filters, page, initial);

  const videos = data?.items ?? [];
  const total = data?.total ?? 0;
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
          people={people}
        />
        <ListPanel scrollResetKey={page}
          title="Videos"
          footer={total > VIDEOS_PER_PAGE && <ListPagination page={page} total={total} pageSize={VIDEOS_PER_PAGE} onChange={setPage} />}
        >
          <div className={LIST_GRID}>
            {loading && videos.length === 0 ? (
              Array.from({ length: VIDEOS_PER_PAGE }).map((_, i) => <CardSkeleton key={i} />)
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
