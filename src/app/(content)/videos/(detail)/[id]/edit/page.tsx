import { getSession } from "@/src/lib/auth-utils";
import VideoEdit from "@/src/lib/components/videos/video-edit/video-edit";
import { getVideoById } from "@/src/lib/db/selects/videos";
import { Video } from "@/src/lib/types/types";


export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getSession();
  const selectedVideo = await getVideoById(id, session);

  return (
      <VideoEdit video={selectedVideo as Video}></VideoEdit>
  )
}
