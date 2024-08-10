"use client"

import { useEffect, useState } from "react"
import type { Picture, Video } from "../../../types/types"
import { getAllFiles, getBufferFromPictures, getExamplePictures } from "@/app/current-storage/storage";
import PictureComponent from "../../pictures/picture/picture";
import { log } from "console";
import pictureBlue from "@/app/current-storage/examplePictures/pictureColorBlue.png";
import pictureGreenBlue from "@/app/current-storage/examplePictures/pictureColorGreenBlue.png";
import pictureLightGreen from "@/app/current-storage/examplePictures/pictureColorLightGreen.png";
import picturePurple from "@/app/current-storage/examplePictures/pictureColorPurple.png";
import { StaticImageData } from "next/image";

export default function VideoUpload({ video }: { video?: Video }
) {
  
    const [preview, setPreview] = useState<File | null>(null);

    const [pictures, setPictures] = useState<Picture[]| null>(null);
    //var pictures: Picture[] = []
    //var test = getExamplePictures().then((data) => pictures.push(...data));

    const [files, setFiles] = useState<File[] | null>(null);

    const [buffers, setBuffers] = useState<Buffer[] | null>(null);

    const [isReady, setReady] = useState<boolean>(false);

    const [count, setCount] = useState<number>(0);

    var counter: number = 0;
    var idk: number= 0;

    console.log("hello", pictures)
    if(pictures != null) {
    console.log("123: ", pictures[0].img)

    console.log("pics: ", files)

    const reader = new FileReader()
    var test = pictureBlue.src;
    console.log("pictureBlue: ", test);

    }

     function bufferToFile(buffer: Buffer, filename: string, mimeType: string): File {
        const blob = new Blob([buffer], { type: mimeType });
        return new File([blob], filename, { type: mimeType });
    }

    function getAllFiles(buffers: Buffer[]): File[] {
    const file1 = bufferToFile(buffers[0], "pictureColorBlue.png", 'image/png'); 
    const file2 = bufferToFile(buffers[1], "pictureColorGreenBlue.png", 'image/png'); 
    const file3 = bufferToFile(buffers[2], "pictureColorLightGreen.png", 'image/png'); 
    const file4 = bufferToFile(buffers[3], "pictureColorPurple.png", 'image/png'); 

    return [file1, file2, file3, file4];
  }

   /* function staticImageDataToFile(image: StaticImageData): Promise<File> {
    const response =  fetch(image.src);
    const blob =  await response.blob();
  
    // Create a new file with the Blob
    const file = new File([blob], 'image.jpg', { type: blob.type });
  
    return file;
  }*/

  const [newFile, setNewFile] = useState<File[] | null>(null);

  useEffect(() => {
    getExamplePictures().then((data) => setPictures(data))  
    // Convert StaticImageData to a File
    console.log("starting");
    var array: File[] = []
    
    const convertToFile = async (image: StaticImageData) => {
      const response = await fetch(image.src); // Use imageSrc.src to fetch the image
      const blob = await response.blob();
      const file = new File([blob], "dont care", { type: blob.type });
      console.log("this right?: ", file);
      console.log("current State: ", array);
      array.push(file)
      
    };
    convertToFile(pictureBlue);
    convertToFile(pictureGreenBlue);
    convertToFile(pictureLightGreen);
    convertToFile(picturePurple);
    setNewFile(array);
    console.log("file--: ", newFile)

  }, []);



    // TODO search for way of getting creating-date (if not -> Desktop App)
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;
        setPreview(event.target.files[0]);
        console.log("file: ", event.target.files[0])
    }

    

    function logger() {
        setCount(count+1);
        getBufferFromPictures().then((data) => setBuffers(data));
        console.log("12345: ", pictures)
        if(buffers != null) {
        setFiles(getAllFiles(buffers));
            console.log("files: ", files) 
            console.log("pictures atm: ", pictures);


            if(pictures != null) {
                if(files != null) {
                    pictures[0].img = files[0]
                    pictures[1].img = files[1]
                    pictures[2].img = files[2]
                    pictures[3].img = files[3]
                }
            } 
        }
        console.log("pictures after: ", pictures);
        console.log("counter: ", counter);
        
        if(count == 2) {
            console.log("true - - - - - - ");
            setReady(true)
        }
        console.log("www- 1: ", pictures)
        if(pictures != null) {
            if(newFile != null) {
                pictures[0].img = newFile[0]
                pictures[1].img = newFile[1]
                pictures[2].img = newFile[2]
                pictures[3].img = newFile[3]
            }
        } 
        console.log("www-: 2", pictures)
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
                
                
            <button onClick={() => {logger()}}>Click me</button>

            {pictures != null ? (
                (pictures).map((pic) => 
                    <div>
                        <p>Type:</p>
                        <p>{(typeof pic.img)}</p> 
                    </div>
                    
                )
            ): ""}

{ isReady && pictures != null ? (
                    (pictures).map((pic) => 
                       <div>
                        <p>Test</p>
                        <p>pic: {JSON.stringify(pic)}</p>
                        <PictureComponent picture={pic}></PictureComponent>
                       </div> 
                    )
                )
                 : "nö"}
               
                {files != null ? (
                    (files).map((file) =>
                    <div>
                        <p>.....</p>
                        <p>{file.name}</p>
                        <p>{file.size}</p>
                    </div>)
                ) : ""}


                <p>src?</p>
                <img src={pictureBlue.src}></img>

                
            </div>
            <p>Counter: {count}</p>
            <button onClick={() => {setCount(count+1)}}>+1</button>

            
      {newFile != null ? (newFile).map((file) => (
        <div>
      <p>File created: {file.name}</p>
      <img src={URL.createObjectURL(file)} alt="shit" />
    </div>
      ))
      : ""}


        </div>
    )
}