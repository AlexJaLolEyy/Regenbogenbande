"use client";

import { BreadcrumbItem, Breadcrumbs } from "@nextui-org/react";
import Link from "next/link";
import type { Video } from "../../../types/types";
import VideoComponent from "../video/video";
import "./video-list.css";

export default function VideoList({ videos }: { videos: Video[] }) {

  return (
    <div>
      
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/videos">Videos</BreadcrumbItem>
      </Breadcrumbs>

      <h1>Select a Video!</h1>
      <h2><Link href="/videos/upload">Go to Upload</Link></h2>

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
