import { getSession } from "@/src/lib/auth-utils";
import PictureList from "@/src/lib/components/pictures/picture-list/picture-list";
import { getPicturesForList } from "@/src/lib/db/selects/pictures";
import { prisma } from "@/src/lib/prisma";
import { PICTURES_PER_PAGE } from "@/src/lib/queries/use-pictures";

export default async function Page() {
  const session = await getSession();
  const initial = await getPicturesForList(session, { limit: PICTURES_PER_PAGE });
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, iconUrl: true },
    orderBy: { name: 'asc' }
  });

  // People who are tagged in at least one item, for the "person" filter
  const people = await prisma.user.findMany({
    where: { pictureParticipants: { some: {} }, status: { not: "DISABLED" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <PictureList initial={initial} categories={categories} people={people} />
  );
}
