import { getPictureById } from "@/app/current-storage/storage";
import PictureEdit from "@/lib/components/pictures/picture-edit/picture-edit";


export default async function Page({ params }: { params: { id: number } }) {

  var selectedPicture = await getPictureById(params.id);

  return (
    <div>
      <PictureEdit picture={selectedPicture}></PictureEdit>
    </div>
  )
}
