import { getExampleVideos} from "@/app/current-storage/storage";
import Navigation from "@/lib/components/Navigation/navigation";
import VideoList from "@/lib/components/videos/video-list/video-list";
import { Video } from "@/lib/types/types";

export default async function Page() {

  var videos: Video[] = await getExampleVideos();

  return (
    <div>
      <Navigation></Navigation>
      <VideoList videos={videos}></VideoList>
    </div>
  )
}
