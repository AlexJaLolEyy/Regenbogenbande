"use client"

import { useState } from "react"
import { Video } from "../../../types/types"
import { getDate } from "../video-upload/_actions"

export default function VideoUpload({ video }: { video?: Video }
) {

    const [preview, setPreview] = useState<File | null>(null);


    // TODO search for way of getting creating-date (if not -> Desktop App)
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        setPreview(event.target.files[0]);
        console.log("file: ", event.target.files[0])
    }

    return (
        <div>
            <p>You are currently at Video-Upload!</p>

            <form>
                <h3>Video-Upload:</h3>

                <div>
                    <label htmlFor="file">Upload Video here:</label>
                    <input type="file" id="file" onChange={handleChange}></input>
                </div>

                {preview?.type === "image/jpeg" || "image/png" ?
                    <div>
                        <label htmlFor="preview"></label>
                        <img id="preview"
                            src={preview === null ? "" : URL.createObjectURL(preview)}
                            alt="preview could not be loaded"
                            width={"500"} height={"400"} />
                    </div>
                    : ""}
                {preview?.type === "video/mp4" ?
                    <div>
                        <label htmlFor="preview"></label>
                        <video width={"500"} height={"400"} controls>
                            <source id="preview"
                                src={preview === null ? "" : URL.createObjectURL(preview)}
                                type="video/mp4" />
                            <p>Error while loading Video</p>
                        </video>
                    </div>
                    : ""}
            </form>

        </div>
    )
}