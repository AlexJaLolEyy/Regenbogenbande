'use server'

import { Picture, Quote, User, Video } from "@/lib/types/types";


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

    const video1: Video = {
        title: "beispiel 1",
        description: "beispiel video 1",
        video: "/exampleVideos/beispielV1.mp4",
        thumbnail: "/examplePictures/exampleThumbnail.jpg",
        id: 1,
        participants: [user1, user2],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }

    const video2: Video = {
        title: "beispiel 2",
        description: "beispiel video 2",
        video: "/exampleVideos/beispielV2.mp4",
        thumbnail: "/examplePictures/exampleThumbnail.jpg",
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

    const picture1: Picture = {
        title: "blue",
        description: "blue picture",
        img: "/examplePictures/pictureColorBlue.png",
        id: 22,
        participants: [user1],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }

    const picture2: Picture = {
        title: "greenBlue",
        description: "greenBlue picture",
        img: "/examplePictures/pictureColorGreenBlue.png",
        id: 23,
        participants: [user1],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }
    const picture3: Picture = {
        title: "lightGreen",
        description: "lightGreen picture",
        img: "/examplePictures/pictureColorLightGreen.png",
        id: 24,
        participants: [user1],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }
    const picture4: Picture = {
        title: "purple",
        description: "purple picture",
        img: "/examplePictures/pictureColorPurple.png",
        id: 25,
        participants: [user1],
        uploadedBy: user1,
        uploadedAt: new Date("2023-06-01"),
        createdAt: new Date("2023-06-01")
    }
    var pictures: Picture[] = [picture1, picture2, picture3, picture4];

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

// info: id is type number but bc it gets delivered by url its still a string -> == instead of ===
export async function getQuoteById(id: number): Promise<Quote> {
    return (await getExampleQuotes()).filter((quote) => quote.id == id)[0];
}

// info: id is type number but bc it gets delivered by url its still a string -> == instead of ===
export async function getPictureById(id: number): Promise<Picture> {
    return (await getExamplePictures()).filter((picture) => picture.id == id)[0];
}

// info: id is type number but bc it gets delivered by url its still a string -> == instead of ===
export async function getVideoById(id: number): Promise<Video> {
    return (await getExampleVideos()).filter((video) => video.id == id)[0];
}
