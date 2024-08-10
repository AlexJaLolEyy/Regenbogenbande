import type { Picture } from "../../../types/types"

export default function PictureComponent({ picture }: { picture: Picture }

) {
    console.log("final: ", picture.img);

    var reader = new FileReader();

    console.log("whole picture: ", picture)
    
    //var convert = URL.createObjectURL(picture.img);
    //console.log("convert: ",convert);
    


    return (
        <div>
            <p>-s-s-s-s-s-s-s-</p>
            <div className="pictureImg">
                <p>path: {URL.createObjectURL(picture.img)}</p>
                <img src={picture.img === null ? "Fehler" : URL.createObjectURL(picture.img)} alt="error while loading picture" width={"200"} height={"200"}></img>
            </div>
            <div className="pictureTitle">
                <p>{picture.title}</p>
            </div>
            <div className="pictureMetaData">
                <p>{picture.createdAt.toString()}</p>
                <p>{picture.uploadedBy.username}</p>
            </div>

        </div>
    )
}