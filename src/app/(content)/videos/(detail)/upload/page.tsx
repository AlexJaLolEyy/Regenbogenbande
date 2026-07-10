import { checkAuth } from "@/src/lib/auth-utils";
import VideoUpload from "@/src/lib/components/videos/video-upload/video-upload";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await checkAuth();
  if (session?.user?.role === "viewer") {
    redirect("/");
  }

  return (
      <VideoUpload></VideoUpload>
  )
}
