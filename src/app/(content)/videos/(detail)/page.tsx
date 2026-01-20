import { getSession } from "@/src/lib/auth-utils";
import VideoList from "@/src/lib/components/videos/video-list/video-list";
import { getVideosForList } from "@/src/lib/db/selects/videos";
import { prisma } from "@/src/lib/prisma";
import { VideoListItem } from "@/src/lib/types/types";

export default async function Page() {
  const session = await getSession();
  const videos: VideoListItem[] = await getVideosForList(session);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <VideoList initialVideos={videos} categories={categories} />
  );
}
