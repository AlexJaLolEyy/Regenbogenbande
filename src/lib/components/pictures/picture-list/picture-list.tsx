"use client"

import { BreadcrumbItem, Breadcrumbs, Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { Picture } from "../../../types/types";
import PictureComponent from "../picture/picture";

const PICTURES_PER_PAGE = 20;

export default function PictureList({ initialPictures }: { initialPictures: Picture[] }) {
  const [pictures, setPictures] = useState<Picture[]>(initialPictures);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/pictures?page=${page + 1}&limit=${PICTURES_PER_PAGE}`);
      const newPictures = await response.json();
      
      if (newPictures.length < PICTURES_PER_PAGE) {
        setHasMore(false);
      }
      
      setPictures(prev => [...prev, ...newPictures]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more pictures:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/pictures">Pictures</BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex justify-between items-center my-6">
        <h1 className="text-3xl font-semibold">Pictures</h1>
        <Button
          as={Link}
          href="/pictures/upload"
          color="primary"
          variant="flat"
        >
          Upload Picture
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
        {pictures.map((picture) => (
          <div key={picture.id}>
            <PictureComponent picture={picture} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
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
  );
}