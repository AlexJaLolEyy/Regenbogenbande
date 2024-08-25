
import { getVideoById } from "@/app/current-storage/storage";
import Navigation from "@/lib/components/Navigation/navigation";
import VideoView from "@/lib/components/videos/video-view/video-view";
import React from "react";


// TODO: add the view component here with the right data

export default async function Page({ params }: { params: { id: number } }) {

  var selectedVideo = await getVideoById(params.id);

  return (
    <div>
      <Navigation></Navigation>
      <VideoView video={selectedVideo}></VideoView>
    </div>
  )
}
