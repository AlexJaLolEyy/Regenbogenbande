import { getPictureById } from "@/app/current-storage/storage";
import Navigation from "@/lib/components/Navigation/navigation";
import PictureView from "@/lib/components/pictures/picture-view/picture-view";
import React from "react";


// TODO: add the view component here with the right data

export default async function Page({ params }: { params: { id: number } }) {

  var selectedPicture = await getPictureById(params.id);

  return (
    <div>
      <Navigation></Navigation>
      <PictureView picture={selectedPicture}></PictureView>
    </div>
  )
}
