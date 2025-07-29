import { getVideoById } from "@/src/app/current-storage/storage";
import VideoView from "@/src/lib/components/videos/video-view/video-view";
import React from "react";

export default async function Page({ params }: { params: { id: number } }) {

  // parse the received date string back to type Date
  const selectedVideo = await getVideoById(params.id);
  selectedVideo.uploadedAt = new Date(selectedVideo.uploadedAt);
  selectedVideo.createdAt = new Date(selectedVideo.createdAt);

  return (
    <div>
      <VideoView video={selectedVideo}></VideoView>
    </div>
  )
}
