"use client"

import type { PagedList } from "@/src/lib/queries/use-paged-list";
import { PICTURES_PER_PAGE, usePictures } from "@/src/lib/queries/use-pictures";
import { staggerDelay } from "@/src/lib/motion";
import { FilterState } from '@/src/lib/types/filters';
import { useUrlFilters } from '@/src/lib/hooks/use-url-filters';
import { useState } from "react";
import { PictureListItem } from "../../../types/types";
import { AnimatedMasonryItem } from "../../motion/animated-grid-item";
import { FilterBar } from "../../navigation/filter-bar";
import { ListPagination } from '../../ui/list-pagination';
import { CardSkeleton, EmptyState, LIST_MASONRY, ListPanel } from '../../ui/media-card';
import { PageShell } from '../../ui/page-shell';
import PictureComponent from "../picture/picture";

const MASONRY_SKELETON_RATIOS = ['aspect-3/4', 'aspect-square', 'aspect-video'];

export default function PictureList({ initial, categories, people }: { people: { id: string; name: string }[], initial: PagedList<PictureListItem>, categories: { id: string; name: string, iconUrl?: string | null }[] }) {
  const [filters, setFilters] = useUrlFilters();
  const [page, setPage] = useState(1);

  const { data, isFetching, isLoading: isInitialLoading } = usePictures(filters, page, initial);

  const pictures = data?.items ?? [];
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
          contentType="picture"
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
          people={people}
        />
        <ListPanel
          scrollResetKey={page}
          title="Pictures"
          subtitle={data ? `${total} ${total === 1 ? "picture" : "pictures"}` : undefined}
          footer={total > PICTURES_PER_PAGE && <ListPagination page={page} total={total} pageSize={PICTURES_PER_PAGE} onChange={setPage} />}
        >
          {loading && pictures.length === 0 ? (
            <div className={LIST_MASONRY}>
              {Array.from({ length: 15 }).map((_, i) => (
                <CardSkeleton
                  key={i}
                  className="mb-6 break-inside-avoid"
                  media={MASONRY_SKELETON_RATIOS[i % 3]}
                />
              ))}
            </div>
          ) : (
            <div className={LIST_MASONRY}>
              {pictures.map((picture, idx) => (
                <AnimatedMasonryItem key={picture.id} delay={staggerDelay(idx)} className="break-inside-avoid">
                  <PictureComponent picture={picture} mode="masonry" />
                </AnimatedMasonryItem>
              ))}
            </div>
          )}

          {!loading && pictures.length === 0 && (
            <EmptyState title="No pictures found" hint="Try adjusting your filters" />
          )}
        </ListPanel>
      </div>
    </PageShell>
  );
}
