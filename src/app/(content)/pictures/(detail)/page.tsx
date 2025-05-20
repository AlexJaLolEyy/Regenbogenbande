import { getAllPictures } from "@/app/current-storage/storage";
import PictureList from "@/lib/components/pictures/picture-list/picture-list";

export default async function Page() {

  var pictures = await getAllPictures();

  return (
    <div>
      <PictureList pictures={pictures}></PictureList>
    </div>
  )
}
