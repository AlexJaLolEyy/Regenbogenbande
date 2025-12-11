"use client"

import { Picture } from "../../../types/types"
import { useEffect } from "react";
import { faPenToSquare, faStar, faShareFromSquare } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { User, Textarea, BreadcrumbItem, Breadcrumbs, Image, Tooltip, Button, Avatar, AvatarGroup } from "@heroui/react";
import NextImage from "next/image";
import Link from "next/link";
import { DeleteButton } from "@/src/lib/components/ui/delete-button";

export default function PictureView({ picture }: { picture: Picture }) {

  useEffect(() => {
    console.log("PictureView: ", picture);
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
        <BreadcrumbItem href="/pictures">Pictures</BreadcrumbItem>
        <BreadcrumbItem href="">Picture-View</BreadcrumbItem>
      </Breadcrumbs>

      <div className="mb-8 flex justify-center">
        <Image
          alt={picture.title}
          as={NextImage}
          className="rounded-lg object-cover object-center w-full max-w-4xl aspect-video bg-black"
          src={picture.img ?? "/placeholder-image.jpg"}
          width={768}
          height={432}
        />
      </div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{picture.title}</h1>
          <div className="flex items-center gap-6 text-default-500">
            <Tooltip content="Average Rating">
              <div className="flex items-center gap-1 text-yellow-400 cursor-pointer group">
                <FontAwesomeIcon icon={faStar} className="transition-transform group-hover:scale-125" />
                <span className="font-semibold">{calculateAverageRating(picture.metadata.rating)}</span>
              </div>
            </Tooltip>
            <Tooltip content="Uploaded at">
              <div className="flex items-center gap-2 cursor-pointer transition-colors hover:text-primary-400">
                <span>{picture.uploadedAt.toLocaleDateString()}</span>
              </div>
            </Tooltip>
          </div>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Share this picture">
            <Button isIconOnly variant="ghost">
              <FontAwesomeIcon icon={faShareFromSquare} size="lg" />
            </Button>
          </Tooltip>
          <Tooltip content="Edit this picture">
            <Link href={`/pictures/${picture.id}/edit`}>
              <Button isIconOnly variant="ghost">
                <FontAwesomeIcon icon={faPenToSquare} size="lg" />
              </Button>
            </Link>
          </Tooltip>
          <DeleteButton
            id={picture.id}
            type="picture"
            ownerId={Number(picture.uploadedBy.id)}
            redirectUrl="/pictures"
          />
        </div>
      </div>

      <div className="border-b border-default-700/30 mb-6"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-white/5 dark:bg-black/30 rounded-xl p-6 backdrop-blur-md shadow-sm">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-default-500">Uploaded by</span>
          <div className="flex items-center gap-2">
            <User
              name={picture.uploadedBy.username}
              avatarProps={{
                src: picture.uploadedBy.profilepicture,
                size: "sm"
              }}
              className="text-sm font-normal"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-default-500">Created at</span>
          <p>{picture.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-default-500">Participants</span>
          {picture.participants && picture.participants.length > 0 ? (
            <AvatarGroup max={5} size="sm" className="flex -space-x-2" isGrid>
              {picture.participants.map((user) => (
                <Tooltip key={user.id} content={user.username}>
                  <Avatar src={user.profilepicture} name={user.username} size="sm" isBordered />
                </Tooltip>
              ))}
            </AvatarGroup>
          ) : (
            <span className="text-default-400">No participants</span>
          )}
        </div>
      </div>

      <div className="mb-8">
        <Textarea
          isReadOnly
          label="Description"
          variant="bordered"
          labelPlacement="outside"
          placeholder="No description available"
          defaultValue={picture.description}
          className="w-full"
        />
      </div>
    </div>
  );
}