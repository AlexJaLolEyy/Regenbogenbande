import type { Video } from "../../../types/types";

export default function VideoComponent({ video }: { video: Video }) {

  // TODO: replace html with card component + styling

  return (
    <div>
      <hr></hr>
      <div className="video">
        <p>Video Thumbnail: </p>
        <img
          src={""}
          alt="error while loading thumbnail"
          width={"250"}
          height={"250"}
        ></img>
        <p>Video: </p>
        <video width={"250"} height={"250"} controls>
          <source
            id="preview"
            src={video.video === null ? "" : URL.createObjectURL(video.video)}
            type="video/mp4"
          />
          <p>Error while loading Video</p>
        </video>
      </div>
      <div className="videoTitle">
        <p>Video Title: {video.title}</p>
      </div>
      <div className="videoMetaData">
        <p>Video CreatedAt: {video.createdAt.toString()}</p>
        <p>Video UploadedBy: {video.uploadedBy.username}</p>
      </div>
      <hr></hr>
    </div>
  );
}
