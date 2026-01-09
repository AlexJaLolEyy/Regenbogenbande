import { getVideoById } from "@/src/app/current-storage/storage";
import { getComments } from "@/src/lib/actions/comments";
import VideoView from "@/src/lib/components/videos/video-view/video-view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const selectedVideo = await getVideoById(id);
  if (!selectedVideo) return <div>Video not found</div>;

  const initialComments = await getComments('video', id);

  return (
    <div>
      <VideoView video={selectedVideo} initialComments={initialComments}></VideoView>
    </div>
  )
}
