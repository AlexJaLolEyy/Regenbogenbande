import { notFound } from "next/navigation";
import { getComments } from "@/src/lib/actions/comments";
import { getSession } from "@/src/lib/auth-utils";
import VideoView from "@/src/lib/components/videos/video-view/video-view";
import { getVideoById } from "@/src/lib/db/selects/videos";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getSession();
  const selectedVideo = await getVideoById(id, session);
  if (!selectedVideo) notFound();
  const initialComments = await getComments('video', id);

  return (
      <VideoView video={selectedVideo} initialComments={initialComments} />
  )
}
