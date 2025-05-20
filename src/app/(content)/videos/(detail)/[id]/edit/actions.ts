"use server"

import { editVideo, getUserById, logData } from '@/app/current-storage/storage';
import { UploadVideo, User, Video } from '@/lib/types/types';
import { redirect } from 'next/navigation';


export async function parseUploadVideoToBackend(video: UploadVideo): Promise<Video> {

    // can happen since the form returns id's instead of full users if they get changed
    // TODO: maybe think about changing the UploadVideo participants + uploaded by to string?

    if ((typeof video.participants) === "string") {

        const userIds = video.participants.split(",");
        const mappedUser = userIds.map((userid: string) => {
            return getUserById(parseInt(userid)); // Return the promise directly
        });

        Promise.all(mappedUser)
            .then((users) => {
                video.participants = users;
            })
            .catch((error) => {
                console.error("Error fetching users: ", error);
            });
    }

    if((typeof video.uploadedBy) === "string") {
        video.uploadedBy = await getUserById(video.uploadedBy);
    }

    // TODO: add function for changing old video to new video
    // TODO: add function for saving the new video and creating the path

    return video;
}

export async function updateVideo(video: UploadVideo) {
    try {
        editVideo(await parseUploadVideoToBackend(video));
        redirect(`/videos/${video.id}/`);
    }
    catch (error) {
        console.error("Error updating the video : ", error);
    }  
}