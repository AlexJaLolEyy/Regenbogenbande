
import QuoteEdit from "@/src/lib/components/quotes/quote-edit/quote-edit";
import { getQuoteById } from "@/src/lib/db/selects/quotes";
import { Quote } from "@/src/lib/types/types";


export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const selectedQuote = await getQuoteById(id);

  return (
      <QuoteEdit quote={selectedQuote as Quote}></QuoteEdit>
  )
}
