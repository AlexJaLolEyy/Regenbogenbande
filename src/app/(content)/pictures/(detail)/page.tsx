import { getAllPictures } from "@/src/app/current-storage/storage";
import PictureList from "@/src/lib/components/pictures/picture-list/picture-list";

export default async function Page() {
  const pictures = await getAllPictures();

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <PictureList initialPictures={pictures} />
    </div>
  );
}
