"use client";

import { useState } from "react";
import type { Video } from "../../../types/types";

/* FIXME: bug: if picture selected via upload, then the upload is pressed again to select a new picture, 
 and you tab out of the select = boom */

export default function VideoUpload({ video }: { video?: Video }) {

  const [preview, setPreview] = useState<File | null>(null);

  
  // TODO: search for way of getting creating-date (if not -> Desktop App)
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    setPreview(event.target.files[0]);
    console.log("file: ", event.target.files[0]);
  };

// TODO: add that you can only upload mp4 files (or any video formats) -> dont accept others
  return (
    <div>
      <p>You are currently at Video-Upload!</p>

      <form>
        <h3>Video-Upload:</h3>
        <div>
          <label htmlFor="file">Upload Video here:</label>
          <input type="file" id="file" onChange={handleChange}></input>
        </div>

        {preview?.type === "video/mp4" ? (
          <div>
            <label htmlFor="preview"></label>
            <video width={"500"} height={"400"} controls>
              <source
                id="preview"
                src={preview === null ? "" : URL.createObjectURL(preview)}
                type="video/mp4"
              />
              <p>Error while loading Video</p>
            </video>
          </div>
        ) : "preview 'video' could not be loaded"}
      </form>

    </div>
  );
}
