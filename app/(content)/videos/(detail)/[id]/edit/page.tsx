import { getVideoById } from "@/app/current-storage/storage";
import Navigation from "@/lib/components/Navigation/navigation";
import VideoEdit from "@/lib/components/videos/video-edit/video-edit";


export default async function Page({ params }: { params: { id: number } }) {

  var selectedVideo = await getVideoById(params.id);

  return (
    <div>
      <VideoEdit video={selectedVideo}></VideoEdit>
    </div>
  )
}
