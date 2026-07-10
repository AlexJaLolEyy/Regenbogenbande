import { getSession } from "@/src/lib/auth-utils";
import VideoList from "@/src/lib/components/videos/video-list/video-list";
import { getVideosForList } from "@/src/lib/db/selects/videos";
import { prisma } from "@/src/lib/prisma";
import { VideoListItem } from "@/src/lib/types/types";

export default async function Page() {
  const session = await getSession();
  const videos: VideoListItem[] = await getVideosForList(session, { limit: 15 });
  const initialTotal = await prisma.video.count({
    where: {
      isPublic: session?.user && !session.user.isAnonymous ? undefined : true,
    }
  });

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, iconUrl: true },
    orderBy: { name: 'asc' }
  });

  return (
    <VideoList initialVideos={videos} initialTotal={initialTotal} categories={categories} />
  );
}
