import { Quote } from "../../../types/types"

export default function QuoteComponent({ quote }: { quote: Quote }

    // TODO: replace html with card component + styling

) {
    return (
        <div className="quote">
            <hr></hr>

            {quote.fullQuote.map((singleQuote) => (

                <div className="quoteSegment">
                    <p>{singleQuote.user.username}: {singleQuote.msg}</p>  
                </div>

            )

            )}

            <div className="quoteMetaData">
                <p>Quote ID: {quote.id}</p>
                <p>Quote CreatedAt: {quote.createdAt.toString()}</p>
                <p>Quote UploadedBy: {quote.uploadedBy.username}</p>
            </div>
            <hr></hr>
        </div>
    )
}