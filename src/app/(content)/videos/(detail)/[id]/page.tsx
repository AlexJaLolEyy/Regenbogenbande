import { getVideoById } from "@/src/app/current-storage/storage";
import VideoView from "@/src/lib/components/videos/video-view/video-view";
import React from "react";

export default async function Page({ params }: { params: Promise<{ id: number }> }) {
  // In Next.js 15, params must be awaited
  const { id } = await params;

  // parse the received date string back to type Date
  const selectedVideo = await getVideoById(id);
  selectedVideo.uploadedAt = new Date(selectedVideo.uploadedAt);
  selectedVideo.createdAt = new Date(selectedVideo.createdAt);

  return (
    <div>
      <VideoView video={selectedVideo}></VideoView>
    </div>
  )
}
