"use client"

import { useState } from "react"
import { Picture } from "../../../types/types"

export default function PictureUpload({ picture }: { picture?: Picture }
) {

    const [preview, setPreview] = useState<File | null>(null);


    // TODO: search for way of getting creating-date (if not -> Desktop App)
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        setPreview(event.target.files[0]);
        console.log("file: ", event.target.files[0])
    }

    // TODO: add that you can only upload .png files (or any video formats) -> dont accept others
    return (
        <div>
            <p>You are currently at Picture-Upload!</p>

            <form>
                <h3>Picture-Upload:</h3>

                <div>
                    <label htmlFor="file">Upload Picture here:</label>
                    <input type="file" id="file" onChange={handleChange}></input>
                </div>

                {preview?.type === "image/jpeg" || "image/png" || "image/webp" ?
                    <div>
                        <label htmlFor="preview"></label>
                        <img id="preview"
                            src={preview === null ? "" : URL.createObjectURL(preview)}
                            alt="preview could not be loaded"
                            width={"500"} height={"400"} />
                    </div>
                    : ""}
            </form>

        </div>
    )
}