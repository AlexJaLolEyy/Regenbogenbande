"use client"

import { useSession } from "@/src/lib/auth-client";
import { DEFAULT_FILTERS, FilterState } from '@/src/lib/types/filters';
import { faGrip, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Link, Spinner } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { Picture } from "../../../types/types";
import { AppSidebar } from "../../navigation/app-sidebar";
import PictureComponent from "../picture/picture";

const PICTURES_PER_PAGE = 20;

export default function PictureList({ initialPictures, categories }: { initialPictures: Picture[], categories: { id: string; name: string }[] }) {
  const [pictures, setPictures] = useState<Picture[]>(initialPictures);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('masonry');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filtersToParams = useCallback((currentFilters: FilterState) => {
    const params: Record<string, string> = {};
    if (currentFilters.search) params.search = currentFilters.search;
    if (currentFilters.sort) params.sort = currentFilters.sort;
    if (currentFilters.categoryId) params.categoryId = currentFilters.categoryId;
    if (currentFilters.dateRange) params.dateRange = currentFilters.dateRange;
    return params;
  }, []);

  const fetchPictures = useCallback(async (currentPage: number, currentFilters: FilterState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PICTURES_PER_PAGE),
        ...filtersToParams(currentFilters),
      });
      const response = await fetch(`/api/pictures?${params.toString()}`);
      const newPictures = await response.json();
      return newPictures;
    } catch (error) {
      console.error('Failed to fetch pictures:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filtersToParams]);

  useEffect(() => {
    const loadFilteredPictures = async () => {
      const newPictures = await fetchPictures(1, filters);
      setPictures(newPictures);
      setPage(1);
      setHasMore(newPictures.length === PICTURES_PER_PAGE);
    };
    loadFilteredPictures();
  }, [filters, fetchPictures]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    const newPictures = await fetchPictures(page + 1, filters);
    if (newPictures.length < PICTURES_PER_PAGE) {
      setHasMore(false);
    }
    setPictures(prev => [...prev, ...newPictures]);
    setPage(prev => prev + 1);
  };

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
              <div key={picture.id} className="aspect-[4/3]">
                <PictureComponent picture={picture} />
              </div>
            ))}
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
  );
}
