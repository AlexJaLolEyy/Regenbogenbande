import type { Picture } from "../../../types/types";
import {Card, CardHeader, CardBody, Image} from "@nextui-org/react";
import "./picture.css";

export default function PictureComponent({ picture }: { picture: Picture }) {

  // TODO: replace html with card component + styling

  return (
    <div className="picture">

      <Card className="py-4">
        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
          <p className="text-tiny uppercase font-bold">Daily Mix</p>
          {/* <small className="text-default-500">12 Tracks</small> */}
          <h4 className="font-bold text-large">Frontend Radio</h4>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Image
            alt="Card background"
            className="object-cover rounded-xl"
            src={picture.img === null ? "Fehler" : URL.createObjectURL(picture.img)}
            width={270}
          />
        </CardBody>
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
