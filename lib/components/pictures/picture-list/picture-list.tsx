"use client"

import { Picture } from "../../../types/types"
import Link from "next/link";
import PictureComponent from "../picture/picture";

import "./picture-list.css";

// TODO: remove the "?" from pictures and supply data from page"
export default function PictureList({ pictures }: { pictures: Picture[] }
) {
  
    return (
      <div>
        <p>You are currently at Picture-List!</p>
        <Link href="/pictures/upload">Go to Upload</Link>

        <div className="pictureList">
          {pictures != null && pictures != undefined
            ? pictures.map((pic) => (
              <div key={pic.id}>
                <PictureComponent picture={pic}></PictureComponent>
              </div>
            ))
            : "error while loading pictures"}
        </div>

      </div>
    );
}