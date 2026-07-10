import { getSession } from "@/src/lib/auth-utils";
import PictureList from "@/src/lib/components/pictures/picture-list/picture-list";
import { getPicturesForList } from "@/src/lib/db/selects/pictures";
import { prisma } from "@/src/lib/prisma";
import { PictureListItem } from "@/src/lib/types/types";

export default async function Page() {
  const session = await getSession();
  const pictures: PictureListItem[] = await getPicturesForList(session);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, iconUrl: true },
    orderBy: { name: 'asc' }
  });

  return (
    <PictureList initialPictures={pictures} categories={categories} />
  );
}
