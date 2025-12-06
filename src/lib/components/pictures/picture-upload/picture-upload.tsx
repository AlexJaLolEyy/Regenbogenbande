"use client"

import { getAllUsers } from "@/src/app/current-storage/storage";
import { faCalendarPlus, faUser } from "@fortawesome/free-regular-svg-icons";
import { faArrowUpFromBracket, faInfo, faSignature, faUpload, faUsers, faImage, faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import { Avatar, BreadcrumbItem, Breadcrumbs, Button, Card, Chip, DateInput, Image, Input, Select, SelectedItems, SelectItem, Textarea, Checkbox } from "@heroui/react";
import EXIF from 'exif-js';
import NextImage from "next/image";
import React, { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { UploadPicture, User } from "../../../types/types";

export default function PictureUpload() {

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

    const [preview, setPreview] = useState<File | null>(null);
    const [creationDate, setCreationDate] = useState<Date | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [manualDateOverride, setManualDateOverride] = useState(false);
    const [optimizeImage, setOptimizeImage] = useState(true);
    const [uploadStats, setUploadStats] = useState<{
        originalSize?: string;
        finalSize?: string;
        sizeReduction?: string;
    }>({});
    const [imageMetadata, setImageMetadata] = useState<{
        size?: string;
        resolution?: string;
        format?: string;
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

    const onSubmit: SubmitHandler<UploadPicture> = async (data) => {
        console.log("errors: ", errors);
        console.log("data: ", data);

        if (!preview) {
            console.error("No image file selected");
            return;
        }

        try {
            // Use FormData to send the file
            const formData = new FormData();
            formData.append('image', preview);
            formData.append('optimize', optimizeImage.toString());
            formData.append('title', data.title); // Pass title for filename generation

            const uploadResponse = await fetch('/api/upload-picture', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                console.error('Image upload failed:', errorData);
                return;
            }

            const uploadResult = await uploadResponse.json();
            console.log('Upload result:', uploadResult);

            // Display optimization stats if available
            if (uploadResult.originalSize && uploadResult.finalSize) {
                setUploadStats({
                    originalSize: formatFileSize(uploadResult.originalSize),
                    finalSize: formatFileSize(uploadResult.finalSize),
                    sizeReduction: formatFileSize(uploadResult.sizeReduction || 0),
                });
            }

            // Get image path from API response
            const imagePath = uploadResult.path || `/examplePictures/${preview.name}`;

            // Strip File object from data before sending to Server Action
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { img, ...metadata } = data;
            const pictureData = {
                ...metadata,
                id: 0, // Will be auto-generated
            };

            // Import createPicture dynamically to avoid issues
            const { createPicture } = await import('@/src/app/(content)/pictures/(detail)/upload/actions');
            await createPicture(pictureData, imagePath);
        } catch (error: unknown) {
            // NEXT_REDIRECT is expected behavior from redirect() in Server Actions
            if (error && typeof error === 'object' && 'digest' in error) {
                const digest = (error as { digest?: string }).digest;
                if (digest?.startsWith('NEXT_REDIRECT')) {
                    // This is expected - redirect() throws this error
                    return;
                }
            }
            console.error('Picture upload error:', error);
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setPreview(file);
            
            // Extract basic metadata first
            setImageMetadata({
                size: formatFileSize(file.size),
                format: file.type.split('/')[1].toUpperCase(),
            });

            // Extract creation date from EXIF (only for JPEG/JPG) - KEEP ORIGINAL LOGIC
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
            } else {
                console.log("File format doesn't support EXIF data, using file modification date");
                setCreationDate(new Date(file.lastModified))
            }

            // Get resolution separately after EXIF extraction
            const img = new window.Image();
            img.onload = () => {
                setImageMetadata(prev => ({
                    ...prev,
                    resolution: `${img.width}x${img.height}`
                }));
            };
            img.src = URL.createObjectURL(file);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <Breadcrumbs>
                <BreadcrumbItem href="/">Home</BreadcrumbItem>
                <BreadcrumbItem href="/pictures">Pictures</BreadcrumbItem>
                <BreadcrumbItem href="">Upload</BreadcrumbItem>
            </Breadcrumbs>

            <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faImage} className="text-2xl text-primary" />
                <h1 className="text-3xl font-bold">Upload Picture</h1>
            </div>

            {/* Enhanced Image Preview */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Image Preview</h2>
                
                {!preview ? (
                    <div className="flex justify-center">
                        <Card className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 p-8">
                            <div className="text-center space-y-4">
                                <FontAwesomeIcon icon={faImage} className="text-4xl text-gray-400" />
                                <p className="text-gray-500">Select an image file to preview</p>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-4 flex flex-col items-center">
                        <Card className="w-full overflow-hidden shadow-lg">
                            <div className="relative w-full h-[500px] bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                <div className="w-full h-full flex items-center justify-center">
                                    <Image
                                        isZoomed
                                        as={NextImage}
                                        src={URL.createObjectURL(preview)}
                                        alt="Image preview"
                                        width={1024}
                                        height={576}
                                        className="object-contain"
                                        style={{ 
                                            width: 'auto',
                                            maxWidth: '100%'
                                        }}
                                    />
                                </div>
                            </div>
                            
                            {/* Image Metadata */}
                            <div className="p-6 bg-gray-50 dark:bg-gray-800">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                    <div className="flex items-center justify-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                        <FontAwesomeIcon icon={faImage} className="text-blue-500 text-lg" />
                                        <div className="text-center">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100">{imageMetadata.format || 'Loading...'}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Format</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                        <FontAwesomeIcon icon={faImage} className="text-green-500 text-lg" />
                                        <div className="text-center">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100">{imageMetadata.size}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">File Size</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                        <FontAwesomeIcon icon={faImage} className="text-purple-500 text-lg" />
                                        <div className="text-center">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100">{imageMetadata.resolution || 'Loading...'}</div>
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
                            label="Upload Image File" 
                            variant="bordered" 
                            isRequired 
                            isInvalid={!!errors.img} 
                            aria-invalid={!!errors.img} 
                            errorMessage="Please submit a Picture!"
                            startContent={<FontAwesomeIcon icon={faImage} />}
                            accept="image/*" 
                            {...register("img", { required: true, onChange: (e) => handleFileChange(e) })} 
                        />
                    </div>

                    {/* Optimization Toggle */}
                    <div className="md:col-span-2">
                        <Checkbox
                            isSelected={optimizeImage}
                            onValueChange={setOptimizeImage}
                            size="md"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Optimize Image</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Automatically compress large images (&gt;1MB) and convert PNG to WebP for better compression
                                </span>
                            </div>
                        </Checkbox>
                    </div>

                    {/* Upload Stats */}
                    {uploadStats.originalSize && uploadStats.finalSize && (
                        <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="text-sm font-semibold mb-2 text-green-800 dark:text-green-200">
                                Optimization Results
                            </h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">Original Size</div>
                                    <div className="font-semibold">{uploadStats.originalSize}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">Final Size</div>
                                    <div className="font-semibold text-green-600 dark:text-green-400">{uploadStats.finalSize}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600 dark:text-gray-400">Saved</div>
                                    <div className="font-semibold text-green-600 dark:text-green-400">{uploadStats.sizeReduction}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div className="md:col-span-2">
                        <Input 
                            type="text" 
                            label="Title" 
                            variant="bordered" 
                            isRequired
                            isInvalid={!!errors.title} 
                            aria-invalid={!!errors.title} 
                            errorMessage="Please enter a valid Title!"
                            startContent={<FontAwesomeIcon icon={faSignature} />}
                            {...register("title", { required: true })}
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <Textarea
                            label="Description"
                            placeholder="Enter your description"
                            variant="bordered"
                            maxLength={255}
                            maxRows={4}
                            minRows={3}
                            startContent={<FontAwesomeIcon icon={faInfo} />}
                            {...register("description")}
                        />
                    </div>

                    {/* Uploaded By */}
                    <div>
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
                            startContent={<FontAwesomeIcon icon={faUser} />}
                            classNames={{
                                base: "w-full",
                                trigger: "h-14",
                            }}
                            renderValue={(items: SelectedItems<User>) => {
                                return items.map((item) => (
                                    item.data ? (
                                        <div key={item.key} className="flex items-center gap-2">
                                            <Avatar
                                                alt={item.data.username}
                                                className="flex-shrink-0"
                                                size="sm"
                                                src={item.data?.profilepicture}
                                            />
                                            <span className="text-sm">{item.data.username}</span>
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
                            startContent={<FontAwesomeIcon icon={faUsers} />}
                            classNames={{
                                base: "w-full",
                                trigger: "min-h-12 py-2",
                            }}
                            renderValue={(items: SelectedItems<User>) => {
                                return (
                                    <div className="flex flex-wrap gap-2">
                                        {items.map((item) => (
                                            item.data ? <Chip key={item.key} size="sm">{item.data.username}</Chip> : null
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
                                    isInvalid={!!errors.uploadedAt}
                                    aria-invalid={!!errors.uploadedAt}
                                    errorMessage={"Please provide a valid Date!"}
                                    isReadOnly
                                    startContent={<FontAwesomeIcon icon={faUpload} />}
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
                                    aria-invalid={!!errors.createdAt}
                                    errorMessage={"Please provide a valid Date!"}
                                    startContent={<FontAwesomeIcon icon={faCalendarPlus} />}
                                    label="Created At"
                                    value={creationDate ? fromDate(creationDate, getLocalTimeZone()) : null}
                                    onChange={field.onChange}
                                    variant="bordered"
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
                        Upload Picture
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
    )
}