import { Picture } from "../../../types/types"

export default function PictureEdit({ picture }: { picture: Picture }

) {
    return (
        <div>
            <p>You are currently at Picture
            -Edit!</p>

            <form>
                <h3>Picture
                -Details:</h3>

                <div>
                    <label htmlFor="title">Title</label>
                    <input type="text" id="title" defaultValue={picture
                    .title}></input>
                </div>

                <div>
                    <label htmlFor="description">Description</label>
                    <input type="text" id="description" defaultValue={picture
                    .description}></input>
                </div>

                {/* TODO change default value for types */}
                <div>
                    <label htmlFor="participants">Participants</label>
                    <input type="text" id="participants" defaultValue={picture
                    .participants}></input>
                </div>

                <div>
                    <label htmlFor="uploadDate">Upload-Date</label>
                    <input type="date" id="uploadDate" defaultValue={picture
                    .uploadedAt}></input>
                </div>

                <div>
                    <label htmlFor="creationDate">Creation-Date</label>
                    <input type="date" id="creationDate" defaultValue={picture
                    .createdAt}></input>
                </div>

            </form>

        </div>
    )
}