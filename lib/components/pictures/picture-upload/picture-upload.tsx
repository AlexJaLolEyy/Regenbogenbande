"use client"

import React, { useEffect } from "react";
import { useState } from "react"
import { Picture, User } from "../../../types/types"
import { Input, Textarea, User, DateInput, Select, SelectItem, Avatar, Chip, SelectedItems, CircularProgress, Skeleton, Image } from "@nextui-org/react";

import NextImage from "next/image";

import EXIF from 'exif-js';
import { getAllUsers } from "@/app/current-storage/storage";

export default function PictureUpload({ picture }: { picture?: Picture }
) {

    // TODO: add "accept" for videos and pictures

    const [preview, setPreview] = useState<File | null>(null);
    const [creationDate, setCreationDate] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        getAllUsers().then((users) => {
            setUsers(users);
        });
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // to prevent the bug of expecting picture without upload
        const file = event.target.files?.[0];

        if (file) {
            setPreview(file);
            const reader = new FileReader();

            reader.onload = () => {
                console.log("on load");
                const arrayBuffer = reader.result;
                if (arrayBuffer) {
                    console.log("arraybuffer is there")
                    EXIF.getData(arrayBuffer, function () {
                        const date = EXIF.getTag(this, 'DateTimeOriginal');
                        setCreationDate(date || 'No EXIF data found');
                    });
                }
                else {
                    console.log("no arraybuffer")
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            console.log('No file selected');
        }
    };


    const extractCreationDate = (event: React.ChangeEvent<HTMLInputElement>) => {

        const file = event.target.files?.[0];

        if (file && (file.type === "image/jpeg" || "image/jpg")) {
            // @ts-ignore: Ignore type checking for this line
            EXIF.getData(file, function () {
                const creationDate = EXIF.getTag(this, "DateTimeOriginal");
                if (creationDate) {
                    console.log("Creation Date:", creationDate);
                } else {
                    console.log("Creation date not found in EXIF data.");
                }
            });
        }
    };


    // TODO: add that you can only upload .png files (or any video formats) -> dont accept others
    return (
        <div>
            <p>You are currently at Picture-Upload!</p>

            <form>
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
                    <Input type="file" label="Upload File" onChange={handleFileChange} variant="bordered"
                        accept="image/*" />
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


                    {/* <label>Uploaded by:</label>
                    <User
                        name="Alex Ja Lol Eyy"
                        avatarProps={{
                            src: "/examplePictures/exampleThumbnail.jpg"
                        }}
                    /> */}
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
    )
}