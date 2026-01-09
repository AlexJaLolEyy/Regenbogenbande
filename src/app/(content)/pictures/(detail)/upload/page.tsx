import { checkAuth } from "@/src/lib/auth-utils";
import PictureUpload from "@/src/lib/components/pictures/picture-upload/picture-upload";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await checkAuth();

  if (session?.user?.role === "guest") {
    redirect("/");
  }

  return (
    <div>
      <PictureUpload></PictureUpload>
    </div>
  )
}
