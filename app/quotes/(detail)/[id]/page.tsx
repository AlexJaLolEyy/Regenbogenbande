
import { getQuoteById } from "@/app/current-storage/storage";
import Navigation from "@/lib/components/Navigation/navigation";
import QuoteView from "@/lib/components/quotes/quote-view/quote-view";
import React from "react";


// TODO: add the view component here with the right data

export default async function Page({ params }: { params: { id: number } }) {

  var selectedQuote = await getQuoteById(params.id);

  return (
    <div>
      <Navigation></Navigation>
      <QuoteView quote={selectedQuote}></QuoteView>
    </div>
  )
}
