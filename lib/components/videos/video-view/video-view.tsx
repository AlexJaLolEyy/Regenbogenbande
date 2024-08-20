"use client"

import { Video } from "../../../types/types"
import Link from "next/link";

import { useEffect } from "react";

export default function VideoView({ video }: { video: Video }
) {

  useEffect(() => {
    console.log("VideoView: ", video);
  }, []);

  return (
    <div>
      <p>You are currently at Video-View!</p>

      <Link href="/pictures/upload">Go to Upload</Link>

      <video width="1280" height="720" controls>
        <source src={video.video} type="video/mp4"></source>
        Video cant be displayed due to error...
      </video>

      <p>Title: {video.title}</p>
      <p>Description: {video.description}</p>
      <p>ID: {video.id}</p>
      <p>UploadedBy: {JSON.stringify(video.uploadedBy)}</p>

    </div>
  );
}