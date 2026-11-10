import { notFound } from "next/navigation";
import { getComments } from "@/src/lib/actions/comments";
import { getSession } from "@/src/lib/auth-utils";
import QuoteView from "@/src/lib/components/quotes/quote-view/quote-view";
import { getQuoteById } from "@/src/lib/db/selects/quotes";
import { Quote } from "@/src/lib/types/types";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const selectedQuote = await getQuoteById(id, session);
  if (!selectedQuote) notFound();

  const initialComments = await getComments('quote', id);

  return (
      <QuoteView quote={selectedQuote as Quote} initialComments={initialComments}></QuoteView>
  )
}
