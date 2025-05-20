import { getAllVideos} from "@/src/app/current-storage/storage";
import VideoList from "@/src/lib/components/videos/video-list/video-list";
import { Video } from "@/src/lib/types/types";

export default async function Page() {

  var videos: Video[] = await getAllVideos();

  return (
    <div className="pt-20">
      <VideoList videos={videos}></VideoList>
    </div>
  )
}
