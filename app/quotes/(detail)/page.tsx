import { getExampleQuotes } from "@/app/current-storage/storage";
import Navigation from "@/lib/components/Navigation/navigation";
import QuoteList from "@/lib/components/quotes/quotes-list/quote-list";

export default async function Page() {
  
  var quotes = await getExampleQuotes();

  return (
    <div>
      <Navigation></Navigation>
      <QuoteList quotes={quotes}></QuoteList>
    </div>
  )
}
