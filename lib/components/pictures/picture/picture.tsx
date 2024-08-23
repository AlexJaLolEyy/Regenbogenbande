import type { Picture } from "../../../types/types";
import { Card, CardHeader, CardBody, Image, CardFooter, Avatar } from "@nextui-org/react";
import "./picture.css";
import { useRouter } from "next/navigation";

export default function PictureComponent({ picture }: { picture: Picture }) {

  // TODO: replace html with card component + styling
  // TODO: find suitable picture size for display (width + height relation) z.b. 1980x1020...
  // TODO: add "isPressable" to card (might need to redo styling)

  const router = useRouter();

  return (
    <div className="picture">

      <Card className="py-4" isPressable onPress={() => {
        router.push('/pictures/' + picture.id);
      }}>
        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
          <h4 className="font-bold text-large">{picture.title}</h4>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Image
            isZoomed
            alt="Card background"
            className="object-cover"
            src={picture.img === null ? "Fehler" : picture.img}
            width={270}
          />
        </CardBody>
        <CardFooter className="cardFooter">
          <div className="flex gap-2 items-center">
            <Avatar src={picture.img === null ? "Fehler" : picture.uploadedBy.profilepicture} name={picture.uploadedBy.username} size="md" />
            {/* <Image
              alt="User Profile"
              className="object-cover none"
              src={picture.img === null ? "Fehler" : picture.uploadedBy.profilepicture}
              width={35}
            /> */}
            <p className="text-tiny uppercase font-bold">{picture.uploadedBy.username}</p>
          </div>
          <small className="text-default-500">Likes</small>
          <small className="text-default-500">Views</small>
        </CardFooter>
      </Card>

    </div>
  );
}
