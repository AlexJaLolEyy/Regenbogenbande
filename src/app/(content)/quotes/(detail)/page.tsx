import { getAllQuotes } from "@/src/app/current-storage/storage";
import Navigation from "@/src/lib/components/Navigation/navigation";
import QuoteList from "@/src/lib/components/quotes/quotes-list/quote-list";

export default async function Page() {
  
  var quotes = await getAllQuotes();

  return (
    <div>
      <QuoteList quotes={quotes}></QuoteList>
    </div>
  )
}
