import { getComments } from "@/src/lib/actions/comments";
import PictureView from "@/src/lib/components/pictures/picture-view/picture-view";
import { getPictureById } from "@/src/lib/db/selects/pictures";
import { Picture } from "@/src/lib/types/types";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const selectedPicture = await getPictureById(id);
  if (!selectedPicture) return <div>Picture not found</div>;

  const initialComments = await getComments('picture', id);

  return (
      <PictureView picture={selectedPicture as Picture} initialComments={initialComments}></PictureView>
  )
}
