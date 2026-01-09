import { getPictureById } from "@/src/app/current-storage/storage";
import PictureEdit from "@/src/lib/components/pictures/picture-edit/picture-edit";
import { Picture } from "@/src/lib/types/types";


export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const selectedPicture = await getPictureById(id);

  return (
    <div>
      <PictureEdit picture={selectedPicture as Picture}></PictureEdit>
    </div>
  )
}
