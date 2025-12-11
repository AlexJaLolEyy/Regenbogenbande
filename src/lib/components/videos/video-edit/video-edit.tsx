"use client";

import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { Input, Select, SelectedItems, Chip, SelectItem, Avatar, Textarea, DateInput, BreadcrumbItem, Breadcrumbs, Button, Tooltip } from "@heroui/react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { UploadVideo, User, Video } from "../../../types/types"
import { getAllUsers } from "@/src/app/current-storage/storage";
import { useEffect, useState } from "react";
// import MP4Box from 'mp4box'; // Commented out for now; see below for mp4box usage
import "./video-edit.scss";
import { parseUploadVideoToBackend } from "@/src/app/(content)/videos/(detail)/[id]/edit/actions";
import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/* TODO: refactor this component and add missing features
      -> thumbnail creation.. online cutting.. date update on file input.. 
            submit with only 1 participant.. */

export default function VideoEdit({ video }: { video: Video }) {

    const {
        register,
        handleSubmit,
        watch,
        trigger,
        control,
        formState: { errors },
    } = useForm<UploadVideo>({
        defaultValues: {
            title: video.title,
            description: video.description,
            id: video.id,
            createdAt: video.createdAt,
            uploadedAt: video.uploadedAt,
            uploadedBy: video.uploadedBy,
            participants: video.participants,
            metadata: video.metadata,
            video: undefined
        }
    })

    const onSubmit: SubmitHandler<UploadVideo> = (data) => {

        // important if user open the input after already selecting a new video and then discards the input
        if (preview) {
            data.video = preview;
        }

        console.log('Selected users:', data.participants);
        console.log("data: ", data);

        parseUploadVideoToBackend(data);
    }

    const [preview] = useState<File | null>(null);
    const [creationDate] = useState<Date | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        console.log("input: ", video);
        console.log("keys: ", video.participants.map((user) => user.id));


        getAllUsers().then((users) => {
            setUsers(users);
        });
        // TODO: other option?
        // if (creationDate) {
        //   setValue('createdAt', creationDate);
        // }
    }, []);

    // TODO: outsource into helper function bc of multiple usage
    // This is commented out for now, but can be reused for upload or future features.
    /*
    const getCreationDate = (file: File) => {
        if (file) {
            const fileReader = new FileReader();
            fileReader.readAsArrayBuffer(file);
            fileReader.addEventListener("load", () => {
                const buffer = fileReader.result as ArrayBuffer;
                (buffer as any).fileStart = 0;
                const mp4boxFile = MP4Box.createFile();
                mp4boxFile.onError = console.error;
                mp4boxFile.onReady = function (info) {
                    if (info.created.toLocaleDateString() === "1/1/1904") {
                        setCreationDate(new Date(file.lastModified));
                    } else {
                        setCreationDate(info.created);
                    }
                };
                mp4boxFile.appendBuffer(buffer);
                mp4boxFile.flush();
            })
        }
    }
    */

    return (
        <div className="pt-20 px-4 max-w-7xl mx-auto">
            <Breadcrumbs className="mb-6">
                <BreadcrumbItem href="/">Home</BreadcrumbItem>
                <BreadcrumbItem href="/videos">Videos</BreadcrumbItem>
                <BreadcrumbItem href="">Edit</BreadcrumbItem>
            </Breadcrumbs>

            <h1 className="text-2xl font-bold mb-4">Edit your Video here:</h1>

            <div className="mb-8">
                {preview ? (
                    <video className="w-full aspect-video rounded-lg bg-black" controls key={preview.name}>
                        <source src={URL.createObjectURL(preview)} type="video/mp4" />
                    </video>
                ) :
                    <video className="w-full aspect-video rounded-lg bg-black" controls>
                        <source src={video.video} type="video/mp4"></source>
                        Video cant be displayed due to error...
                    </video>}
            </div>

            <div className="mb-6">
                {creationDate != null ? (
                    <p className="text-sm text-default-500">Creation Date: {creationDate.toLocaleDateString()}</p>
                ) : <span className="text-sm text-default-500">No creation date found!</span>}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white/10 dark:bg-black/30 rounded-2xl p-8 backdrop-blur-lg shadow-xl border border-white/10 dark:border-black/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="mb-2">
                            <label className="block text-sm font-medium text-default-500 mb-1">Video File</label>
                            <Tooltip content="Changing the video file is not recommended. Most platforms do not allow this.">
                                <span>
                                    <Input
                                        type="file"
                                        variant="bordered"
                                        className="w-full cursor-not-allowed opacity-60"
                                        accept="video/*"
                                        disabled
                                        // {...register("video", { required: false, onChange: (e) => handleFileChange(e) })}
                                    />
                                </span>
                            </Tooltip>
                            <p className="text-xs text-warning-500 mt-1">Changing the video file after upload is not recommended and is currently disabled.</p>
                        </div>
                        <Tooltip content="Edit the video title">
                            <Input type="text" isRequired isClearable label="Title" variant="bordered" labelPlacement="inside" className="w-full"
                                isInvalid={!!errors.title} aria-invalid={!!errors.title}
                                errorMessage={"Please enter a valid Title!"} placeholder="Enter your Title"
                                {...register("title", { required: true })}
                            />
                        </Tooltip>
                        <Tooltip content="Edit the video description">
                            <Textarea
                                {...register("description")}
                                label="Description"
                                placeholder="Enter your description"
                                variant="bordered"
                                className="w-full"
                                maxLength={255}
                                maxRows={4}
                                minRows={3}
                            />
                        </Tooltip>
                    </div>
                    <div className="flex flex-col gap-4 border-l border-default-700/20 pl-8">
                        <div className="flex flex-col gap-1">
                            <label className="block text-sm font-medium text-default-500 mb-1">Uploaded By</label>
                            <div className="flex items-center gap-3 bg-content2/60 border border-content2/30 rounded-lg px-4 py-3 min-h-[56px]">
                                <Avatar
                                    alt={video.uploadedBy.username}
                                    size="sm"
                                    src={video.uploadedBy.profilepicture}
                                />
                                <span className="font-medium text-default-900 dark:text-default-900">{video.uploadedBy.username}</span>
                            </div>
                        </div>
                        <Tooltip content="Edit participants">
                            <Select
                                {...register("participants", {
                                    required: true,
                                })}
                                isRequired
                                isInvalid={!!errors.participants}
                                aria-invalid={!!errors.participants}
                                errorMessage={"Please select at least one Participant!"}
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
                                defaultSelectedKeys={(video.participants.map((user) => user.id)).toString()}
                                renderValue={(items: SelectedItems<User>) => {
                                    return (
                                        <div className="flex flex-wrap gap-2">
                                            {items.map((item) => (
                                                item.data ? <Chip key={item.key}>{item.data.username}</Chip> : null
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
                        </Tooltip>
                        <Tooltip content="Upload date (read-only)">
                            <Controller
                                name="uploadedAt"
                                control={control}
                                rules={{
                                    required: true,
                                }}
                                render={() => (
                                    <DateInput
                                        isRequired
                                        isReadOnly
                                        isInvalid={!!errors.uploadedAt}
                                        errorMessage={"Please insert Upload Date!"}
                                        aria-invalid={!!errors.uploadedAt}
                                        label="Uploaded At"
                                        variant="bordered"
                                        className="w-full"
                                        defaultValue={fromDate(new Date(video.uploadedAt), getLocalTimeZone())}
                                    />
                                )}
                            />
                        </Tooltip>
                        <Tooltip content="Creation date (read-only)">
                            <Controller
                                name="createdAt"
                                control={control}
                                rules={{
                                    required: true,
                                }}
                                render={() => (
                                    <DateInput
                                        isRequired
                                        isReadOnly
                                        isInvalid={!!errors.createdAt}
                                        aria-invalid={!!errors.createdAt}
                                        errorMessage={"Please insert the Date of Creation!"}
                                        label="Created At"
                                        variant="bordered"
                                        value={creationDate ? fromDate(creationDate, getLocalTimeZone()) : fromDate(new Date(video.createdAt), getLocalTimeZone())}
                                        defaultValue={fromDate(new Date(video.createdAt), getLocalTimeZone())}
                                        className="w-full"
                                    />
                                )}
                            />
                        </Tooltip>
                    </div>
                </div>
                <div className="mt-8 border-t border-default-700/20 pt-6 flex flex-col gap-2">
                    <span className="text-xs text-default-400">created at value: {JSON.stringify(watch("createdAt"))}</span>
                    <pre className="text-xs text-default-400 bg-black/10 rounded p-2 overflow-x-auto">{JSON.stringify(errors, (key, value) => {
                        if (key === "ref") return undefined; // Exclude the circular ref key
                        return value;
                    }, 2)}</pre>
                </div>
                <div className="mt-6 flex justify-end">
                    <Button
                        type="submit"
                        color="success"
                        variant="bordered"
                        startContent={<FontAwesomeIcon icon={faArrowUpFromBracket} />}
                        onClick={() => { trigger() }}
                        className="transition-transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                    >
                        Submit
                    </Button>
                </div>
            </form>
        </div>
    )
}