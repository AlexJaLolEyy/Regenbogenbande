'use server'

import { Picture, Quote, User, Video } from "@/lib/types/types";
import pic1 from "@/app/current-storage/examplePictures/pictureColorBlue.png";
import fs from 'fs';

export async function getExampleVideos() : Video[] {

        var videos: Video[] = [];

       return videos;
  }

// TODO optimize return and adjust test data
  export async function getExamplePictures() : Promise<Picture[]> {

    const user1: User = {
        username: "ObiWan",
        password: "Highground",
        profilepicture: "tbc",
        id: 34
    }

    // just for implementing test data for now (getting removed as soon as i have all components)
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
  console.log("File1 pre: ", file1);

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
    console.log("Pic1 pre: ", picture1);

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
    var convertedPictures = JSON.parse(JSON.stringify(pictures));
    console.log("before: ", convertedPictures[0]);
    (convertedPictures).map((pic) => (pic.img = {
        'lastModified'     : picture4.img.lastModified,
        'name'             : picture4.img.name,
        'size'             : picture4.img.size,
        'type'             : picture4.img.type
  }))
  console.log("after: ", convertedPictures[0])
    

    console.log("Pics: ", pictures)

    console.log("JSON STRING: ", JSON.parse(JSON.stringify(picture1)))
    console.log("IMG STRING: ", (JSON.stringify(file1)))
    console.log("Normal File: ", file1)

   return convertedPictures;
}

// TODO optimize return and adjust test data
export async function getExampleQuotes() : Quote[] {

    const user1: User = {
        username: "ObiWan",
        password: "Highground",
        profilepicture: "tbc",
        id: 34
    }
    const user2: User = {
        username: "General Grievous",
        password: "spider",
        profilepicture: "tbc",
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

    var quotes: Quote[] = [quote1];

   return quotes;
}