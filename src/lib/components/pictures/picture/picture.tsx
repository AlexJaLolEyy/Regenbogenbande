import type { Picture } from "../../../types/types";
import { Card, CardHeader, CardBody, Image, CardFooter, User } from "@heroui/react";
import { useRouter } from "next/navigation";
import { faStar, faEye, faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function PictureComponent({ picture }: { picture: Picture }) {
  const router = useRouter();

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const calculateAverageRating = (ratings: { value: number }[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.value, 0);
    return (sum / ratings.length).toFixed(1);
  };

  return (
    <div className="w-[280px]">
      <Card 
        className="p-4 hover:scale-[1.02] transition-transform duration-200" 
        isPressable 
        onPress={() => {
          router.push('/pictures/' + picture.id);
        }}
      >
        <CardBody className="p-0">
          <div className="relative aspect-video rounded-lg overflow-hidden flex items-center justify-center bg-black">
            <Image
              isZoomed
              alt={picture.title}
              className="object-contain w-full h-full"
              src={picture.img ?? "/placeholder-image.jpg"}
            />
          </div>
        </CardBody>
        <CardHeader className="px-0 pt-4 pb-2">
          <div className="flex justify-between items-start gap-3 w-full">
            <h4 className="font-bold text-lg truncate max-w-[160px]" title={picture.title}>
              {picture.title}
            </h4>
            <div className="flex items-center gap-1 text-yellow-500 shrink-0">
              <FontAwesomeIcon icon={faStar} />
              <span className="text-sm">{calculateAverageRating(picture.metadata.rating)}</span>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="px-0 pt-2 pb-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0 max-w-[200px]">
              <User
                name={picture.uploadedBy.username}
                avatarProps={{
                  src: picture.uploadedBy.profilepicture,
                  size: "sm"
                }}
                classNames={{
                  name: "truncate"
                }}
              />
            </div>
            <div className="flex items-center gap-4 text-default-500 text-sm shrink-0">
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faEye} />
                <span>{picture.metadata.views}</span>
              </div>
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} />
                <span>{formatTimeAgo(picture.uploadedAt)}</span>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
