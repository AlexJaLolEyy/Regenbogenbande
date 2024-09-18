import type { Picture } from "../../../types/types";
import { Card, CardHeader, CardBody, Image, CardFooter, Avatar, User } from "@nextui-org/react";
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
            width={256}
            height={144}
          />
        </CardBody>
        <CardFooter className="cardFooter">
          <div className="flex gap-2 items-center">
          <User
              name={picture.uploadedBy.username}
              avatarProps={{
                src: picture.uploadedBy.profilepicture,
                size: "sm"
              }}
            />
          </div>

          <div className="rating" key={picture.id}>
            <FontAwesomeIcon icon={faStar} />
            {/* TODO: optimize this and round it to the right decimal */}
            {/* <p>{picture.metadata.rating ? picture.metadata.rating.reduce((sum, rating) => sum + rating.value, 0) / picture.metadata.rating.length : 0}</p> */}
            <p>4.5</p>
          </div>
          <div className="views">
            <FontAwesomeIcon icon={faEye} />
            <p>{picture.metadata.views}</p>
          </div>
        </CardFooter>
      </Card>

    </div>
  );
}
