import { canUpload, checkAuth, getEffectiveRole } from "@/src/lib/auth-utils";
import PictureUpload from "@/src/lib/components/pictures/picture-upload/picture-upload";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await checkAuth();

  if (!canUpload(getEffectiveRole(session))) {
    redirect("/");
  }

  return (
    <div>
      <PictureUpload></PictureUpload>
    </div>
  )
}
