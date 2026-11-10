import { notFound } from "next/navigation";
import { getComments } from "@/src/lib/actions/comments";
import { getSession } from "@/src/lib/auth-utils";
import PictureView from "@/src/lib/components/pictures/picture-view/picture-view";
import { getPictureById } from "@/src/lib/db/selects/pictures";
import { Picture } from "@/src/lib/types/types";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getSession();
  const selectedPicture = await getPictureById(id, session);
  if (!selectedPicture) notFound();

  const initialComments = await getComments('picture', id);

  return (
      <PictureView picture={selectedPicture as Picture} initialComments={initialComments}></PictureView>
  )
}
