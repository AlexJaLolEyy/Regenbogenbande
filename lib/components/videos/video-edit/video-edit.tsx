"use client";

import { fromDate, getLocalTimeZone, parseDate, parseZonedDateTime } from "@internationalized/date";
import { Input, Select, SelectedItems, Chip, SelectItem, Avatar, Textarea, DateInput } from "@nextui-org/react";
import { watch } from "fs";
import { register } from "module";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { UploadVideo, User, Video } from "../../../types/types"
import { getAllUsers } from "@/app/current-storage/storage";
import { useEffect, useState } from "react";

export default function VideoEdit({ video }: { video: Video }) {

    const {
        register,
        handleSubmit,
        watch,
        control,
        setValue,
        formState: { errors },
    } = useForm<Video>({
        defaultValues: {
            ...video,
            // dates appear as string in the model
            // createdAt: new Date(video.createdAt),
            // uploadedAt: new Date(video.uploadedAt),
        }
    })

    const onSubmit: SubmitHandler<Video> = (data) => {
        console.log("errors: ", errors);

        const selectedUsers = (data.participants.split(",")).map((id: string) =>
            users.find((user) => user.id === parseInt(id))
        );
        data.participants = selectedUsers;

        console.log('Selected users:', data.participants);
        console.log("data: ", data);
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("handleFileChange: ");
        const file = event.target.files?.[0];
        if (file) {
            setPreview(file);
        }
        // TODO: try to optimize
        if (creationDate != null) {
            console.log("---- not null ----");
            setValue("createdAt", creationDate);
        }
    };

    return (
        <div>
            <p>You are currently at Video-Edit!</p>

            <form onSubmit={handleSubmit(onSubmit)}>
                <h3>Video-Upload:</h3>

                {video.video && !preview ? (
                    <div>
                        <video width={"1024"} height={"576"} controls key={video.id}>
                            <source src={video.video} type="video/mp4" />
                        </video>
                    </div>
                ) : "Preview could not be loaded."}

                {preview ? (
                    <div>
                        <video width={"1024"} height={"576"} controls key={video.id}>
                            <source src={URL.createObjectURL(preview)} type="video/mp4" />
                        </video>
                    </div>
                ) : "Preview could not be loaded."}

                {creationDate != null ? (
                    <div>
                        <p>creationDate: {creationDate.toLocaleDateString()}</p>
                    </div>
                ) : "No creation Date found!"}


                {/* TODO: fix error for file on submit "setState while rendering" */}
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

                <span>value: {JSON.stringify(watch("participants"))}</span>
                <div className="participants">
                    <Select
                        {...register("participants", {
                            required: true,
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
                        defaultSelectedKeys={(video.participants.map((user) => user.id)).toString()}
                        // selectedKeys={video.participants.map((user) => user.id)}
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

                <span>value: {JSON.stringify(watch("description"))}</span>

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

                <span>value: {JSON.stringify(watch("uploadedBy"))}</span>

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

                <span>value: {JSON.stringify(watch("uploadedAt"))}</span>

                <div className="uploadedAt">
                    <Controller
                        name="uploadedAt"
                        control={control}
                        rules={{
                            required: true,
                        }}
                        defaultValue={video.uploadedAt}
                        render={({ field }) => (
                            <DateInput
                                isRequired
                                label="Uploaded At"
                                variant="bordered"
                                className="max-w-sm"
                                defaultValue={fromDate(new Date(video.uploadedAt), getLocalTimeZone())}
                            />
                        )}
                    />
                </div>

                <span>value: {JSON.stringify(watch("createdAt"))}</span>

                <div className="createdAt">
                    <Controller
                        name="createdAt"
                        control={control}
                        rules={{
                            required: true,
                        }}
                        defaultValue={video.createdAt}
                        render={({ field }) => (
                            <DateInput
                                isRequired
                                label="Created At"
                                variant="bordered"
                                defaultValue={fromDate(new Date(video.createdAt), getLocalTimeZone())}
                                onChange={field.onChange}
                                className="max-w-sm"
                            />
                        )}
                    />
                </div>

                {errors ? (
                    <div><p>Errors: {JSON.stringify(errors)}</p></div>
                ) : "keine error"}

                <input type="submit" />
            </form>

        </div>
    )
}