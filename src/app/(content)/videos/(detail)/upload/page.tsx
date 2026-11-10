import { canUpload, checkAuth, getEffectiveRole } from "@/src/lib/auth-utils";
import VideoUpload from "@/src/lib/components/videos/video-upload/video-upload";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await checkAuth();
  if (!canUpload(getEffectiveRole(session))) {
    redirect("/");
  }

  return (
      <VideoUpload></VideoUpload>
  )
}
