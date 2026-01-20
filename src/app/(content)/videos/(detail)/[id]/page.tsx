import { getComments } from "@/src/lib/actions/comments";
import VideoView from "@/src/lib/components/videos/video-view/video-view";
import { getVideoById } from "@/src/lib/db/selects/videos";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const selectedVideo = await getVideoById(id);
  if (!selectedVideo) return <div>Video not found</div>;
  const initialComments = await getComments('video', id);

  return (
      <VideoView video={selectedVideo} initialComments={initialComments} />
  )
}
