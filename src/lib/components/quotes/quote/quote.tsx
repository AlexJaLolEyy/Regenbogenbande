'use client'

import { faEye, faStar, faClock } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card, CardBody, CardFooter, CardHeader, User, Avatar } from "@heroui/react";
import { useRouter } from "next/navigation";
import { Quote } from "../../../types/types";

export default function QuoteComponent({ quote }: { quote: Quote }) {
    const router = useRouter();

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const uploadDate = new Date(date);
        const diffInDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        return `${Math.floor(diffInDays / 30)} months ago`;
    };

    const calculateAverageRating = (ratings: { value: number }[]) => {
        if (!ratings || ratings.length === 0) return '0.0';
        const sum = ratings.reduce((acc, rating) => acc + rating.value, 0);
        return (sum / ratings.length).toFixed(1);
    };

    // Show first 2-3 messages as preview
    const previewMessages = quote.fullQuote.slice(0, 3);
    const hasMore = quote.fullQuote.length > 3;

    return (
        <Card 
            className="p-4 hover:scale-[1.02] transition-transform duration-200 flex flex-col" 
            isPressable 
            onPress={() => {
                router.push('/quotes/' + quote.id);
            }}
        >
            <CardHeader className="px-0 pt-0 pb-3">
                <h4 className="font-bold text-lg">Quote #{quote.id}</h4>
            </CardHeader>
            
            <CardBody className="px-0 py-3 flex-grow overflow-hidden">
                <div className="space-y-3">
                    {previewMessages.map((singleQuote, index) => (
                        <div 
                            key={`${singleQuote.user.id}-${index}`} 
                            className="bg-default-100 dark:bg-default-200 rounded-lg p-3 border border-default-200 dark:border-default-300"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Avatar 
                                    src={singleQuote.user.profilepicture || undefined}
                                    size="sm"
                                    name={singleQuote.user.username}
                                />
                                <p className="text-xs font-semibold text-default-900 dark:text-default-100 uppercase">
                                    {singleQuote.user.username}
                                </p>
                            </div>
                            <p className="text-sm text-default-900 dark:text-default-100 line-clamp-3">
                                {singleQuote.msg}
                            </p>
                        </div>
                    ))}
                    {hasMore && (
                        <p className="text-xs text-default-400 italic text-center">
                            +{quote.fullQuote.length - 3} more messages
                        </p>
                    )}
                </div>
            </CardBody>
            
            <CardFooter className="px-0 pt-4 pb-0">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 min-w-0 max-w-[200px]">
                        <User
                            name={quote.uploadedBy.username}
                            avatarProps={{
                                src: quote.uploadedBy.profilepicture || undefined,
                                size: "sm"
                            }}
                            classNames={{
                                name: "truncate text-xs"
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-4 text-default-500 text-sm shrink-0">
                        <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
                            <span>{calculateAverageRating(quote.metadata.rating)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faEye} />
                            <span>{quote.metadata.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faClock} />
                            <span className="text-xs">{formatTimeAgo(quote.uploadedAt)}</span>
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
