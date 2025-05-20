import { getPictureById } from "@/app/current-storage/storage";
import PictureView from "@/lib/components/pictures/picture-view/picture-view";
import React from "react";

export default async function Page({ params }: { params: { id: number } }) {

  // parse the received date string back to type Date
  var selectedPicture = await getPictureById(params.id);
  selectedPicture.uploadedAt = new Date(selectedPicture.uploadedAt);
  selectedPicture.createdAt = new Date(selectedPicture.createdAt);

  return (
    <div>
      <PictureView picture={selectedPicture}></PictureView>
    </div>
  )
}
