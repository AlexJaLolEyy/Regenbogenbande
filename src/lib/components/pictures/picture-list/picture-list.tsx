"use client"

import { useSession } from "@/src/lib/auth-client";
import { usePictures } from "@/src/lib/queries/use-pictures";
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { faGrip, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Link, Skeleton } from "@heroui/react";
import { useState } from "react";
import { PictureListItem } from "../../../types/types";
import { AppSidebar } from "../../navigation/app-sidebar";
import PictureComponent from "../picture/picture";

export default function PictureList({ initialPictures, categories }: { initialPictures: PictureListItem[], categories: { id: string; name: string }[] }) {
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
    <div className="flex gap-8 w-full">
      <AppSidebar
        contentType="picture"
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Gallery</h1>
          <div className="flex items-center gap-4">
            {canUploadContent && (
              <Button
                as={Link}
                href="/pictures/upload"
                color="primary"
                variant="flat"
              >
                Upload Picture
              </Button>
            )}
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
            ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          }>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`bg-[#0a0a0a]/40 border border-white/5 rounded-2xl overflow-hidden ${viewMode === 'masonry' ? 'break-inside-avoid' : 'h-full'}`}
              >
                <Skeleton
                  className={`w-full rounded-none ${viewMode === 'masonry' ? (i % 3 === 0 ? 'aspect-3/4' : i % 3 === 1 ? 'aspect-square' : 'aspect-video') : 'aspect-4/3'}`}
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
              <div key="masonry" className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 animate-in fade-in duration-500">
                {pictures.map((picture) => (
                  <div key={picture.id} className="break-inside-avoid">
                    <PictureComponent picture={picture} />
                  </div>
                ))}
              </div>
            ) : (
              <div key="grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {pictures.map((picture) => (
                  <div key={picture.id} className="aspect-4/3">
                    <PictureComponent picture={picture} />
                  </div>
                ))}
              </div>
            )}
          </>
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
  );
}
