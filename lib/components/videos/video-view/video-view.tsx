"use client"

import { Video } from "../../../types/types"
import Link from "next/link";

import { useEffect } from "react";
import { Breadcrumbs, BreadcrumbItem, User, Textarea } from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-regular-svg-icons";
import "./video-view.scss";

export default function VideoView({ video }: { video: Video }
) {

  useEffect(() => {
    console.log("VideoView: ", video);
  }, []);

  return (
    <div>

      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/videos">Videos</BreadcrumbItem>
        <BreadcrumbItem href="">Video-View</BreadcrumbItem>
      </Breadcrumbs>

      <Link href="/videos/upload">Go to Upload</Link>


      <div className="title">
        <h1>{video.title}</h1>
      </div>
      {/* <button onClick={() => addVideo(video)}>Try Adding</button> */}

      <video width="1280" height="720" controls>
        <source src={video.video} type="video/mp4"></source>
        Video cant be displayed due to error...
      </video>

      <div className="metadata">
        <div className="uploadedBy">
          <label>Uploaded by</label>
          <User
            name={video.uploadedBy.username}
            avatarProps={{
              src: video.uploadedBy.profilepicture
            }}
          />
        </div>
        <div className="uploadedAt">
          <label>Uploaded at</label>
          <p>{video.uploadedAt.toLocaleDateString()}</p>
        </div>
        <div className="createdAt">
          <label>Created at</label>
          <p>{video.createdAt.toLocaleDateString()}</p>
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
          defaultValue={video.description}
          className="max-w"
        />
      </div>

    </div>
  );
}