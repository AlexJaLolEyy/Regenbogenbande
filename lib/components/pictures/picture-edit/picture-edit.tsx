"use client"

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Picture, UploadPicture, User } from "../../../types/types"
import { faUser, faCalendarPlus } from "@fortawesome/free-regular-svg-icons";
import { faVideo, faSignature, faInfo, faUsers, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import NextImage from "next/image";
import { Breadcrumbs, BreadcrumbItem, Card, Skeleton, Input, Image, Textarea, Select, SelectedItems, Avatar, SelectItem, Chip, DateInput } from "@nextui-org/react";
import { getAllUsers } from "@/app/current-storage/storage";
import { useEffect, useState } from "react";
import EXIF from "exif-js";

export default function PictureEdit({ picture }: { picture: Picture }) {

    const {
        register,
        handleSubmit,
        watch,
        control,
        setValue,
        formState: { errors },
    } = useForm<UploadPicture>({
        // cant simply do {...picture} since img got a different type
        defaultValues: {
            title: picture.title,
            description: picture.title,
            id: picture.id,
            createdAt: picture.createdAt,
            uploadedAt: picture.uploadedAt,
            uploadedBy: picture.uploadedBy,
            participants: picture.participants,
            metadata: picture.metadata,
            img: undefined
        }
    })

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

    const onSubmit: SubmitHandler<UploadPicture> = (data) => {
        console.log("errors: ", errors);

        console.log("data: ", data);
    }

    return (
        <div>


            <div>
                <Breadcrumbs>
                    <BreadcrumbItem href="/">Home</BreadcrumbItem>
                    <BreadcrumbItem href="/pictures">Pictures</BreadcrumbItem>
                    <BreadcrumbItem href="">Edit</BreadcrumbItem>
                </Breadcrumbs>

                <h1>Edit your Picture!</h1>

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


                <form onSubmit={handleSubmit(onSubmit)}>

                    <div className="form-grid">

                        <div className="form-item half-width">
                            <div className="fileUpload">
                                <Input type="file" label="Upload File" variant="bordered" startContent={
                                    <FontAwesomeIcon icon={faVideo} />
                                }
                                    accept="image/*" {...register("img", { required: true, onChange: (e) => handleFileChange(e) })} />
                            </div>
                        </div>

                        <div className="form-item half-width">
                            <div className="title">
                                <Input type="text" label="Title" variant="bordered"
                                    isInvalid={false} errorMessage="Please enter a valid Title!"
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

                    <input type="submit" />

                </form>

            </div>
        </div>
    )
}