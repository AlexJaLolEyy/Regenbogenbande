import { getPictureById } from "@/src/app/current-storage/storage";
import PictureView from "@/src/lib/components/pictures/picture-view/picture-view";
import React from "react";

export default async function Page({ params }: { params: Promise<{ id: number }> }) {
  // In Next.js 15, params must be awaited
  const { id } = await params;

  // parse the received date string back to type Date
  var selectedPicture = await getPictureById(id);
  selectedPicture.uploadedAt = new Date(selectedPicture.uploadedAt);
  selectedPicture.createdAt = new Date(selectedPicture.createdAt);

  return (
    <div>
      <PictureView picture={selectedPicture}></PictureView>
    </div>
  )
}
