import type { Picture } from "../../../types/types";

export default function PictureComponent({ picture }: { picture: Picture }) {
  
  // TODO: replace html with card component + styling

  return (
    <div>
      <hr></hr>
      <div className="pictureImg">
        <p>path: {URL.createObjectURL(picture.img)}</p>
        <img
          src={picture.img === null ? "Fehler" : URL.createObjectURL(picture.img)}
          alt="error while loading picture"
          width={"250"}
          height={"250"}
        ></img>
      </div>
      <div className="pictureTitle">
        <p>Picture Title: {picture.title}</p>
      </div>
      <div className="pictureMetaData">
        <p>Picture CreatedAt: {picture.createdAt.toString()}</p>
        <p>Picture UploadedBy: {picture.uploadedBy.username}</p>
      </div>
      <hr></hr>
    </div>
  );
}
