"use client"

import { Quote, Video } from "../../../types/types"
import Link from "next/link";

import { useEffect } from "react";

export default function QuoteView({ quote }: { quote: Quote }
) {

  useEffect(() => {
    console.log("QuoteView: ", quote);
  }, []);

  return (
    <div>
      <p>You are currently at Quote-View!</p>

      <Link href="/quotes/upload">Go to Upload</Link>

      {quote.fullQuote.map((singleQuote) => (
        <div>
          <h2>{singleQuote.user.username}</h2>
          <p>{singleQuote.msg}</p>

        </div>
      ))}

      <p>ID: {quote.id}</p>
      <p>UploadedBy: {JSON.stringify(quote.uploadedBy)}</p>

    </div>
  );
}