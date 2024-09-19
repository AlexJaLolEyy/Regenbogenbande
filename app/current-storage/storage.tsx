'use server'

import { Picture, Quote, Rating, User, Video } from "@/lib/types/types";
import { promises as fs } from 'fs';


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

// info: id is type number but bc it gets delivered by url its still a string -> == instead of ===
export async function getVideoById(id: number): Promise<Video> {
    return (await getAllVideos()).filter((video) => video.id == id)[0];
}

// info: id is type number but bc it gets delivered by url its still a string -> == instead of ===
export async function getPictureById(id: number): Promise<Picture> {
    return (await getAllPictures()).filter((picture) => picture.id == id)[0];
}

// info: id is type number but bc it gets delivered by url its still a string -> == instead of ===
export async function getQuoteById(id: number): Promise<Quote> {
    return (await getAllQuotes()).filter((quote) => quote.id == id)[0];
}

// info: id is type number but bc it gets delivered by url its still a string -> == instead of ===
export async function getUserById(id: number): Promise<User> {
    return (await getAllUsers()).filter((user) => user.id == id)[0];
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

// TODO: technically theres still a case when videoId is invalid (but if thats the case... rip)
export async function deleteVideo(videoId: number): Promise<void> {
    var allVideos: Video[] = await getAllVideos();
    const remaining: Video[] = allVideos.filter((video) => video.id !== videoId)
    await fs.writeFile('app/current-storage/data/videos.json', JSON.stringify(remaining, null, 4));
}

export async function deletePicture(pictureId: number): Promise<void> {
    var allPictures: Picture[] = await getAllPictures();
    const remaining: Picture[] = allPictures.filter((picture) => picture.id !== pictureId)
    await fs.writeFile('app/current-storage/data/pictures.json', JSON.stringify(remaining, null, 4));
}

export async function deleteQuote(quoteId: number): Promise<void> {
    var allQuotes: Quote[] = await getAllQuotes();
    const remaining: Quote[] = allQuotes.filter((quote) => quote.id !== quoteId)
    await fs.writeFile('app/current-storage/data/pictures.json', JSON.stringify(remaining, null, 4));
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

export async function calculateMediaRating(ratings: Rating[]): Promise<number> {
    if (ratings.length !== 0) {
        return ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length
    }
    else {
        return 0;
    }
}