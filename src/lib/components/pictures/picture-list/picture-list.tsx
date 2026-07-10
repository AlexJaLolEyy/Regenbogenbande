"use client"

import { useSession } from "@/src/lib/auth-client";
import { usePictures } from "@/src/lib/queries/use-pictures";
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { faGrip, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Skeleton } from "@heroui/react";
import { useState } from "react";
import { PictureListItem } from "../../../types/types";
import { AnimatedGridItem, AnimatedMasonryItem } from "../../motion/animated-grid-item";
import { AppSidebar } from "../../navigation/app-sidebar";
import { MobileSidebar } from '../../navigation/mobile-sidebar';
import { PageShell } from '../../ui/page-shell';
import PictureComponent from "../picture/picture";

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

  const { data: session } = useSession();
  const canUploadContent = session?.user && !session.user.isAnonymous;

  return (
    <PageShell variant="aurora">
      <div className="flex gap-6 items-start h-screen w-full px-4 lg:px-6 pt-24 pb-4 lg:pb-6">
        <AppSidebar
          className="h-full! sticky-0!"
          contentType="picture"
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
        />
        <div className="flex-1 min-w-0 h-full flex flex-col border border-white/10 rounded-3xl bg-black/40 overflow-hidden shadow-2xl relative">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <MobileSidebar
              contentType="picture"
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
            />
            <div className="flex justify-between items-center mb-8 pl-1">
              <h1 className="text-3xl font-bold text-white tracking-tight text-glow">Gallery</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
                  <button
                    onClick={() => setViewMode('masonry')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'masonry'
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <FontAwesomeIcon icon={faLayerGroup} /> Masonry
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'grid'
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <FontAwesomeIcon icon={faGrip} /> Grid
                  </button>
                </div>
              </div>
            </div>

            {loading && pictures.length === 0 ? (
              <div className={viewMode === 'masonry'
                ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
              }>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className={`bg-[#0a0a0a]/40 border border-white/5 rounded-2xl overflow-hidden animate-pulse ${viewMode === 'masonry' ? 'break-inside-avoid' : 'h-full'}`}
                  >
                    <Skeleton
                      className={`w-full rounded-none ${viewMode === 'masonry' ? (i % 3 === 0 ? 'aspect-3/4' : i % 3 === 1 ? 'aspect-square' : 'aspect-video') : 'aspect-video'}`}
                    />
                    <div className="p-4 space-y-3 bg-black/40">
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-5 h-5 rounded-full" />
                        <Skeleton className="h-3 w-1/4 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {viewMode === 'masonry' ? (
                  <div key="masonry" className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6">
                    {pictures.map((picture, idx) => (
                      <AnimatedMasonryItem key={picture.id} delay={idx * 0.05} className="break-inside-avoid shadow-2xl">
                        <PictureComponent picture={picture} mode="masonry" />
                      </AnimatedMasonryItem>
                    ))}
                  </div>
                ) : (
                  <div key="grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {pictures.map((picture, idx) => (
                      <AnimatedGridItem key={picture.id} delay={idx * 0.05}>
                        <PictureComponent picture={picture} mode="grid" />
                      </AnimatedGridItem>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Empty state if no pictures */}
            {!loading && pictures.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-white/40">
                <p className="text-xl font-medium">No pictures found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {hasNextPage && (
            <div className="p-4 border-t border-white/5 bg-black/60 backdrop-blur-md flex justify-center z-10 shrink-0">
              <Button
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
                variant="flat"
                className="min-w-30 font-bold bg-white/5 hover:bg-white/10 text-white"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
