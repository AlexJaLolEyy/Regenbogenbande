"use client"

import { useEffect, useState } from "react"
import { Picture } from "../../../types/types"
import { getExamplePictures } from "@/app/current-storage/storage";
import { StaticImageData } from "next/image";
import Link from "next/link";
import PictureComponent from "../picture/picture";
import pictureBlue from "@/app/current-storage/examplePictures/pictureColorBlue.png";
import pictureGreenBlue from "@/app/current-storage/examplePictures/pictureColorGreenBlue.png";
import pictureLightGreen from "@/app/current-storage/examplePictures/pictureColorLightGreen.png";
import picturePurple from "@/app/current-storage/examplePictures/pictureColorPurple.png";

// TODO: remove the "?" from pictures and supply data from page"
export default function PictureList({ pictures }: { pictures?: Picture[] }
) {
    const [fakePictures, setFakePictures] = useState<Picture[] | null>(null);
  
    useEffect(() => {
      var array: File[] = [];
  
      const convertToFile = async (image: StaticImageData) => {
        const response = await fetch(image.src);
        const blob = await response.blob();
        const file = new File([blob], "fakeImg", { type: blob.type }); // name changable?
        array.push(file);
      };
  
      convertToFile(pictureBlue);
      convertToFile(pictureGreenBlue);
      convertToFile(pictureLightGreen);
      convertToFile(picturePurple);
  
      // gets pictures and fills the empty img with the actual one (harcoded af)
      getExamplePictures().then((data) => {
        data[0].img = array[0];
        data[1].img = array[1];
        data[2].img = array[2];
        data[3].img = array[3];
        setFakePictures(data);
      });
    }, []);
  
    return (
      <div>
        <p>You are currently at Picture-List!</p>
  
        <Link href="/pictures/upload">Go to Upload</Link>
  
        <div className="pictureView">
          {fakePictures != null
            ? fakePictures.map((pic) => (
              <div>
                <hr></hr>
                <h4>Picture pre component load</h4>
                <p>Title: {pic.title}</p>
                <p>Description: {pic.description}</p>
                <p>ID: {pic.id}</p>
                <p>UploadedBy: {JSON.stringify(pic.uploadedBy)}</p>
                <p>Image-Name: {pic.img.name}</p>
                <p>Image-Size: {pic.img.size}</p>
                <PictureComponent picture={pic}></PictureComponent>
                <hr></hr>
              </div>
            ))
            : "error while loading pictures"}
        </div>
      </div>
    );
}