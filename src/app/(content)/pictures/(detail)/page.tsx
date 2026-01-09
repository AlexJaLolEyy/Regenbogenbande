import { getAllPictures } from "@/src/app/current-storage/storage";
import { getSession } from "@/src/lib/auth-utils";
import PictureList from "@/src/lib/components/pictures/picture-list/picture-list";
import { prisma } from "@/src/lib/prisma";

export default async function Page() {
  const session = await getSession();
  const pictures = await getAllPictures(session);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <PictureList initialPictures={pictures} categories={categories} />
  );
}
