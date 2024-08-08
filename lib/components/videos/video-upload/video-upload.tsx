"use client"

import { useState } from "react"
import type { Picture, Video } from "../../../types/types"
import { getExamplePictures } from "@/app/current-storage/storage";
import PictureComponent from "../../pictures/picture/picture";
import { log } from "console";

export default function VideoUpload({ video }: { video?: Video }
) {
  
    const [preview, setPreview] = useState<File | null>(null);

    const [pictures, setPictures] = useState<Picture[]| null>(null);
    //var pictures: Picture[] = []
    //var test = getExamplePictures().then((data) => pictures.push(...data));

    console.log("hello", pictures)
    if(pictures != null) {
    console.log("123: ", pictures[0].img)
}
    


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

            <div className="test">
                <p>test</p>
                <button onClick={() => {getExamplePictures().then((data) => setPictures(data))}}>Click me</button>
               
                { pictures != null ? (
                    (pictures).map((pic) => 
                       <div>
                        <p>Test</p>
                        <p>pic: {JSON.stringify(pic)}</p>
                        <PictureComponent picture={pic}></PictureComponent>
                     
                       </div>
                          
                    )
                    

                )
                
                 : "empty"}
            </div>

        </div>
    )
}