import { Video } from "../../../types/types"

export default function VideoEdit({ video }: { video: Video }

) {
    return (
        <div>
            <p>You are currently at Video-Edit!</p>

            <form>
                <h3>Video-Details:</h3>

                <div>
                    <label htmlFor="title">Title</label>
                    <input type="text" id="title" defaultValue={video.title}></input>
                </div>

                <div>
                    <label htmlFor="description">Description</label>
                    <input type="text" id="description" defaultValue={video.description}></input>
                </div>

                {/* TODO: change default value for types */}
                <div>
                    <label htmlFor="participants">Participants</label>
                    <input type="text" id="participants" defaultValue={video.participants}></input>
                </div>

                <div>
                    <label htmlFor="uploadDate">Upload-Date</label>
                    <input type="date" id="uploadDate" defaultValue={video.uploadedAt}></input>
                </div>

                <div>
                    <label htmlFor="creationDate">Creation-Date</label>
                    <input type="date" id="creationDate" defaultValue={video.createdAt}></input>
                </div>

            </form>

        </div>
    )
}