import { getVideoById } from "@/src/app/current-storage/storage";
import VideoEdit from "@/src/lib/components/videos/video-edit/video-edit";


export default async function Page({ params }: { params: Promise<{ id: number }> }) {
  // In Next.js 15, params must be awaited
  const { id } = await params;

  const selectedVideo = await getVideoById(id);

  return (
    <div>
      <VideoEdit video={selectedVideo}></VideoEdit>
    </div>
  )
}
