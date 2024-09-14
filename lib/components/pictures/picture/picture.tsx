import type { Picture } from "../../../types/types";
import { Card, CardHeader, CardBody, Image, CardFooter, Avatar } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { faStar, faEye } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./picture.scss";

export default function PictureComponent({ picture }: { picture: Picture }) {

  // TODO: find suitable picture size for display (width + height relation) z.b. 1980x1020...

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
          <Image
              alt="User Profile"
              className="object-cover none"
              src={picture.uploadedBy.profilepicture === null ? "Fehler" : picture.uploadedBy.profilepicture}
              width={35}
            />
            <p className="text-tiny uppercase font-bold">{picture.uploadedBy.username}</p>
          </div>
          <div className="rating">
          <FontAwesomeIcon icon={faStar} />
          {/* TODO: replace with actual rating */}
            <p>4.6</p> 
          </div>
          <div className="views">
            <FontAwesomeIcon icon={faEye} />
            {/* TODO: replace with actual rating */}
            <p>166</p>
          </div>
        </CardFooter>
      </Card>

    </div>
  );
}
