import type { Picture } from "../../../types/types";
import { Card, CardHeader, CardBody, Image, CardFooter, Button } from "@nextui-org/react";
import "./picture.css";

export default function PictureComponent({ picture }: { picture: Picture }) {

  // TODO: replace html with card component + styling
  // TODO: find suitable picture size for display (width + height relation) z.b. 1980x1020...
  // TODO: add "isPressable" to card (might need to redo styling)

  return (
    <div className="picture">

      <Card className="py-4">
        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
          {/* <p className="text-tiny uppercase font-bold">Daily Mix</p> */}
          {/* <small className="text-default-500">12 Tracks</small> */}
          <h4 className="font-bold text-large">{picture.title}</h4>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Image
            alt="Card background"
            className="object-cover"
            src={picture.img === null ? "Fehler" : URL.createObjectURL(picture.img)}
            width={270}
            sizes="600px"
          />
        </CardBody>
        <CardFooter className="cardFooter">
          <div className="flex gap-2 items-center">
            <Image
              alt="User Profile"
              className="object-cover none"
              src={picture.img === null ? "Fehler" : picture.uploadedBy.profilepicture}
              width={35}
            />
            <p className="text-tiny uppercase font-bold">{picture.uploadedBy.username}</p>
          </div>
          <small className="text-default-500">Likes</small>
          <small className="text-default-500">Views</small>
        </CardFooter>
      </Card>

      <div className="pt-4 pb-4"></div>

      <Card className="py-4">

        <CardBody className="overflow-visible py-2">
          <Image
            alt="Card background"
            className="object-cover"
            src={picture.img === null ? "Fehler" : URL.createObjectURL(picture.img)}
            width={270}
          />
        </CardBody>
        <CardHeader className="pb-0 pt-0 px-4 flex-col items-start">
          <h4 className="font-bold text-large">{picture.title}</h4>
        </CardHeader>
        <CardFooter className="cardFooter">
          <div className="flex gap-2 items-center">
            <Image
              alt="User Profile"
              className="object-cover none"
              src={picture.img === null ? "Fehler" : picture.uploadedBy.profilepicture}
              width={35}
            />
            <p className="text-tiny uppercase font-bold">{picture.uploadedBy.username}</p>
          </div>
          <small className="text-default-500">Likes</small>
          <small className="text-default-500">Views</small>
        </CardFooter>
      </Card>




      {/* <hr></hr>
      <div className="pictureImg">
        <p>path: {URL.createObjectURL(picture.img)}</p>
        <img
          src={picture.img === null ? "Fehler" : URL.createObjectURL(picture.img)}
          alt="error while loading picture"
          width={"250"}
          height={"250"}
        ></img>
      </div>
      <div className="pictureTitle">
        <p>Picture Title: {picture.title}</p>
      </div>
      <div className="pictureMetaData">
        <p>Picture CreatedAt: {picture.createdAt.toString()}</p>
        <p>Picture UploadedBy: {picture.uploadedBy.username}</p>
      </div>
      <hr></hr> */}
    </div>
  );
}
