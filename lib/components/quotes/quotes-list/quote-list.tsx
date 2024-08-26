'use client'

import { Quote } from "../../../types/types"
import QuoteComponent from "../quote/quote";
import Link from "next/link";

import "./quote-list.css";

// TODO: remove the "?" from quotes and supply data from page"
export default function QuoteList({ quotes }: { quotes: Quote[] }) {

    return (
        <div>
            <Link href="/quotes/upload">Go to Upload</Link>
            <div className="quoteList">
                {quotes != null && quotes != undefined ?
                    quotes.map((quote) => (
                        <QuoteComponent quote={quote}></QuoteComponent>
                    )) : ""}
            </div>
        </div>
    )
}