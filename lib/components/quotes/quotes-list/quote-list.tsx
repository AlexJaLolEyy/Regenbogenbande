'use client'

import { useEffect, useState } from "react";
import { Quote } from "../../../types/types"
import { getExampleQuotes } from "@/app/current-storage/storage";
import QuoteComponent from "../quote/quote";
import Link from "next/link";

import "./quote-list.css";

// TODO: remove the "?" from quotes and supply data from page"
export default function QuoteList({ quotes }: { quotes?: Quote[] }) {

    const [fakeQuotes, setFakeQuotes] = useState<Quote[] | null>(null);

    useEffect(() => {
        // gets all quotes
        getExampleQuotes().then((data) => setFakeQuotes(data));
    }, []);

    return (
        <div>
            <Link href="/quotes/upload">Go to Upload</Link>
            <div className="quoteList">
                {fakeQuotes != null ?
                    fakeQuotes.map((quote) => (
                        <QuoteComponent quote={quote}></QuoteComponent>
                    )) : ""}
            </div>
        </div>
    )
}