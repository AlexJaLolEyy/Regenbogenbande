'use server'

import { Picture, Quote, User, Video } from "@/lib/types/types";
import fs from 'fs';


export async function getExampleVideos(): Promise<Video[]> {

    const user1: User = {
        username: "ObiWan",
        password: "Highground",
        profilepicture: "https://nextui.org/images/album-cover.png",
        id: 34
    }
    const user2: User = {
        username: "General Grievous",
        password: "spider",
        profilepicture: "https://nextui.org/images/hero-card-complete.jpeg",
        id: 35
    }

    function bufferToFile(buffer: Buffer, filename: string, mimeType: string): File {
        const blob = new Blob([buffer], { type: mimeType });
        return new File([blob], filename, { type: mimeType });
    }

    const buffer1 = fs.readFileSync("./app/current-storage/exampleVideos/beispielV1.mp4");
    const file1 = bufferToFile(buffer1, "beispielV1.mp4", 'video/mp4');

    console.log("buffer1: ", file1);

    const buffer2 = fs.readFileSync("./app/current-storage/exampleVideos/beispielV2.mp4");
    const file2 = bufferToFile(buffer2, "beispielV2.mp4", 'video/mp4');

    console.log("buffer2: ", file2);

    const video1: Video = {
        title: "beispiel 1",
        description: "beispiel video 1",
        video: file1,
        thumbnail: file1,
        id: 1,
        participants: [user1, user2],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }

    const video2: Video = {
        title: "beispiel 2",
        description: "beispiel video 2",
        video: file2,
        thumbnail: file2,
        id: 2,
        participants: [user1],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }

    var videos: Video[] = [video1, video2];

    return JSON.parse(JSON.stringify(videos));
}


// TODO: optimize return and adjust test data
export async function getExamplePictures(): Promise<Picture[]> {

    const user1: User = {
        username: "ObiWan",
        password: "Highground",
        profilepicture: "https://nextui.org/images/album-cover.png",
        id: 34
    }

    // just for implementing test data for now (getting removed as soon as i have all components)
    // can be removed now, but then i need a different way of creating placeholder files
    const buffer1 = fs.readFileSync("./app/current-storage/examplePictures/pictureColorBlue.png");
    const buffer2 = fs.readFileSync("./app/current-storage/examplePictures/pictureColorGreenBlue.png");
    const buffer3 = fs.readFileSync("./app/current-storage/examplePictures/pictureColorLightGreen.png");
    const buffer4 = fs.readFileSync("./app/current-storage/examplePictures/pictureColorPurple.png");

    function bufferToFile(buffer: Buffer, filename: string, mimeType: string): File {
        const blob = new Blob([buffer], { type: mimeType });
        return new File([blob], filename, { type: mimeType });
    }

    const file1 = bufferToFile(buffer1, "pictureColorBlue.png", 'image/png');
    const file2 = bufferToFile(buffer2, "pictureColorGreenBlue.png", 'image/png');
    const file3 = bufferToFile(buffer3, "pictureColorLightGreen.png", 'image/png');
    const file4 = bufferToFile(buffer4, "pictureColorPurple.png", 'image/png');

    console.log("All Files: " + file1 + file2 + file3 + file4);

    const picture1: Picture = {
        title: "blue",
        description: "blue picture",
        img: file1,
        id: 22,
        participants: [user1],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }

    const picture2: Picture = {
        title: "greenBlue",
        description: "greenBlue picture",
        img: file2,
        id: 23,
        participants: [user1],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }
    const picture3: Picture = {
        title: "lightGreen",
        description: "lightGreen picture",
        img: file3,
        id: 24,
        participants: [user1],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }
    const picture4: Picture = {
        title: "purple",
        description: "purple picture",
        img: file4,
        id: 25,
        participants: [user1],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }

    var pictures: Picture[] = [picture1, picture2, picture3, picture4];
    console.log("Pics: ", pictures);

    return JSON.parse(JSON.stringify(pictures));
}

// TODO: optimize return and adjust test data
export async function getExampleQuotes(): Promise<Quote[]> {

    const user1: User = {
        username: "ObiWan",
        password: "Highground",
        profilepicture: "https://nextui.org/images/album-cover.png",
        id: 34
    }
    const user2: User = {
        username: "General Grievous",
        password: "spider",
        profilepicture: "https://nextui-docs-v2.vercel.app/images/hero-card-complete.jpeg",
        id: 35
    }

    const quote1: Quote = {
        fullQuote: [{
            msg: "Hello There!",
            user: user1
        },
        {
            msg: "General Kenobi!",
            user: user2
        }],
        id: 1,
        participants: [user1, user2],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }

    const quote2: Quote = {
        fullQuote: [{
            msg: "Test1234",
            user: user1
        },
        {
            msg: "Check!",
            user: user2
        }],
        id: 2,
        participants: [user1, user2],
        uploadedBy: user2,
        uploadedAt: new Date("2023-06-02"),
        createdAt: new Date("2023-06-02")
    }

    const quote3: Quote = {
        fullQuote: [{
            msg: "Hallo wie gehts dir?",
            user: user1
        },
        {
            msg: "Mir geht es gut und wie geht es dir?",
            user: user2
        },
        {
            msg: "Same here, danke der Nachfrage!",
            user: user1
        }],
        id: 3,
        participants: [user1, user2],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-05"),
        createdAt: new Date("2023-06-05")
    }

    return [quote1, quote2, quote3];
}


export async function getExampleVideosServerSide(): Promise<Video[]> {

    const user1: User = {
        username: "ObiWan",
        password: "Highground",
        profilepicture: "https://nextui.org/images/album-cover.png",
        id: 34
    }
    const user2: User = {
        username: "General Grievous",
        password: "spider",
        profilepicture: "https://nextui.org/images/hero-card-complete.jpeg",
        id: 35
    }

    function bufferToFile(buffer: Buffer, filename: string, mimeType: string): File {
        const blob = new Blob([buffer], { type: mimeType });
        return new File([blob], filename, { type: mimeType });
    }

    const buffer1 = fs.readFileSync("./app/current-storage/exampleVideos/beispielV1.mp4");
    const file1 = bufferToFile(buffer1, "beispielV1.mp4", 'video/mp4');

    console.log("buffer1: ", file1);

    const buffer2 = fs.readFileSync("./app/current-storage/exampleVideos/beispielV2.mp4");
    const file2 = bufferToFile(buffer2, "beispielV2.mp4", 'video/mp4');

    console.log("buffer2: ", file2);

    const video1: Video = {
        title: "beispiel 1",
        description: "beispiel video 1",
        video: file1,
        thumbnail: file1,
        id: 1,
        participants: [user1, user2],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }

    const video2: Video = {
        title: "beispiel 2",
        description: "beispiel video 2",
        video: file2,
        thumbnail: file2,
        id: 2,
        participants: [user1],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }

    var videos: Video[] = [video1, video2];

    return videos;
}