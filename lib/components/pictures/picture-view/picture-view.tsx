"use client"

import { Picture } from "../../../types/types"
import Link from "next/link";

import { Card, CardHeader, CardBody, Image, CardFooter, Button } from "@nextui-org/react";


// TODO: remove the "?" from pictures and supply data from page"
export default function PictureView({ picture }: { picture: Picture }
) {

  return (
    <div style={{backgroundColor: "lightblue"}}>
      <p>You are currently at Picture-View!</p>

      <Link href="/pictures/upload">Go to Upload</Link>

      <Image
        alt="Picture"
        className="object-cover none"
        src={picture.img === null ? "Kein Img vorhanden!" : URL.createObjectURL(picture.img)}
        width={1280}
        height={720}
      />

      <p>Title: {picture.title}</p>
      <p>Description: {picture.description}</p>
      <p>ID: {picture.id}</p>
      <p>UploadedBy: {JSON.stringify(picture.uploadedBy)}</p>

    </div>
  );
}