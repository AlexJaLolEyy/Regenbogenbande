'use client'

import { faEye, faStar } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, CardBody, CardFooter, CardHeader, Image, User } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import type { Video } from "../../../types/types";
import "./video.scss";

export default function VideoComponent({ video }: { video: Video }) {

  const router = useRouter();

  return (

    <div className="video">

      <Card className="py-4" isPressable onPress={() => {
        router.push('/videos/' + video.id);
      }}>
        <CardBody className="overflow-visible py-2">
          <Image
            isZoomed
            alt="Card background"
            className="object-cover"
            src={video.thumbnail === null ? "Fehler" : video.thumbnail}
            width={270}
          />
        </CardBody>
        <CardHeader className="pb-0 pt-0 px-4 flex-col items-start">
          <h4 className="font-bold text-large">{video.title}</h4>
        </CardHeader>
        <CardFooter className="cardFooter">
          <div className="flex gap-2 items-center">
            <User
              name={video.uploadedBy.username}
              avatarProps={{
                src: video.uploadedBy.profilepicture,
                size: "sm"
              }}
            />
          </div>

          <div className="rating" key={video.id}>
            <FontAwesomeIcon icon={faStar} />
            {/* TODO: optimize this and round it to the right decimal */}
            {/* <p>{video.metadata.rating ? video.metadata.rating.reduce((sum, rating) => sum + rating.value, 0) / video.metadata.rating.length : 0}</p> */}
            <p>4.5</p>
          </div>
          <div className="views">
            <FontAwesomeIcon icon={faEye} />
            <p>{video.metadata.views}</p>
          </div>

        </CardFooter>
      </Card>

    </div>

  );
}
