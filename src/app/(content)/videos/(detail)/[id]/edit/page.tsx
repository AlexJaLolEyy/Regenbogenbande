import { getVideoById } from "@/src/app/current-storage/storage";
import Navigation from "@/src/lib/components/Navigation/navigation";
import VideoEdit from "@/src/lib/components/videos/video-edit/video-edit";


export default async function Page({ params }: { params: { id: number } }) {

  var selectedVideo = await getVideoById(params.id);

  return (
    <div>
      <VideoEdit video={selectedVideo}></VideoEdit>
    </div>
  )
}
