"use client"

import { BreadcrumbItem, Breadcrumbs } from "@nextui-org/react";
import Link from "next/link";
import { Picture } from "../../../types/types";
import PictureComponent from "../picture/picture";
import "./picture-list.css";

export default function PictureList({ pictures }: { pictures: Picture[] }
) {

  return (
    <div>

      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/pictures">Pictures</BreadcrumbItem>
      </Breadcrumbs>

      <h1>Select a Picture!</h1>
      <h2><Link href="/pictures/upload">Go to Upload</Link></h2>

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