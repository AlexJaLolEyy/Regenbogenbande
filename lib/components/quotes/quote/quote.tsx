import { faEye, faStar } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardBody, CardFooter, CardHeader, Image } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { Quote } from "../../../types/types";
import "./quote.scss";

export default function QuoteComponent({ quote }: { quote: Quote }) {

    // TODO: update UI later with a custom Chat-Model

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
                        <div className="quoteSegment" key={singleQuote.msg}>
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

                    <div className="rating">
                        <FontAwesomeIcon icon={faStar} />
                        {/* TODO: replace with actual rating */}
                        <p>4.6</p>
                    </div>
                    <div className="views">
                        <FontAwesomeIcon icon={faEye} />
                        {/* TODO: replace with actual rating */}
                        <p>166</p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
