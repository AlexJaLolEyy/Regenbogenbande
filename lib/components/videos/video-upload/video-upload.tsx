"use client"

import { getAllUsers } from "@/app/current-storage/storage";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { Avatar, BreadcrumbItem, Breadcrumbs, Card, Chip, DateInput, Input, Select, SelectedItems, SelectItem, Skeleton, Spinner, Textarea } from "@nextui-org/react";
import MP4Box from 'mp4box';
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import type { UploadVideo, User, Video } from "../../../types/types";

import "./video-upload.scss";

export default function VideoUpload({ }: {}) {

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    setFocus,
    trigger,
    formState: { errors },
  } = useForm<UploadVideo>({
    defaultValues: {
      // createdAt: new Date(),
      uploadedAt: new Date(),
      participants: [],
    }
  })
  const onSubmit: SubmitHandler<UploadVideo> = async (data) => {
    console.log("errors: ", errors);

    // const result = await trigger(); // Trigger validation on all fields

    // if (!result) {
    //     // Focus on the first field with an error if validation fails
    //     const firstErrorField = Object.keys(errors)[0];
    //     setFocus(firstErrorField);
    //     return;
    // }

    // TODO: move this to server side? since its okay to just have the ID's on the client
    // participants should be User[] but form return a string
    // const selectedUsers = (data.participants.split(",")).map((id: string) =>
    //   users.find((user) => user.id === parseInt(id))
    // );
    // data.participants = selectedUsers;

    // console.log('Selected users:', selectedUsers);
    console.log("data: ", data);

    // Use FormData to send the file
    const formData = new FormData();
    if (preview) {
      formData.append('video', preview);
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log(result.message);
    } else {
      console.error('File upload failed');
    }

  }

  const [preview, setPreview] = useState<File | null>(null);
  const [fileAsBlob, setFileAsBlob] = useState<Blob | null>(null);
  const [creationDate, setCreationDate] = useState<Date | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getAllUsers().then((users) => {
      setUsers(users);
    });
    // TODO: other option?
    if (creationDate) {
      setValue('createdAt', creationDate);
    }
  }, [creationDate, setValue]);

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
          if (info.created.toLocaleDateString() === "1/1/1904") {
            console.log("wrong creation Date!");
            setCreationDate(new Date(file.lastModified));
          }
          else {
            console.log("not wrong");
            setCreationDate(info.created);
          }
          console.log("creationDate: ", info.created);
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
      setFileAsBlob(file);
      getCreationDate(file);
      console.log("file: ", file);
    }
    // TODO: try to optimize
    if (creationDate != null) {
      console.log("---- not null ----");
      setValue("createdAt", creationDate);
    }
  };

  return (
    <div>

      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/videos">Videos</BreadcrumbItem>
        <BreadcrumbItem href="">Upload</BreadcrumbItem>
      </Breadcrumbs>

      <h1>Upload your Video here:</h1>


      <small>Preview (select file first)</small>
      <Card className="w-[200px] space-y-5 p-4" radius="lg">
        <Skeleton>
          <div style={{ width: "250px", height: "250px" }}>

          </div>
        </Skeleton>
      </Card>

      {preview !== null ? (
        <div>
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

      <form onSubmit={handleSubmit(onSubmit)}>

        <div className="form-grid">

          <div className="form-item half-width">
            <div className="fileUpload">
              <Input type="file" variant="bordered" label="Upload File" isRequired isInvalid={!!errors.video} aria-invalid={!!errors.video} errorMessage={"Please submit a Video!"}
                accept="video/*" {...register("video", { required: true, onChange: (e) => handleFileChange(e) })} />
            </div>
          </div>

          <div className="form-item half-width">
            <div className="title">
              <Input type="text" tabIndex={1} aria-invalid={!!errors.title}
                isRequired isClearable label="Title" variant="bordered" labelPlacement="inside" className="max-w"
                isInvalid={!!errors.title} errorMessage="Please enter a valid Title!" placeholder="Enter your Title"
                {...register("title", { required: true })}
              />
            </div>
          </div>

          <div className="form-item full-width">
            <div className="description">
              <Textarea
                {...register("description")}
                label="Description"
                placeholder="Enter your description"
                variant="bordered"
                className="max-w"
                maxLength={255}
                maxRows={4}
                minRows={3}
              />
            </div>
          </div>

          <div className="form-item half-width">
            <div className="uploadedBy">
              <Select
                isRequired
                {...register("uploadedBy", {
                  required: "Please select a User",
                }
                )}
                isInvalid={!!errors.uploadedBy}
                errorMessage={"Please select a User!"}
                aria-invalid={!!errors.uploadedBy}
                items={users}
                label="Uploaded By"
                placeholder="Select a user"
                labelPlacement="inside"
                variant="bordered"
                classNames={{
                  base: "max-w-md",
                  trigger: "h-16",
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
          </div>

          <div className="form-item half-width">
            <div className="participants">
              <Select
                {...register("participants", {
                  required: "Participants are required",
                })}
                isRequired
                isInvalid={!!errors.participants}
                errorMessage={"Please select atleast one Participant!"}
                aria-invalid={!!errors.participants}
                items={users}
                label="Participants"
                variant="bordered"
                isMultiline={true}
                labelPlacement="inside"
                selectionMode="multiple"
                placeholder="Select occurring users"

                classNames={{
                  base: "max-w-md",
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
          </div>

          <div className="form-item half-width">
            <div className="uploadedAt">
              <Controller
                name="uploadedAt"
                control={control}
                rules={{
                  required: true,
                }}
                render={({ field }) => (
                  <DateInput
                    isRequired
                    isReadOnly
                    isInvalid={!!errors.uploadedAt}
                    errorMessage={"Please select the current Date"}
                    aria-invalid={!!errors.uploadedAt}
                    label="Uploaded At"
                    variant="bordered"
                    className="max-w-md"
                    defaultValue={fromDate(field.value, getLocalTimeZone())}
                  />
                )}
              />
            </div>
          </div>

          <div className="form-item half-width">
            <div className="createdAt">
              <Controller
                name="createdAt"
                control={control}
                rules={{
                  required: true,
                }}
                defaultValue={creationDate ? creationDate : undefined}
                render={({ field }) => (
                  <DateInput
                    isRequired
                    isReadOnly
                    isInvalid={!!errors.createdAt}
                    errorMessage={"Please insert the Creation Date of that File!"}
                    aria-invalid={!!errors.createdAt}
                    label="Created At"
                    variant="bordered"
                    value={creationDate ? fromDate(creationDate, getLocalTimeZone()) : null}
                    onChange={field.onChange}
                    className="max-w-md"
                  />
                )}
              />
            </div>
          </div>
        </div>

        <input type="submit" onClick={() => { trigger() }} />
      </form>

      <span>created at value: {JSON.stringify(watch("createdAt"))}</span>

      <pre>{JSON.stringify(errors, (key, value) => {
        if (key === "ref") return undefined; // Exclude the circular ref key
        return value;
      }, 2)}</pre>

    </div>
  );
}

