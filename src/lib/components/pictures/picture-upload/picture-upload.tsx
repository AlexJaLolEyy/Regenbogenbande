"use client"

import { getAllUsers } from "@/app/current-storage/storage";
import { faCalendarPlus, faUser } from "@fortawesome/free-regular-svg-icons";
import { faArrowUpFromBracket, faInfo, faSignature, faUpload, faUsers, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { Avatar, BreadcrumbItem, Breadcrumbs, Button, Card, Chip, DateInput, Image, Input, Select, SelectedItems, SelectItem, Skeleton, Textarea } from "@heroui/react";
import EXIF from 'exif-js';
import NextImage from "next/image";
import React, { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { UploadPicture, User } from "../../../types/types";
import "./picture-upload.scss";

export default function PictureUpload({ }: {}) {

    const {
        register,
        handleSubmit,
        watch,
        control,
        setValue,
        trigger,
        formState: { errors },
    } = useForm<UploadPicture>({
        defaultValues: {
            uploadedAt: new Date(),
            participants: [],
        }
    })
    const onSubmit: SubmitHandler<UploadPicture> = (data) => {
        console.log("errors: ", errors);

        // TODO: implement addind new picture to file system

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
        // TODO: outsource into helper function bc of multiple usage
        if (file) {
            setPreview(file);
            // only those file types could potentially have a creationDate
            if (file.type === "image/jpeg" || file.type === "image/jpg") {
                // @ts-ignore: type any is fine here
                EXIF.getData(file, function () {
                    // @ts-ignore: type any is fine here
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
            <Breadcrumbs>
                <BreadcrumbItem href="/">Home</BreadcrumbItem>
                <BreadcrumbItem href="/pictures">Pictures</BreadcrumbItem>
                <BreadcrumbItem href="">Upload</BreadcrumbItem>
            </Breadcrumbs>

            <h1>Upload your Picture here:</h1>


            <small>Preview (select file first)</small>
            <Card className="w-[200px] space-y-5 p-4" radius="lg">
                <Skeleton>
                    <div style={{ maxWidth: "250px", height: "250px" }}>

                    </div>
                </Skeleton>
            </Card>

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

            {creationDate ? (
                <div><p>creationDate: {creationDate.toLocaleDateString()}</p></div>
            ) : "no creation date"}


            <form onSubmit={handleSubmit(onSubmit)}>

                <div className="form-grid">

                    <div className="form-item half-width">
                        <div className="fileUpload">
                            <Input type="file" label="Upload File" variant="bordered" isRequired isInvalid={!!errors.img}
                                aria-invalid={!!errors.img} errorMessage="Please submit a Picture!"
                                startContent={
                                    <FontAwesomeIcon icon={faVideo} />
                                }
                                accept="image/*" {...register("img", { required: true, onChange: (e) => handleFileChange(e) })} />
                        </div>
                    </div>

                    <div className="form-item half-width">
                        <div className="title">
                            <Input type="text" label="Title" variant="bordered" isRequired
                                isInvalid={!!errors.title} aria-invalid={!!errors.title} errorMessage="Please enter a valid Title!"
                                startContent={
                                    <FontAwesomeIcon icon={faSignature} />
                                }
                                {...register("title", { required: true })}
                            />
                        </div>
                    </div>

                    <div className="form-item full-width">
                        <div className="description">
                            <Textarea
                                label="Description"
                                placeholder="Enter your description"
                                variant="bordered"
                                className="max-w"
                                maxLength={255}
                                maxRows={4}
                                minRows={3}
                                startContent={
                                    <FontAwesomeIcon icon={faInfo} />
                                }
                                {...register("description")}
                            />
                        </div>
                    </div>



                    <div className="form-item half-width">
                        <div className="uploadedBy">
                            <Select
                                {...register("uploadedBy", { required: true })}
                                isRequired
                                isInvalid={!!errors.uploadedBy}
                                aria-invalid={!!errors.uploadedBy}
                                errorMessage={"Please select a User!"}
                                items={users}
                                label="Uploaded By"
                                placeholder="Select a user"
                                labelPlacement="inside"
                                variant="bordered"
                                startContent={
                                    <FontAwesomeIcon icon={faUser} />
                                }
                                classNames={{
                                    base: "max-w-md",
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
                    </div>

                    <div className="form-item half-width">
                        <div className="participants">
                            <Select
                                {...register("participants", {
                                    required: true,
                                })}
                                isRequired
                                aria-invalid={!!errors.participants}
                                isInvalid={!!errors.participants}
                                errorMessage={"Please select atleast one User!"}
                                items={users}
                                label="Participants"
                                variant="bordered"
                                isMultiline={true}
                                selectionMode="multiple"
                                placeholder="Select occurring users"
                                labelPlacement="inside"
                                startContent={
                                    <FontAwesomeIcon icon={faUsers} />
                                }
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
                                                {/* <span className="text-tiny text-default-400">{user.email}</span> */}
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
                                        isInvalid={!!errors.uploadedAt}
                                        aria-invalid={!!errors.uploadedAt}
                                        errorMessage={"Please provide a valid Date!"}
                                        isReadOnly
                                        startContent={
                                            <FontAwesomeIcon icon={faUpload} />
                                        }
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
                                render={({ field }) => (
                                    <DateInput
                                        isRequired
                                        isInvalid={!!errors.createdAt}
                                        aria-invalid={!!errors.createdAt}
                                        errorMessage={"Please provide a valid Date!"}
                                        isReadOnly
                                        startContent={
                                            <FontAwesomeIcon icon={faCalendarPlus} />
                                        }
                                        label="Created At"
                                        value={creationDate ? fromDate(creationDate, getLocalTimeZone()) : null}
                                        onChange={field.onChange}
                                        variant="bordered"
                                        className="max-w-md"
                                    />
                                )}
                            />
                        </div>
                    </div>

                </div>

                <Button type="submit" color="success" variant="bordered"
                    startContent={<FontAwesomeIcon icon={faArrowUpFromBracket} />}
                    onClick={() => { trigger() }}>
                    Submit
                </Button>

            </form>

            <span>value: {JSON.stringify(watch("createdAt"))}</span>
        </div>
    )
}