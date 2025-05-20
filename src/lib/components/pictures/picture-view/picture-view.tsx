"use client"

import { Picture } from "../../../types/types"
import { useEffect } from "react";
import { faPenToSquare, faStar } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { User, Textarea, BreadcrumbItem, Breadcrumbs, Image, Tooltip } from "@heroui/react";
import NextImage from "next/image";
import Link from "next/link";

import "./picture-view.scss";
import video from "../../videos/video/video";

export default function PictureView({ picture }: { picture: Picture }
) {

  useEffect(() => {
    console.log("PictureView: ", picture);
  }, []);

  return (
    <div>
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/pictures">Pictures</BreadcrumbItem>
        <BreadcrumbItem href="">Picture-View</BreadcrumbItem>
      </Breadcrumbs>

      <Link href="/pictures/upload">Go to Upload</Link>


      <div className="viewHeader">
        <div className="title">
          <h1>{picture.title}</h1>
        </div>
        <div className="editButton">
          <Tooltip content="Edit this picture">
          <Link href={`/pictures/${picture.id}/edit`}>
            <FontAwesomeIcon icon={faPenToSquare} size="lg" />
          </Link>
          </Tooltip>
        </div>
      </div>

        <Image
          alt="Picture"
          // className="object-cover"
          id="picture"
          as={NextImage}
          className="picturePreview"
          src={picture.img === null ? "Kein Img vorhanden!" : picture.img}
          width={768}
          height={432}
        />

      <div className="metadata">
        <div className="uploadedBy">
          <label>Uploaded by</label>
          <User
            name={picture.uploadedBy.username}
            avatarProps={{
              src: picture.uploadedBy.profilepicture
            }}
          />
        </div>
        <div className="uploadedAt">
          <label>Uploaded at</label>
          <p>{picture.uploadedAt.toLocaleDateString()}</p>
        </div>
        <div className="createdAt">
          <label>Created at</label>
          <p>{picture.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="rating">
          <label>Rating</label>
          <div className="stars">
            <FontAwesomeIcon icon={faStar} />
            <FontAwesomeIcon icon={faStar} />
            <FontAwesomeIcon icon={faStar} />
            <FontAwesomeIcon icon={faStar} />
            <FontAwesomeIcon icon={faStar} />
          </div>
        </div>
      </div>

      <div className="description">
        <Textarea
          isReadOnly
          label="Description"
          variant="bordered"
          labelPlacement="inside"
          placeholder="Enter your description"
          defaultValue={picture.description}
          className="max-w"
        />
      </div>

    </div>
  );
}