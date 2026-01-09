import { getVideoById } from "@/src/app/current-storage/storage";
import VideoEdit from "@/src/lib/components/videos/video-edit/video-edit";
import { Video } from "@/src/lib/types/types";


export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const selectedVideo = await getVideoById(id);

  return (
    <div>
      <VideoEdit video={selectedVideo as Video}></VideoEdit>
    </div>
  )
}
