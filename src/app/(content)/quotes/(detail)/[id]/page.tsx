import { getQuoteById } from "@/src/app/current-storage/storage";
import { getComments } from "@/src/lib/actions/comments";
import QuoteView from "@/src/lib/components/quotes/quote-view/quote-view";
import { Quote } from "@/src/lib/types/types";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const selectedQuote = await getQuoteById(id);
  if (!selectedQuote) return <div>Quote not found</div>;

  const initialComments = await getComments('quote', id);

  return (
    <div>
      <QuoteView quote={selectedQuote as Quote} initialComments={initialComments}></QuoteView>
    </div>
  )
}
