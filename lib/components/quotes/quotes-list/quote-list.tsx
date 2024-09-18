'use client'

import { BreadcrumbItem, Breadcrumbs } from "@nextui-org/react";
import Link from "next/link";
import { Quote } from "../../../types/types";
import QuoteComponent from "../quote/quote";
import "./quote-list.css";

// TODO: remove the "?" from quotes and supply data from page"
export default function QuoteList({ quotes }: { quotes: Quote[] }) {

    return (
        <div>

            <Breadcrumbs>
                <BreadcrumbItem href="/">Home</BreadcrumbItem>
                <BreadcrumbItem href="/quotes">Quotes</BreadcrumbItem>
            </Breadcrumbs>

            <h1>Select a Video!</h1>
            <h2><Link href="/quotes/upload">Go to Upload</Link></h2>

            <div className="quoteList">
                {quotes != null && quotes != undefined ?
                    quotes.map((quote) => (
                        <div key={quote.id}>
                            <QuoteComponent quote={quote}></QuoteComponent>
                        </div>
                    )) : ""}
            </div>
        </div>
    )
}