import { Card, CardBody, CardFooter, CardHeader, Image, Divider } from "@nextui-org/react"
import { Quote } from "../../../types/types"

import "./quote.css";
import { useRouter } from "next/navigation";

export default function QuoteComponent({ quote }: { quote: Quote }) {

    // TODO: replace html with card component + styling
    // TODO: add "isPressable" to card (might need to redo styling)

    const router = useRouter();

    return (
        <div className="quote">

            <Card className="py-4" isPressable onPress={() => {
                router.push('/quotes/' + quote.id);
            }}>
                <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                    <h4 className="font-bold text-large">Quote #{quote.id}</h4>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                    {quote.fullQuote.map((singleQuote) => (
                        <div className="quoteSegment">
                            <p className="text-tiny uppercase font-bold">{singleQuote.user.username}</p>
                            <small className="text-default-500">{singleQuote.msg}</small>
                        </div>
                    ))}
                </CardBody>
                <CardFooter className="cardFooter">
                    <div className="flex gap-2 items-center">
                        <Image
                            alt="User Profile"
                            className="object-cover none"
                            src={quote.uploadedBy.profilepicture === null || undefined ? "Fehler" : quote.uploadedBy.profilepicture}
                            width={35}
                        />
                        <p className="text-tiny uppercase font-bold">{quote.uploadedBy.username}</p>
                    </div>
                    <small className="text-default-500">Likes</small>
                    <small className="text-default-500">Views</small>
                </CardFooter>
            </Card>
        </div>
    )
}
