import { getAllVideos} from "@/app/current-storage/storage";
import VideoList from "@/lib/components/videos/video-list/video-list";
import { Video } from "@/lib/types/types";

export default async function Page() {

  var videos: Video[] = await getAllVideos();

  return (
    <div>
      <VideoList videos={videos}></VideoList>
    </div>
  )
}
