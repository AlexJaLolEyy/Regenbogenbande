import { checkAuth } from "@/src/lib/auth-utils";
import { redirect } from "next/navigation";
import PictureUpload from "@/src/lib/components/pictures/picture-upload/picture-upload";

export default async function Page() {
  const session = await checkAuth();
  // @ts-expect-error Role is added by adapter
  if (session?.user?.role === "viewer") {
    redirect("/");
  }

  return (
    <div>
      <PictureUpload></PictureUpload>
    </div>
  )
}
