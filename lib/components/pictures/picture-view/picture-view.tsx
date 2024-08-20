"use client"

import { Picture } from "../../../types/types"
import Link from "next/link";

import Image from 'next/image'

import { useEffect } from "react";

export default function PictureView({ picture }: { picture: Picture }
) {

  useEffect(() => {
    console.log("PictureView: ", picture);
  }, []);

  return (
    <div>
      <p>You are currently at Picture-View!</p>

      <Link href="/pictures/upload">Go to Upload</Link>

      <Image
        alt="Picture"
        className="object-cover none"
        src={picture.img === null ? "Kein Img vorhanden!" : picture.img}
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