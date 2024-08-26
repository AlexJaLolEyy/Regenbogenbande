"use client";

import type { Video } from "../../../types/types";
import VideoComponent from "../video/video";
import Link from "next/link";

import "./video-list.css";


// TODO: adjust whole component -> change pics to vids
// TODO: remove the "?" from videos and supply data from page
export default function VideoList({ videos }: { videos: Video[] }) {

  return (
    <div>
      <p>You are currently at Video-List!</p>
      <Link href="/videos/upload">Go to Upload</Link>

      <div className="videoList">
        {videos != null || videos != undefined ?
          videos.map((video) => (
            <div key={video.id}>
              <VideoComponent video={video}></VideoComponent>
            </div>
          ))
          : "Videos null or undefined"}
      </div>

    </div>
  );
}
