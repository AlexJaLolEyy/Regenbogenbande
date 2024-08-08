import type { Picture } from "../../../types/types"

export default function PictureComponent({ picture }: { picture: Picture }

) {
    console.log("final: ", picture)


    return (
        <div>
            <p>-s-s-s-s-s-s-s-</p>
            <div className="pictureImg">
                <img src={picture.img === null ? "Fehler" : URL.createObjectURL(picture.img as File)} alt="error while loading picture" width={"200"} height={"200"}></img>
            </div>
            <div className="pictureTitle">
                <p>{picture.title}</p>
            </div>
            <div className="pictureMetaData">
                <p>{picture.createdAt.toISOString()}</p>
                <p>{picture.uploadedBy.username}</p>
            </div>

        </div>
    )
}