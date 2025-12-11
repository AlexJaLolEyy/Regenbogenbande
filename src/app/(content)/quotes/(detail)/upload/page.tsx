import { checkAuth } from "@/src/lib/auth-utils";
import { redirect } from "next/navigation";
import QuoteUpload from "@/src/lib/components/quotes/quotes-upload/quote-upload";

export default async function Page() {
  const session = await checkAuth();
  // @ts-expect-error Role is added by adapter
  if (session?.user?.role === "viewer") {
    redirect("/");
  }

  return (
    <div>
      <QuoteUpload></QuoteUpload>
    </div>
  )
}
