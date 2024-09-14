'use client'

import { faEye, faStar } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, CardBody, CardFooter, CardHeader, Image } from "@nextui-org/react";
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
            <Image
              alt="User Profile"
              className="object-cover none"
              src={video.uploadedBy.profilepicture === null ? "Fehler" : video.uploadedBy.profilepicture}
              width={35}
            />
            <p className="text-tiny uppercase font-bold">{video.uploadedBy.username}</p>
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
