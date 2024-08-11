import Navigation from "@/lib/components/Navigation/navigation";
import VideoList from "@/lib/components/videos/video-list/video-list";

export default function Page() {

  // import data for list here

  return (
    <div>
      <Navigation></Navigation>
      <VideoList></VideoList>
    </div>
  )
}
