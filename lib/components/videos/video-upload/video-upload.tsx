"use client";

import { useState, useEffect } from "react";
import type { Video, User, UploadVideo } from "../../../types/types";
import { Input, Textarea, User, DateInput, Select, SelectItem, Avatar, Chip, SelectedItems, CircularProgress, Skeleton, Image } from "@nextui-org/react";
import MP4Box from 'mp4box';
import { getAllUsers, getUserById } from "@/app/current-storage/storage";
import { useForm, SubmitHandler, Controller } from "react-hook-form"

import { getLocalTimeZone, parseDate, today, CalendarDate, fromDate } from "@internationalized/date";


export default function VideoUpload({ video }: { video?: Video }) {

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<UploadVideo>()
  const onSubmit: SubmitHandler<UploadVideo> = (data) => {
    console.log("errors: ", errors);

    // participants should be User[] but form return a string
    const selectedUsers = (data.participants.split(",")).map((id: string) =>
      users.find((user) => user.id === parseInt(id))
    );
    data.participants = selectedUsers;

    console.log('Selected users:', selectedUsers);
    console.log("created: ", data.createdAt.toLocaleString());
    console.log("createdv2: ", creationDate?.toLocaleDateString());
    console.log("data: ", data);
  }

  const [preview, setPreview] = useState<File | null>(null);
  const [creationDate, setCreationDate] = useState<Date | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  var currentDate = new Date();
  console.log("c date: ", currentDate);
  console.log("c date2: ", fromDate(currentDate, getLocalTimeZone()));
  var currentDateString = (currentDate.getFullYear().toString() + "-" + (currentDate.getMonth() + 1).toString() + "-" + currentDate.getDate().toString());




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
          console.log("creationDate: ", info.created);
          console.log("creationDate parsed: ", fromDate(info.created, getLocalTimeZone()))
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

      <form onSubmit={handleSubmit(onSubmit)}>
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
          <Input type="file" isRequired label="Upload File" variant="bordered"
            accept="video/*"
            {...register("video", { required: true, onChange: (e) => handleFileChange(e) })} />
        </div>

        <div className="title">
          <Input type="text" isRequired isClearable label="Title" variant="bordered"
            isInvalid={false} errorMessage="Please enter a valid Title!"
            {...register("title", { required: true })}
          />
        </div>

        <div className="participants">
          <Select
            {...register("participants", {
              setValueAs: v => [v],
              value: [],
              onChange: e => console.log("participants: ", e),

            })}
            isRequired
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
            {...register("description")}
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
            isRequired
            {...register("uploadedBy", {
              required: true,
            }
            )}
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
          <Controller
            name="uploadedAt"
            control={control}
            rules={{
              // required: true,
            }} 



            // label="Uploaded At"
            //     isRequired
            //     variant="bordered"
            //     className="max-w-sm"
            //     value={field.value ? fromDate(field.value, getLocalTimeZone()) : fromDate(new Date(), getLocalTimeZone())} // Set value
            //     onChange={(newDate) => {
            //       field.onChange(parseDate(newDate.toString())); // Update form state
            //     }}

            render={({ field }) => (
              <DateInput
                label="Uploaded At"
                isRequired
                variant="bordered"
                className="max-w-sm"
                value={creationDate ? fromDate(creationDate, getLocalTimeZone()) : today(getLocalTimeZone())}
                onChange={(date) => {
                  console.log("date change: ", date);
                  field.onChange(date);
                }}
              />
            )}
          />
        </div>

        <div className="createdAt">
          <Controller
            name="createdAt"
            control={control}
            render={({ field }) => (
              <DateInput
                label="Created At"
                isRequired
                {...register("createdAt", {
                  valueAsDate: true,
                  required: true,
                  onChange: (e) => console.log("createdDate: ", e)
                })}
                variant="bordered"
                defaultValue={fromDate(new Date(), getLocalTimeZone())}
                value={creationDate ? fromDate(creationDate, getLocalTimeZone()) : today(getLocalTimeZone())}
                className="max-w-sm"
              />
            )}
          />
        </div>

        {errors ? (
          <div><p>Errors: {JSON.stringify(errors)}</p></div>
        ) : "keine error"}

        {/* value={fromDate(field.value || new Date())} // Convert JS Date to CalendarDate
        onChange={(newDate) => {
           field.onChange(toDate(newDate));  */}

        <input type="submit" />
      </form>

    </div>
  );
}
