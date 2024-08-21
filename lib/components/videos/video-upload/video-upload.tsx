"use client";

import { useState } from "react";
import type { Video } from "../../../types/types";
import MP4Box from 'mp4box';


/* FIXME: bug: if video selected via upload, then the upload is pressed again to select a new picture, 
 and you tab out of the select = boom */


 // TODO: try to adjust the setPreview so that the old preview stays consistent when input triggered again, but closed
export default function VideoUpload({ video }: { video?: Video }) {

  const [preview, setPreview] = useState<File | null>(null);
  const [creationDate, setCreationDate] = useState<Date | null>(null);

  const getCreationDate = (file: File) => {
    if (file) {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);

      fileReader.addEventListener("load", (e) => {
        const buffer = fileReader.result as ArrayBuffer;

        (buffer as any).fileStart = 0;

        const mp4boxFile = MP4Box.createFile();
        mp4boxFile.onError = console.error;
        mp4boxFile.onReady = function (info) {
          console.log(info);
          setCreationDate(info.created);
        };
        mp4boxFile.appendBuffer(buffer);
        mp4boxFile.flush();
      })
    }
  }

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    setPreview(event.target.files[0]);
    getCreationDate(event.target.files[0]);

    console.log("file: ", event.target.files[0]);
    console.log("created: ", creationDate);
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

        {creationDate != null ? (
          <div>
            <p>creationDate: {creationDate.toLocaleDateString()}</p>
          </div>
        ) : "No creation Date found!"}

        
      </form>

    </div>
  );
}
