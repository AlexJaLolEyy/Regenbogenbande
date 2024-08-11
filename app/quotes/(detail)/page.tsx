import Navigation from "@/lib/components/Navigation/navigation";
import QuoteList from "@/lib/components/quotes/quotes-list/quote-list";

export default function Page() {
  
  // import data for list here

  return (
    <div>
      <Navigation></Navigation>
      <QuoteList></QuoteList>
    </div>
  )
}
