"use client";

import { BreadcrumbItem, Breadcrumbs, Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Video } from "../../../types/types";
import VideoComponent from "../video/video";

const VIDEOS_PER_PAGE = 20;

export default function VideoList({ initialVideos }: { initialVideos: Video[] }) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/videos?page=${page + 1}&limit=${VIDEOS_PER_PAGE}`);
      const newVideos = await response.json();

      if (newVideos.length < VIDEOS_PER_PAGE) {
        setHasMore(false);
      }

      setVideos(prev => [...prev, ...newVideos]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check for session to determine role
  const { data: session } = useSession();
  // @ts-expect-error Role is added by adapter
  const canUpload = session?.user?.role === "admin" || session?.user?.role === "member";

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/videos">Videos</BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex justify-between items-center my-6">
        <h1 className="text-3xl font-semibold">Videos</h1>
        {canUpload && (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
        {videos.map((video) => (
          <div key={video.id}>
            <VideoComponent video={video} />
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
