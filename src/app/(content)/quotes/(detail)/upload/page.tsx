import { checkAuth } from "@/src/lib/auth-utils";
import QuoteUpload from "@/src/lib/components/quotes/quotes-upload/quote-upload";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await checkAuth();
  if (session?.user?.role === "guest") {
    redirect("/");
  }

  return (
    <div>
      <QuoteUpload></QuoteUpload>
    </div>
  )
}
