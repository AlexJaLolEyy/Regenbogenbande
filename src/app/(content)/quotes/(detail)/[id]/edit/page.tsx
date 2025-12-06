
import { getQuoteById } from "@/app/current-storage/storage";
import Navigation from "@/lib/components/Navigation/navigation";
import QuoteEdit from "@/lib/components/quotes/quote-edit/quote-edit";
import React from "react";


// TODO: add the view component here with the right data

export default async function Page({ params }: { params: Promise<{ id: number }> }) {
  // In Next.js 15, params must be awaited
  const { id } = await params;

  var selectedQuote = await getQuoteById(id);

  return (
    <div>
      <QuoteEdit quote={selectedQuote}></QuoteEdit>
    </div>
  )
}
