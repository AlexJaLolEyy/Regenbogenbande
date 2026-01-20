import PictureEdit from "@/src/lib/components/pictures/picture-edit/picture-edit";
import { getPictureById } from "@/src/lib/db/selects/pictures";
import { Picture } from "@/src/lib/types/types";


export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const selectedPicture = await getPictureById(id);

  return (
      <PictureEdit picture={selectedPicture as Picture}></PictureEdit>
  )
}
