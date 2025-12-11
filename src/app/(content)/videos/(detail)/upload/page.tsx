import { checkAuth } from "@/src/lib/auth-utils";
import { redirect } from "next/navigation";
import VideoUpload from "@/src/lib/components/videos/video-upload/video-upload";

export default async function Page() {
  const session = await checkAuth();
  // @ts-expect-error Role is added by adapter
  if (session?.user?.role === "viewer") {
    redirect("/");
  }

  return (
    <div>
      <VideoUpload></VideoUpload>
    </div>
  )
}
