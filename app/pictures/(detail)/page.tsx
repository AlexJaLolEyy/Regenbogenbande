import { getExamplePictures } from "@/app/current-storage/storage";
import Navigation from "@/lib/components/Navigation/navigation";
import PictureList from "@/lib/components/pictures/picture-list/picture-list";

export default async function Page() {

  var pictures = await getExamplePictures();

  return (
    <div>
      <Navigation></Navigation>
      <PictureList pictures={pictures}></PictureList>
    </div>
  )
}
