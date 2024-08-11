"use client";

import { useEffect, useState } from "react";
import type { Video } from "../../../types/types";
import { getExampleVideos } from "@/app/current-storage/storage";
import Link from "next/link";

import beispielVideo1 from "@/app/current-storage/exampleVideos/beispiel_v1.mp4";
import beispielVideo2 from "@/app/current-storage/exampleVideos/beispiel_v2.mp4";

import VideoComponent from "../video/video";

// TODO: adjust whole component -> change pics to vids
// TODO: remove the "?" from videos and supply data from page
export default function VideoList({ videos }: { videos?: Video }) {

  const [fakeVideos, setFakeVideos] = useState<Video[] | null>(null); // to replace pictures with videos

  const logger = () => {
    console.log("array: ", fakeVideos);
  }

  useEffect(() => {
    var array: File[] = [];

    const convertToFile = async (video: string) => {
      const response = await fetch(video);
      const blob = await response.blob();
      const file = new File([blob], "videoFile.mp4", { type: blob.type }); // name changable?
      array.push(file);
      console.log("kek: ", file)
    };
    
    convertToFile(beispielVideo1);
    convertToFile(beispielVideo2);

    // gets pictures and fills the empty img with the actual one (harcoded af)
    getExampleVideos().then((data) => {
      data[0].video = array[0];
      data[0].thumbnail = array[0];
      data[1].video = array[1];
      data[1].thumbnail = array[1];
      setFakeVideos(data);
    });
  }, []);

  return (
    <div>
      <p>You are currently at Video-List!</p>

      <Link href="/videos/upload">Go to Upload</Link>

      <button onClick={() => logger()}>Log my stuff</button>

      <div className="videoView">
        {fakeVideos != null && (fakeVideos[0].video != null && fakeVideos[0].video != undefined)
          ? fakeVideos.map((video) => (
            <div>
              <hr></hr>
              <h4>Video pre component load</h4>
              <p>Title: {video.title}</p>
              <p>Description: {video.description}</p>
              <p>ID: {video.id}</p>
              <p>UploadedBy: {JSON.stringify(video.uploadedBy)}</p>
              <p>Image-Name: {video.video?.name}</p>
              <p>Image-Size: {video.video?.size}</p>
              <VideoComponent video={video}></VideoComponent>
              <hr></hr>
            </div>
          ))
          : "error while loading videos"}
      </div>
    </div>
  );
}
