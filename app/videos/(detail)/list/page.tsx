import { getExampleVideos, getExampleVideosServerSide } from "@/app/current-storage/storage";
import Navigation from "@/lib/components/Navigation/navigation";
import VideoList from "@/lib/components/videos/video-list/video-list";
import { Video } from "@/lib/types/types";
import { useState, useEffect } from "react";

import beispielVideo1 from "@/app/current-storage/exampleVideos/beispielV1.mp4";
import beispielVideo2 from "@/app/current-storage/exampleVideos/beispielV2.mp4";


export default async function Page() {

  function convert(): Video[] {

    var vids: Video[] = [];

    getExampleVideosServerSide().then((data) => {
      vids = data
      console.log("1234: ", data);
    });
    console.log("123: ", vids);
    return vids;
  }

//   function getData(): Video[] {
//     console.log("getDATA.......");
//     console.log("import1: ", beispielVideo1);
//     console.log("import2: ", beispielVideo1);
//     var vids: Video[] = [];

//     // import data for list here
//     var array: File[] = [];
  
//       // const convertToFile = async (video: string) => {
//       //   console.log("convert...")
//         // const response = await fetch(video);
//         // console.log("after fetch");
//         // const blob = await response.blob();
//         // const file = new File([blob], "videoFile.mp4", { type: blob.type }); // name changable?
//         // console.log("before push");
//         // array.push(file);
//         // console.log("kek: ", file)



// // v2

//       //   const absoluteUrl = `${window.location.origin}${video}`;
//       //   const response = await fetch(absoluteUrl);
//       //     if (!response.ok) {
//       //       throw new Error(`Failed to fetch video: ${response.statusText}`);
//       //     }
//       //     const blob = await response.blob();
//       //     const file = new File([blob], "videoFile.mp4", { type: blob.type });
//       //     array.push(file);
//       // };
      
//       // convertToFile(beispielVideo1);
//       // convertToFile(beispielVideo2);
  
//       // // gets pictures and fills the empty img with the actual one (harcoded af)
//       // getExampleVideos().then((data) => {
//       //   data[0].video = array[0];
//       //   data[0].thumbnail = array[0];
//       //   data[1].video = array[1];
//       //   data[1].thumbnail = array[1];
//       //   vids = (data);
//       //   console.log("vids: ", vids);
//       // });

//     return vids;
//   }

  

  return (
    <div>
      <Navigation></Navigation>
      <VideoList videos={await getExampleVideosServerSide().then()}></VideoList>
    </div>
  )
}
