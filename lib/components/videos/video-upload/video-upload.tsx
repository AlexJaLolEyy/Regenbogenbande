"use client";

import { useState, useEffect } from "react";
import type { Video, User } from "../../../types/types";
import { Input, Textarea, User, DateInput, Select, SelectItem, Avatar, Chip, SelectedItems, CircularProgress, Skeleton, Image } from "@nextui-org/react";
import MP4Box from 'mp4box';
import { getAllUsers } from "@/app/current-storage/storage";


// TODO: try to adjust the setPreview so that the old preview stays consistent when input triggered again, but closed

// FIXME: video is not getting updated after the first input..

export default function VideoUpload({ video }: { video?: Video }) {

  const [preview, setPreview] = useState<File | null>(null);
  const [creationDate, setCreationDate] = useState<Date | null>(null);

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getAllUsers().then((users) => {
      setUsers(users);
    });
  }, []);

  const getCreationDate = (file: File) => {
    if (file) {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);

      fileReader.addEventListener("load", (e) => {
        const buffer = fileReader.result as ArrayBuffer;

        (buffer as any).fileStart = 0;

        const mp4boxFile = MP4Box.createFile();
        mp4boxFile.onError = console.error;
        mp4boxFile.onReady = function (info) {
          console.log(info);
          setCreationDate(info.created);
        };
        mp4boxFile.appendBuffer(buffer);
        mp4boxFile.flush();
      })
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreview(file);
      getCreationDate(file);
      console.log("file: ", file);
    }
  };

  return (
    <div>
      <p>You are currently at Video-Upload!</p>

      <form>
        <h3>Video-Upload:</h3>

        {preview ? (
          <div>
            {/* // key forces React to update video src */}
            <video width={"1024"} height={"576"} controls key={preview.name}>
              <source src={URL.createObjectURL(preview)} type="video/mp4" />
            </video>
          </div>
        ) : "Preview could not be loaded."}

        {creationDate != null ? (
          <div>
            <p>creationDate: {creationDate.toLocaleDateString()}</p>
          </div>
        ) : "No creation Date found!"}


        <div className="fileUpload">
          <Input type="file" label="Upload File" onChange={handleFileChange} variant="bordered"
            accept="video/*" />
        </div>

        <div className="title">
          <Input type="text" label="Title" variant="bordered"
            isInvalid={false} errorMessage="Please enter a valid Title!"
          />
        </div>

        <div className="participants">
          <Select
            items={users}
            label="Participants"
            variant="bordered"
            isMultiline={true}
            selectionMode="multiple"
            placeholder="Select a user"
            labelPlacement="outside"
            classNames={{
              base: "max-w-xs",
              trigger: "min-h-12 py-2",
            }}
            renderValue={(items: SelectedItems<User>) => {
              return (
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <Chip key={item.key}>{item.data.username}</Chip>
                  ))}
                </div>
              );
            }}
          >
            {(user) => (
              <SelectItem key={user.id} textValue={user.username}>
                <div className="flex gap-2 items-center">
                  <Avatar alt={user.username} className="flex-shrink-0" size="sm" src={user.profilepicture} />
                  <div className="flex flex-col">
                    <span className="text-small">{user.username}</span>
                  </div>
                </div>
              </SelectItem>
            )}
          </Select>
        </div>

        <div className="description">
          <Textarea
            label="Description"
            placeholder="Enter your description"
            variant="bordered"
            className="max-w-xs"
            maxLength={255}
            maxRows={4}
            minRows={3}
          />
        </div>

        <div className="uploadedBy">
          <Select
            items={users}
            label="Uploaded By"
            placeholder="Select a user"
            labelPlacement="outside"
            variant="bordered"
            classNames={{
              base: "max-w-xs",
              trigger: "h-12",
            }}
            renderValue={(items: SelectedItems<User>) => {
              return items.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <Avatar
                    alt={item.data.username}
                    className="flex-shrink-0"
                    size="sm"
                    src={item.data?.profilepicture}
                  />
                  <div className="flex flex-col">
                    <span>{item.data.username}</span>
                  </div>
                </div>
              ));
            }}
          >
            {(user) => (
              <SelectItem key={user.id} textValue={user.username}>
                <div className="flex gap-2 items-center">
                  <Avatar alt={user.username} className="flex-shrink-0" size="sm" src={user.profilepicture} />
                  <div className="flex flex-col">
                    <span className="text-small">{user.username}</span>
                  </div>
                </div>
              </SelectItem>
            )}
          </Select>
        </div>

        <div className="uploadedAt">
          <DateInput label="Uploaded At"
            variant="bordered"
            className="max-w-sm" />
        </div>

        <div className="createdAt">
          <DateInput label="Created At"
            variant="bordered"
            className="max-w-sm" />
        </div>


      </form>

    </div>
  );
}
