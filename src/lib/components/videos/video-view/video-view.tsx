"use client"

import { Video } from "../../../types/types"
import Link from "next/link";
import { useEffect } from "react";
import { Breadcrumbs, BreadcrumbItem, User, Textarea, Button, Tooltip, Avatar, AvatarGroup } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faStar, faEye, faClock, faShareFromSquare } from "@fortawesome/free-regular-svg-icons";

// TODO: (future features):
// - Related videos: Show a row of related videos below the description once tags/categories/filtering are available.
// - Comments section: Allow users to comment or react to videos.
// - Progress bar: Display a progress bar if the user has watched part of the video.
// - add video link on click onto share button

export default function VideoView({ video }: { video: Video }) {
  useEffect(() => {
    console.log("VideoView: ", video);
  }, []);

  const calculateAverageRating = (ratings: { value: number }[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.value, 0);
    return (sum / ratings.length).toFixed(1);
  };

  return (
    <div className="pt-20 px-4 max-w-7xl mx-auto">
      <Breadcrumbs className="mb-6">
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/videos">Videos</BreadcrumbItem>
        <BreadcrumbItem href="">Video-View</BreadcrumbItem>
      </Breadcrumbs>

      <div className="mb-8">
        <video 
          className="w-full aspect-video rounded-lg bg-black" 
          controls
        >
          <source src={video.video} type="video/mp4" />
          Video cant be displayed due to error...
        </video>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
          <div className="flex items-center gap-6 text-default-500">
            <Tooltip content="Views">
              <div className="flex items-center gap-2 cursor-pointer transition-colors hover:text-primary-400">
                <FontAwesomeIcon icon={faEye} />
                <span>{video.metadata.views} views</span>
              </div>
            </Tooltip>
            <Tooltip content="Average Rating">
              <div className="flex items-center gap-1 text-yellow-400 cursor-pointer group">
                <FontAwesomeIcon icon={faStar} className="transition-transform group-hover:scale-125" />
                <span className="font-semibold">{calculateAverageRating(video.metadata.rating)}</span>
              </div>
            </Tooltip>
            <Tooltip content="Uploaded at">
              <div className="flex items-center gap-2 cursor-pointer transition-colors hover:text-primary-400">
                <FontAwesomeIcon icon={faClock} />
                <span>{video.uploadedAt.toLocaleDateString()}</span>
              </div>
            </Tooltip>
          </div>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Share this video">
            <Button isIconOnly variant="ghost">
              <FontAwesomeIcon icon={faShareFromSquare} size="lg" />
            </Button>
          </Tooltip>
          <Tooltip content="Edit this video">
            <Link href={`/videos/${video.id}/edit`}>
              <Button isIconOnly variant="ghost">
                <FontAwesomeIcon icon={faPenToSquare} size="lg" />
              </Button>
            </Link>
          </Tooltip>
        </div>
      </div>

      <div className="border-b border-default-700/30 mb-6"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-white/5 dark:bg-black/30 rounded-xl p-6 backdrop-blur-md shadow-sm">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-default-500">Uploaded by</span>
          <div className="flex items-center gap-2">
            <User
              name={video.uploadedBy.username}
              avatarProps={{
                src: video.uploadedBy.profilepicture,
                size: "sm"
              }}
              className="text-sm font-normal"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-default-500">Created at</span>
          <p>{video.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-default-500">Participants</span>
          <AvatarGroup max={5} size="sm" className="flex -space-x-2" isGrid>
            {video.participants.map((user) => (
              <Tooltip key={user.id} content={user.username}>
                <Avatar src={user.profilepicture} name={user.username} size="sm" isBordered />
              </Tooltip>
            ))}
          </AvatarGroup>
        </div>
      </div>

      <div className="mb-8">
        <Textarea
          isReadOnly
          label="Description"
          variant="bordered"
          labelPlacement="outside"
          placeholder="No description available"
          defaultValue={video.description}
          className="w-full"
        />
      </div>
    </div>
  );
}

