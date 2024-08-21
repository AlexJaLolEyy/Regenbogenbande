"use client"

import { useState } from "react"
import { Picture } from "../../../types/types"
import { Input, Textarea } from "@nextui-org/react";

import EXIF from 'exif-js';

/* FIXME: bug: if picture selected via upload, then the upload is pressed again to select a new picture, 
 and you tab out of the select = boom */

export default function PictureUpload({ picture }: { picture?: Picture }
) {

    // TODO: add "accept" for videos and pictures

    const [preview, setPreview] = useState<File | null>(null);

    const [creationDate, setCreationDate] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("start");
        const file = event.target.files?.[0];

        if (file) {
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

            reader.readAsArrayBuffer(file); // Make sure you're using ArrayBuffer
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
            // TODO: remove later
            EXIF.getData(file, function () {
                var allMetaData = EXIF.getAllTags(this);
                console.log("all", allMetaData);
            });
        }
    };


    // TODO: add that you can only upload .png files (or any video formats) -> dont accept others
    return (
        <div>
            <p>You are currently at Picture-Upload!</p>

            <form>
                <h3>Picture-Upload:</h3>

                <div className="file">
                    <label htmlFor="file">Upload Picture here:</label>
                    <input type="file" id="file" onChange={extractCreationDate}></input>
                    <Input type="file" label="File" onChange={extractCreationDate} variant="bordered" />
                </div>

                <div className="title">
                    <Input type="text" label="Title" variant="bordered"
                        isInvalid={false} errorMessage="Please enter a valid Title!"
                    />
                </div>

                <div className="participants">
                    <Input type="text" label="Participants" variant="bordered"
                        isInvalid={false} errorMessage="Please enter valid Participants!"
                    />
                </div>

                <div className="description">
                    <Textarea
                        label="Description"
                        placeholder="Enter your description"
                        className="max-w-xs"
                    />
                </div>

                {preview?.type === "image/jpeg" || "image/png" || "image/webp" ?
                    <div className="picturePreview">
                        <label htmlFor="preview"></label>
                        <img id="preview"
                            src={preview === null ? "" : URL.createObjectURL(preview)}
                            alt="preview could not be loaded"
                            width={"300"} height={"300"} />
                    </div>
                    : ""}


                {/* export interface Picture {
                        title: string,
                        description?: string,
                        img: File, // or save as string?
                        id: number,
                        participants: User[],
                        uploadedBy: User,
                        uploadedAt: Date,
                        createdAt: Date,
                } */}

            </form>

        </div>
    )
}