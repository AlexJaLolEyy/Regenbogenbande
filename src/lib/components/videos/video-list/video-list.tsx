"use client";

import { Alert, Avatar, BreadcrumbItem, Breadcrumbs, Card, CardBody } from "@heroui/react";
import Link from "next/link";
import type { Video } from "../../../types/types";
import VideoComponent from "../video/video";
import "./video-list.scss";

export default function VideoList({ videos }: { videos: Video[] }) {

  return (
    <div>

      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/videos">Videos</BreadcrumbItem>
      </Breadcrumbs>

      <h1>Select a Video!</h1>
      <h2><Link href="/videos/upload">Go to Upload</Link></h2>

      <div className="videoList form-grid">
        {videos != null || videos != undefined ?
          videos.map((video) => (
            <div key={video.id} className="form-item">
              <VideoComponent video={video}></VideoComponent>
            </div>
          ))
          : "Videos null or undefined"}
      </div>

      <div className="flex gap-4 items-center">
        <Avatar isBordered radius="full" src="https://i.pravatar.cc/150?u=a04258114e29026708c" />
        <Avatar isBordered radius="lg" src="https://i.pravatar.cc/150?u=a04258114e29026302d" />
        <Avatar isBordered radius="md" src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
        <Avatar isBordered radius="sm" src="https://i.pravatar.cc/150?u=a04258a2462d826712d" />
      </div>


      <div className="flex items-center justify-center w-full">
      <div className="flex flex-col w-full">
        {["default", "primary", "secondary", "success", "warning", "danger"].map((color) => (
          <div key={color} className="w-full flex items-center my-3">
            <Alert color={color} title={`This is a ${color} alert`} />
          </div>
        ))}
      </div>
    </div>

    </div>
  );
}
