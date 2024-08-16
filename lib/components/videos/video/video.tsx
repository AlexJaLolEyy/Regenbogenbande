'use client'

import { useEffect, useState } from "react";
import type { Video } from "../../../types/types";

export default function VideoComponent({ video }: { video: Video }) {

  // TODO: replace html with card component + styling

  // TODO: NEW IDEA! -> Switch type from File to File | string and then just import all videos somewhere and save the link

  const [videoURL, setVideoURL] = useState<string | null>(null);

  useEffect(() => {

    console.log("test: ", video)
    if (video.video) {
      console.log("valid file")
      const url = URL.createObjectURL(video.video);
      setVideoURL(url);

      // Clean up the object URL when component unmounts or file changes
      return () => URL.revokeObjectURL(url);
    }
  }, [video.video]);

  return (

    <div>
      {video.video !== undefined ?
        <div>
          <div className="video">
            <p>FILE TYPE: {video.video.type}</p>
            <p>Video Thumbnail: </p>
            <img
              src={""}
              alt="error while loading thumbnail"
              width={"150"}
              height={"150"}
            ></img>
            <p>Video: </p>
            <video width="320" height="240" controls>
              <source src={URL.createObjectURL(video.video)} type="video/mp4"></source>
              Video cant be displayed due to error...
            </video>
          </div>
          <div className="videoTitle">
            <p>Video Title: {video.title}</p>
          </div>
          <div className="videoMetaData">
            <p>Video CreatedAt: {video.createdAt.toString()}</p>
            <p>Video UploadedBy: {video.uploadedBy.username}</p>
          </div>
          <hr></hr>

          <button onClick={() => console.log("rendered vid: ", video)}>GET DATA</button>
        </div>

        : ""}
    </div>

  );
}
