import { canUpload, checkAuth, getEffectiveRole } from "@/src/lib/auth-utils";
import QuoteUpload from "@/src/lib/components/quotes/quote-upload/quote-upload";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await checkAuth();
  if (!canUpload(getEffectiveRole(session))) {
    redirect("/");
  }

  return (
    <div>
      <QuoteUpload></QuoteUpload>
    </div>
  )
}
