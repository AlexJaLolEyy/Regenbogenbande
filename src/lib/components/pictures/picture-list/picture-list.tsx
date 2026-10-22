"use client"

import { usePictures } from "@/src/lib/queries/use-pictures";
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { cn } from "@/src/lib/utils";
import { Button } from "@heroui/react";
import { LayoutGrid, Rows3 } from "lucide-react";
import { useState } from "react";
import { PictureListItem } from "../../../types/types";
import { AnimatedGridItem, AnimatedMasonryItem } from "../../motion/animated-grid-item";
import { FilterBar } from "../../navigation/filter-bar";
import { CardSkeleton, EmptyState, LIST_GRID, LIST_MASONRY, ListPanel } from '../../ui/media-card';
import { PageShell } from '../../ui/page-shell';
import PictureComponent from "../picture/picture";

const MASONRY_SKELETON_RATIOS = ['aspect-3/4', 'aspect-square', 'aspect-video'];

export default function PictureList({ initialPictures, categories }: { initialPictures: PictureListItem[], categories: { id: string; name: string, iconUrl?: string | null }[] }) {
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('masonry');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: isInitialLoading,
  } = usePictures(filters, initialPictures);

  const pictures = data?.pages.flat() ?? [];
  const loading = isInitialLoading || (isFetching && !isFetchingNextPage);

  const modes = [
    { id: 'masonry', label: 'Masonry', icon: Rows3 },
    { id: 'grid', label: 'Grid', icon: LayoutGrid },
  ] as const;

  const toggle = (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card/70 p-1">
      {modes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setViewMode(id)}
          aria-pressed={viewMode === id}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );

  return (
    <PageShell>
      <div className="flex flex-col gap-4 h-[calc(100vh-3rem)] w-full px-4 lg:px-6 pt-4 pb-4 lg:pb-6">
        <FilterBar
          contentType="picture"
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
        />
        <ListPanel
          title="Pictures"
          headerRight={toggle}
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
          {loading && pictures.length === 0 ? (
            <div className={viewMode === 'masonry' ? LIST_MASONRY : LIST_GRID}>
              {Array.from({ length: 15 }).map((_, i) => (
                <CardSkeleton
                  key={i}
                  className={viewMode === 'masonry' ? 'mb-6 break-inside-avoid' : 'h-full'}
                  media={viewMode === 'masonry' ? MASONRY_SKELETON_RATIOS[i % 3] : 'aspect-video'}
                />
              ))}
            </div>
          ) : viewMode === 'masonry' ? (
            <div key="masonry" className={LIST_MASONRY}>
              {pictures.map((picture, idx) => (
                <AnimatedMasonryItem key={picture.id} delay={idx * 0.05} className="break-inside-avoid">
                  <PictureComponent picture={picture} mode="masonry" />
                </AnimatedMasonryItem>
              ))}
            </div>
          ) : (
            <div key="grid" className={LIST_GRID}>
              {pictures.map((picture, idx) => (
                <AnimatedGridItem key={picture.id} delay={idx * 0.05}>
                  <PictureComponent picture={picture} mode="grid" />
                </AnimatedGridItem>
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
