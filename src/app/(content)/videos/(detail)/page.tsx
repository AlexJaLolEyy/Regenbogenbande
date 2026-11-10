import { getSession } from "@/src/lib/auth-utils";
import VideoList from "@/src/lib/components/videos/video-list/video-list";
import { getVideosForList } from "@/src/lib/db/selects/videos";
import { prisma } from "@/src/lib/prisma";
import { VIDEOS_PER_PAGE } from "@/src/lib/queries/use-videos";

export default async function Page() {
  const session = await getSession();
  const initial = await getVideosForList(session, { limit: VIDEOS_PER_PAGE });

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, iconUrl: true },
    orderBy: { name: 'asc' }
  });

  // People who are tagged in at least one item, for the "person" filter
  const people = await prisma.user.findMany({
    where: { videoParticipants: { some: {} }, status: { not: "DISABLED" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <VideoList initial={initial} categories={categories} people={people} />
  );
}
