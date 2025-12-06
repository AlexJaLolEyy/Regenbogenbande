import { getPictureById } from "@/src/app/current-storage/storage";
import PictureEdit from "@/src/lib/components/pictures/picture-edit/picture-edit";


export default async function Page({ params }: { params: Promise<{ id: number }> }) {
  // In Next.js 15, params must be awaited
  const { id } = await params;

  var selectedPicture = await getPictureById(id);

  return (
    <div>
      <PictureEdit picture={selectedPicture}></PictureEdit>
    </div>
  )
}
