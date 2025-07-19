"use client"

import { getAllUsers } from "@/src/app/current-storage/storage";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { Avatar, BreadcrumbItem, Breadcrumbs, Button, Card, Chip, DateInput, Input, Select, SelectedItems, SelectItem, Textarea, Checkbox } from "@heroui/react";
import { createFile } from 'mp4box';
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import type { UploadVideo, User } from "../../../types/types";

import { faArrowUpFromBracket, faClock, faFileVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function VideoUpload() {

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<UploadVideo>({
    defaultValues: {
      uploadedAt: new Date(),
      participants: [],
    }
  })

  const [preview, setPreview] = useState<File | null>(null);
  const [creationDate, setCreationDate] = useState<Date | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [manualDateOverride, setManualDateOverride] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration?: number;
    size?: string;
    resolution?: string;
  }>({});

  useEffect(() => {
    getAllUsers().then((users) => {
      setUsers(users);
    });
    if (creationDate && !manualDateOverride) {
      setValue('createdAt', creationDate);
    }
  }, [creationDate, setValue, manualDateOverride]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCreationDate = (file: File) => {
    if (file) {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);

      fileReader.addEventListener("load", () => {
        const buffer = fileReader.result as ArrayBuffer;

        const mp4boxBuffer = buffer as ArrayBuffer & { fileStart: number };
        mp4boxBuffer.fileStart = 0;

        const mp4boxFile = createFile();
        mp4boxFile.onError = console.error;
        mp4boxFile.onReady = function (info) {
          console.log(info);
          // More robust fallback: check for default, invalid, or unreasonably old dates
          const defaultDate = new Date(1904, 0, 1); // January 1, 1904
          const isDefaultDate = info.created.getTime() === defaultDate.getTime();
          const isInvalidDate = isNaN(info.created.getTime());
          const isTooOld = info.created.getFullYear() < 1990; // Reasonable minimum year

          if (isDefaultDate || isInvalidDate || isTooOld) {
            console.log("Invalid or default creation date detected, using file's last modified date");
            setCreationDate(new Date(file.lastModified));
          } else {
            console.log("Using extracted creation date from video metadata");
            setCreationDate(info.created);
          }
          console.log("Final creationDate:", isDefaultDate || isInvalidDate || isTooOld ? new Date(file.lastModified) : info.created);
        };
        mp4boxFile.appendBuffer(mp4boxBuffer);
        mp4boxFile.flush();
      })
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreview(file);
      getCreationDate(file);
      
      // Extract video metadata
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoMetadata({
          duration: video.duration,
          size: formatFileSize(file.size),
          resolution: `${video.videoWidth}x${video.videoHeight}`
        });
      };
      video.src = URL.createObjectURL(file);
      
      console.log("file: ", file);
    }
  };

  const onSubmit: SubmitHandler<UploadVideo> = async (data) => {
    console.log("errors: ", errors);
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/videos">Videos</BreadcrumbItem>
        <BreadcrumbItem href="">Upload</BreadcrumbItem>
      </Breadcrumbs>

      <div className="flex items-center gap-3">
        <FontAwesomeIcon icon={faFileVideo} className="text-2xl text-primary" />
        <h1 className="text-3xl font-bold">Upload Video</h1>
      </div>

      {/* Enhanced Video Preview */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Video Preview</h2>
        
        {!preview ? (
          <div className="flex justify-center">
            <Card className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 p-8">
              <div className="text-center space-y-4">
                <FontAwesomeIcon icon={faFileVideo} className="text-4xl text-gray-400" />
                <p className="text-gray-500">Select a video file to preview</p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col items-center">
            <Card className="w-full overflow-hidden shadow-lg">
              <video 
                className="w-full h-auto rounded-t-lg" 
                controls 
                key={preview.name}
                poster={URL.createObjectURL(preview)}
              >
                <source src={URL.createObjectURL(preview)} type="video/mp4" />
              </video>
              
              {/* Video Metadata */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center justify-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faClock} className="text-blue-500 text-lg" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{videoMetadata.duration ? formatDuration(videoMetadata.duration) : 'Loading...'}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Duration</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faFileVideo} className="text-green-500 text-lg" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{videoMetadata.size}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">File Size</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faFileVideo} className="text-purple-500 text-lg" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{videoMetadata.resolution || 'Loading...'}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Resolution</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faClock} className="text-orange-500 text-lg" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {creationDate ? creationDate.toLocaleDateString() : 'Not detected'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Created</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Upload */}
          <div className="md:col-span-2">
            <Input 
              type="file" 
              variant="bordered" 
              label="Upload Video File" 
              isRequired 
              isInvalid={!!errors.video} 
              aria-invalid={!!errors.video} 
              errorMessage={"Please submit a Video!"}
              accept="video/*" 
              {...register("video", { required: true, onChange: (e) => handleFileChange(e) })} 
            />
          </div>

          {/* Title */}
          <div className="md:col-span-2">
            <Input 
              type="text" 
              tabIndex={1} 
              aria-invalid={!!errors.title}
              isRequired 
              isClearable 
              label="Title" 
              variant="bordered" 
              labelPlacement="inside" 
              isInvalid={!!errors.title} 
              errorMessage="Please enter a valid Title!" 
              placeholder="Enter your Title"
              {...register("title", { required: true })}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Textarea
              {...register("description")}
              label="Description"
              placeholder="Enter your description"
              variant="bordered"
              maxLength={255}
              maxRows={4}
              minRows={3}
            />
          </div>

          {/* Uploaded By */}
          <div>
            <Select
              isRequired
              {...register("uploadedBy", {
                required: "Please select a User",
              })}
              isInvalid={!!errors.uploadedBy}
              errorMessage={"Please select a User!"}
              aria-invalid={!!errors.uploadedBy}
              items={users}
              label="Uploaded By"
              placeholder="Select a user"
              labelPlacement="inside"
              variant="bordered"
              classNames={{
                base: "w-full",
                trigger: "h-14",
              }}
              renderValue={(items: SelectedItems<User>) => {
                return items.map((item) => (
                  item.data ? (
                    <div key={item.key} className="flex items-center gap-2">
                      <Avatar
                        alt={item.data?.username}
                        className="flex-shrink-0"
                        size="sm"
                        src={item.data?.profilepicture}
                      />
                      <span className="text-sm">{item.data?.username}</span>
                    </div>
                  ) : null
                ));
              }}
            >
              {(user) => (
                <SelectItem key={user.id} textValue={user.username}>
                  <div className="flex gap-2 items-center">
                    <Avatar alt={user.username} className="flex-shrink-0" size="sm" src={user.profilepicture} />
                    <span className="text-small">{user.username}</span>
                  </div>
                </SelectItem>
              )}
            </Select>
          </div>

          {/* Participants */}
          <div>
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
                base: "w-full",
                trigger: "min-h-12 py-2",
              }}
              renderValue={(items: SelectedItems<User>) => {
                return (
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      item.data ? <Chip key={item.key} size="sm">{item.data?.username}</Chip> : null
                    ))}
                  </div>
                );
              }}
            >
              {(user) => (
                <SelectItem key={user.id} textValue={user.username}>
                  <div className="flex gap-2 items-center">
                    <Avatar alt={user.username} className="flex-shrink-0" size="sm" src={user.profilepicture} />
                    <span className="text-small">{user.username}</span>
                  </div>
                </SelectItem>
              )}
            </Select>
          </div>

          {/* Uploaded At */}
          <div>
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
                  className="w-full"
                  defaultValue={fromDate(field.value, getLocalTimeZone())}
                />
              )}
            />
          </div>

          {/* Created At */}
          <div className="space-y-2">
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
                  isReadOnly={!manualDateOverride}
                  isInvalid={!!errors.createdAt}
                  errorMessage={"Please insert the Creation Date of that File!"}
                  aria-invalid={!!errors.createdAt}
                  label="Created At"
                  variant="bordered"
                  value={creationDate ? fromDate(creationDate, getLocalTimeZone()) : null}
                  onChange={field.onChange}
                  className="w-full"
                />
              )}
            />
            
            {/* Manual Date Override Checkbox */}
            <Checkbox
              isSelected={manualDateOverride}
              onValueChange={setManualDateOverride}
              size="sm"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">
                I know the original date and want to set it manually
              </span>
            </Checkbox>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button 
            type="submit" 
            color="primary" 
            size="lg"
            startContent={<FontAwesomeIcon icon={faArrowUpFromBracket} />}
            onClick={() => { trigger() }}
            className="px-8"
          >
            Upload Video
          </Button>
        </div>
      </form>

      {/* Debug Info - Keep for now */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Debug Info:</h3>
        <div className="text-xs space-y-1">
          <p>Created at value: {JSON.stringify(watch("createdAt"))}</p>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(errors, (key, value) => {
              if (key === "ref") return undefined;
              return value;
            }, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}


