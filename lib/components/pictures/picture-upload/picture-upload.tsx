"use client"

import React, { useEffect } from "react";
import { useState } from "react"
import { Picture, UploadPicture, UploadVideo, User } from "../../../types/types"
import { Input, Textarea, User, DateInput, Select, SelectItem, Avatar, Chip, SelectedItems, CircularProgress, Skeleton, Image } from "@nextui-org/react";

import NextImage from "next/image";

import EXIF from 'exif-js';
import { getAllUsers } from "@/app/current-storage/storage";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { fromDate, getLocalTimeZone } from "@internationalized/date";

export default function PictureUpload({ picture }: { picture?: Picture }) {

    const {
        register,
        handleSubmit,
        watch,
        control,
        setValue,
        formState: { errors },
    } = useForm<UploadPicture>({
        defaultValues: {
            // createdAt: new Date(),
            uploadedAt: new Date(),
            participants: [],
        }
    })
    const onSubmit: SubmitHandler<UploadPicture> = (data) => {
        console.log("errors: ", errors);

        console.log("data: ", data);
    }

    const [preview, setPreview] = useState<File | null>(null);
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            setPreview(file);
            // file could potentially have a creationDate
            if (file.type === "image/jpeg" || file.type === "image/jpg") {
                // @ts-ignore: Ignore type checking for this line
                EXIF.getData(file, function () {
                    const creationDate = EXIF.getTag(this, "DateTimeOriginal");
                    if (creationDate) {
                        const formattedDate = creationDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                        setCreationDate(new Date(formattedDate));
                    } else {
                        console.log("Creation date not found in EXIF data.");
                        setCreationDate(new Date(file.lastModified))
                    }
                });
            }
            else {
                setCreationDate(new Date(file.lastModified))
            }
        }
        console.log("creationdate: ", creationDate)
    };

    return (
        <div>
            <p>You are currently at Picture-Upload!</p>

            <form onSubmit={handleSubmit(onSubmit)}>
                <h3>Picture-Upload:</h3>
                <p>test: {preview?.type}</p>

                {preview !== null ?

                    <div className="picturePreview">
                        <label htmlFor="preview"></label>
                        <Image id="preview"
                            isZoomed
                            as={NextImage}
                            src={preview === null ? "" : URL.createObjectURL(preview)}
                            alt="preview could not be loaded"
                            width={"1024"} height={"576"}
                            className="video-player"
                        />
                    </div>
                    : ""}

                <div className="fileUpload">
                    <Input type="file" label="Upload File" variant="bordered"
                        accept="image/*" {...register("img", { required: true, onChange: (e) => handleFileChange(e) })} />
                </div>

                <div className="title">
                    <Input type="text" label="Title" variant="bordered"
                        isInvalid={false} errorMessage="Please enter a valid Title!"
                        {...register("title", { required: true })}
                    />
                </div>

                <div className="participants">
                    <Select
                        {...register("participants", {
                            required: true,
                        })}
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
                                        {/* <span className="text-tiny text-default-400">{user.email}</span> */}
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
                        {...register("description")}
                    />
                </div>

                <div className="uploadedBy">
                    <Select
                        {...register("uploadedBy", { required: true })}
                        isRequired
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
                                        {/* <span className="text-default-500 text-tiny">({item.data.email})</span> */}
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
                                        {/* <span className="text-tiny text-default-400">{user.email}</span> */}
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
                            required: true,
                        }}
                        render={({ field }) => (
                            <DateInput
                                isRequired
                                isReadOnly
                                label="Uploaded At"
                                variant="bordered"
                                className="max-w-sm"
                                defaultValue={fromDate(field.value, getLocalTimeZone())}
                            />
                        )}
                    />
                </div>

                {creationDate ? (
                    <div><p>creationDate: {creationDate.toLocaleDateString()}</p></div>
                ) : "no creation date"}

                <span>value: {JSON.stringify(watch("createdAt"))}</span>

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
                                label="Created At"
                                value={creationDate ? fromDate(creationDate, getLocalTimeZone()) : null}
                                onChange={field.onChange}
                                variant="bordered"
                                className="max-w-sm"
                            />
                        )}
                    />
                </div>

                <input type="submit" />

            </form>

        </div>
    )
}