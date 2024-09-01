'use server'

import { Picture, Quote, User, Video } from "@/lib/types/types";
import { promises as fs } from 'fs';

const user1: User = {
    username: "Alex Ja Lol Eyy",
    password: "12345",
    profilepicture: "https://nextui.org/images/album-cover.png",
    id: 1
}

const user2: User = {
    username: "Thylon",
    password: "12345",
    profilepicture: "https://nextui.org/images/album-cover.png",
    id: 2
}


export async function getExampleVideos(): Promise<Video[]> {

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

export async function getAllUsers(): Promise<User[]> {
    var users: User[] = [
        {
            username: "Alex Ja Lol Eyy",
            password: "12345",
            profilepicture: "https://nextui.org/images/album-cover.png",
            id: 1
        },
        {
            username: "Thylon",
            password: "12345",
            profilepicture: "https://nextui.org/images/album-cover.png",
            id: 2
        },
        {
            username: "T1 Sensei",
            password: "12345",
            profilepicture: "https://nextui.org/images/album-cover.png",
            id: 3
        },
        {
            username: "Jesse",
            password: "12345",
            profilepicture: "https://nextui.org/images/album-cover.png",
            id: 4
        },
        {
            username: "Achel aka BigBrainGamer420",
            password: "12345",
            profilepicture: "https://nextui.org/images/album-cover.png",
            id: 5
        },
        {
            username: "Marla",
            password: "12345",
            profilepicture: "https://nextui.org/images/album-cover.png",
            id: 6
        }
    ];
    return users;
}


// TODO: rework the getById's to adjust them to get data from the file system
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
// info: id is type number but bc it gets delivered by url its still a string -> == instead of ===
export async function getUserById(id: number): Promise<User> {
    return (await getAllUsers()).filter((user) => user.id == id)[0];
}

export async function addQuote(quote: Quote): Promise<void> {
    var allQuotes: Quote[] = await getAllQuotes();
    const exists = allQuotes.some(qt => qt.id === quote.id)

    if (exists) {
        console.error("Quote already exists, not adding!");
        return;
    }
    else {
        allQuotes.push(quote);
        await fs.writeFile('app/current-storage/data/pictures.json', JSON.stringify(allQuotes, null, 4));
    }
}

export async function addPicture(picture: Picture): Promise<void> {
    var allPictures: Picture[] = await getAllPictures();
    const exists = allPictures.some(pic => pic.id === picture.id)

    if (exists) {
        console.error("Picture already exists, not adding!");
        return;
    }
    else {
        allPictures.push(picture);
        await fs.writeFile('app/current-storage/data/pictures.json', JSON.stringify(allPictures, null, 4));
    }
}

export async function addVideo(video: Video): Promise<void> {
    var allVideos: Video[] = await getAllVideos();
    const exists = allVideos.some(vid => vid.id === video.id)

    if (exists) {
        console.error("Video already exists, not adding!");
        return;
    }
    else {
        allVideos.push(video);
        await fs.writeFile('app/current-storage/data/videos.json', JSON.stringify(allVideos, null, 4));
    }
}

export async function deleteQuote(quoteId: number): Promise<void> {
    var allQuotes: Quote[] = await getAllQuotes();
    const remaining: Quote[] = allQuotes.filter((quote) => quote.id !== quoteId)
    await fs.writeFile('app/current-storage/data/pictures.json', JSON.stringify(remaining, null, 4));
}

export async function deletePicture(pictureId: number): Promise<void> {
    var allPictures: Picture[] = await getAllPictures();
    const remaining: Picture[] = allPictures.filter((picture) => picture.id !== pictureId)
    await fs.writeFile('app/current-storage/data/pictures.json', JSON.stringify(remaining, null, 4));
}

// TODO: technically theres still a case when videoId is invalid (but if thats the case... rip)
export async function deleteVideo(videoId: number): Promise<void> {
    var allVideos: Video[] = await getAllVideos();
    const remaining: Video[] = allVideos.filter((video) => video.id !== videoId)
    await fs.writeFile('app/current-storage/data/videos.json', JSON.stringify(remaining, null, 4));
}

export async function getAllVideos(): Promise<Video[]> {
    return JSON.parse(await fs.readFile('app/current-storage/data/videos.json', "utf-8"));
}

export async function getAllPictures(): Promise<Picture[]> {
    return JSON.parse(await fs.readFile('app/current-storage/data/pictures.json', "utf-8"));
}

export async function getAllQuotes(): Promise<Quote[]> {
    return JSON.parse(await fs.readFile('app/current-storage/data/quotes.json', "utf-8"));
}

export async function getAllUsers(): Promise<User[]> {
    return JSON.parse(await fs.readFile('app/current-storage/data/users.json', "utf-8"));
}

export async function addUser(user: User): Promise<void> {
    var userlist: User[] = await getAllUsers();
    const exists = userlist.some(us => us.id === user.id)

    if (exists) {
        console.error("User already exists, not adding!");
        return;
    }
    else {
        userlist.push(user);
        await fs.writeFile('app/current-storage/data/users.json', JSON.stringify(userlist, null, 4));
    }
}

export async function deleteUser(userid: number): Promise<void> {
    var userlist: User[] = await getAllUsers();
    const remaining: User[] = userlist.filter((user) => user.id !== userid)
    await fs.writeFile('app/current-storage/data/users.json', JSON.stringify(remaining, null, 4));
}

// use the userlist.map as input for the writeFile (might cause readability trouble)
export async function editUser(updatedUser: User): Promise<void> {
    var userlist: User[] = await getAllUsers();
    userlist = userlist.map((user) => {
        if (user.id === updatedUser.id) {
            return updatedUser;
        }
        return user;
    });
    await fs.writeFile('app/current-storage/data/users.json', JSON.stringify(userlist, null, 4));
}

// use the .map as input for the writeFile (might cause readability trouble)
export async function editVideo(updatedVideo: Video): Promise<void> {
    var allVideos: Video[] = await getAllVideos();
    allVideos = allVideos.map((video) => {
        if (video.id === updatedVideo.id) {
            return updatedVideo;
        }
        return video;
    });
    await fs.writeFile('app/current-storage/data/videos.json', JSON.stringify(allVideos, null, 4));
}

// use the .map as input for the writeFile (might cause readability trouble)
export async function editPicture(updatedPicture: Picture): Promise<void> {
    var allPictures: Picture[] = await getAllPictures();
    allPictures = allPictures.map((picture) => {
        if (picture.id === updatedPicture.id) {
            return updatedPicture;
        }
        return picture;
    });
    await fs.writeFile('app/current-storage/data/pictures.json', JSON.stringify(allPictures, null, 4));
}

// use the .map as input for the writeFile (might cause readability trouble)
export async function editQuote(updatedQuote: Quote): Promise<void> {
    var allQuotes: Quote[] = await getAllQuotes();
    allQuotes = allQuotes.map((quote) => {
        if (quote.id === updatedQuote.id) {
            return updatedQuote;
        }
        return quote;
    });
    await fs.writeFile('app/current-storage/data/quotes.json', JSON.stringify(allQuotes, null, 4));
}