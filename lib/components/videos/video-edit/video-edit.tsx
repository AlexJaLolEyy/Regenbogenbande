"use client";

import { fromDate, getLocalTimeZone, parseDate, parseZonedDateTime } from "@internationalized/date";
import { Input, Select, SelectedItems, Chip, SelectItem, Avatar, Textarea, DateInput, BreadcrumbItem, Breadcrumbs, Card, Skeleton, Spinner } from "@nextui-org/react";
import { watch } from "fs";
import { register } from "module";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { UploadVideo, User, Video } from "../../../types/types"
import { getAllUsers, getUserById } from "@/app/current-storage/storage";
import { useEffect, useState } from "react";
import MP4Box from 'mp4box';
import "./video-edit.scss";
import { parseUploadVideoToBackend } from "@/app/(content)/videos/(detail)/[id]/edit/actions";

/* TODO: refactor this component and add missing features
      -> thumbnail creation.. online cutting.. date update on file input.. 
            submit with only 1 participant.. */

export default function VideoEdit({ video }: { video: Video }) {

    const {
        register,
        handleSubmit,
        watch,
        control,
        setValue,
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

    const [preview, setPreview] = useState<File | null>(null);
    const [creationDate, setCreationDate] = useState<Date | null>(null);
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
        console.log("handleFileChange: ");
        const file = event.target.files?.[0];
        if (file) {
            setPreview(file);
            // getCreationDate(file);
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
                <BreadcrumbItem href="">Edit</BreadcrumbItem>
            </Breadcrumbs>

            <h1>Edit your Video here:</h1>

            {preview ? (
                <div>
                    <video width={"1024"} height={"576"} controls key={preview.name}>
                        <source src={URL.createObjectURL(preview)} type="video/mp4" />
                    </video>
                </div>
            ) :
                <video width="1280" height="720" controls>
                    <source src={video.video} type="video/mp4"></source>
                    Video cant be displayed due to error...
                </video>}

            {creationDate != null ? (
                <div>
                    <p>creationDate: {creationDate.toLocaleDateString()}</p>
                </div>
            ) : "No creation Date found!"}

            <form onSubmit={handleSubmit(onSubmit)}>

                <div className="form-grid">

                    <div className="form-item half-width">
                        <div className="fileUpload">
                            <Input type="file" variant="bordered" className="max-w"
                                accept="video/*"
                                {...register("video", { required: false, onChange: (e) => handleFileChange(e) })} />
                        </div>
                    </div>

                    <div className="form-item half-width">
                        <div className="title">
                            <Input type="text" isRequired isClearable label="Title" variant="bordered" labelPlacement="inside" className="max-w"
                                isInvalid={!!errors.title} aria-invalid={!!errors.title}
                                errorMessage={"Please enter a valid Title!"} placeholder="Enter your Title"
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
                                    required: true,
                                }
                                )}
                                items={users}
                                label="Uploaded By"
                                isInvalid={!!errors.uploadedBy}
                                aria-invalid={!!errors.uploadedBy}
                                errorMessage={"Please Select a User!"}
                                placeholder="Select a user"
                                labelPlacement="inside"
                                variant="bordered"
                                classNames={{
                                    base: "max-w-md",
                                    trigger: "h-16",
                                }}
                                defaultSelectedKeys={video.uploadedBy.id.toString()}
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
                                    required: true,
                                })}
                                isRequired
                                isInvalid={!!errors.participants}
                                aria-invalid={!!errors.participants}
                                errorMessage={"Please select atleast one Participant!"}
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
                                defaultSelectedKeys={(video.participants.map((user) => user.id)).toString()}
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
                                        errorMessage={"Please insert Upload Date!"}
                                        aria-invalid={!!errors.uploadedAt}
                                        label="Uploaded At"
                                        variant="bordered"
                                        className="max-w-md"
                                        defaultValue={fromDate(new Date(video.uploadedAt), getLocalTimeZone())}
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
                                render={({ field }) => (
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
                                        onChange={field.onChange}
                                        className="max-w-md"
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>

                <span>created at value: {JSON.stringify(watch("createdAt"))}</span>

                <pre>{JSON.stringify(errors, (key, value) => {
                    if (key === "ref") return undefined; // Exclude the circular ref key
                    return value;
                }, 2)}</pre>

                <input type="submit" />
            </form>

        </div>
    )
}