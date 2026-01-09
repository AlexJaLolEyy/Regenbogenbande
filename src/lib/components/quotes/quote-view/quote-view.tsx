"use client";

import { incrementView } from '@/src/lib/actions/views';
import { Comment, Quote } from '@/src/lib/types/types';
import { faEye, faQuoteLeft, faShare, faStar, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, BreadcrumbItem, Breadcrumbs, Button } from "@heroui/react";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CommentsSection } from '../../shared/comments-section';
import { RatingModal } from '../../shared/rating-modal';
import { DeleteButton } from '../../ui/delete-button';

export default function QuoteView({ quote, initialComments = [] }: { quote: Quote, initialComments?: Comment[] }) {
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    useEffect(() => {
        incrementView('quote', quote.id);
    }, [quote.id]);

    const rating = quote.averageRating ? quote.averageRating.toFixed(1) : "0.0";

    const handleShare = async () => {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
    };

    return (
        <div className="relative z-10 w-full max-w-[1920px] mx-auto p-6 pt-4 pb-20">
            
            {/* Back Button */}
            <Link href="/quotes" className="fixed top-24 right-8 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition z-50 border border-white/10">
                <FontAwesomeIcon icon={faTimes} />
            </Link>

            <div className="flex flex-col lg:flex-row gap-8 justify-center">
                
                {/* LEFT: Main Chat Content */}
                <div className="flex-1 max-w-4xl space-y-8">
                    <Breadcrumbs className="mb-6" color="foreground">
                        <BreadcrumbItem href="/">Home</BreadcrumbItem>
                        <BreadcrumbItem href="/quotes">Quotes</BreadcrumbItem>
                        <BreadcrumbItem>Quote #{quote.id}</BreadcrumbItem>
                    </Breadcrumbs>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col h-[60vh] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-white/5 relative">
                            <div className="flex items-center gap-4">
                                <Avatar src={quote.uploadedBy.profilePicture || ""} isBordered />
                                <div>
                                    <h1 className="text-white font-bold text-lg">Conversation</h1>
                                    <p className="text-white/40 text-xs">
                                        Archived by {quote.uploadedBy.username} • {new Date(quote.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <FontAwesomeIcon icon={faQuoteLeft} className="text-6xl text-white" />
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
                            {quote.messages.map((msg, idx) => {
                                const isOdd = idx % 2 !== 0;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`flex gap-4 ${isOdd ? 'justify-end' : ''}`}
                                    >
                                        {!isOdd && <Avatar src={msg.user.profilePicture || ""} className="mt-1" />}

                                        <div className={`max-w-[70%] space-y-1 ${isOdd ? 'items-end flex flex-col' : ''}`}>
                                            <div className="flex items-baseline gap-2 text-xs text-white/40">
                                                <span className="font-bold text-white/70">{msg.user.username}</span>
                                            </div>
                                            <div className={`p-4 rounded-2xl text-white/90 leading-relaxed shadow-sm backdrop-blur-md border border-white/5 ${isOdd
                                                    ? 'bg-blue-600/20 border-blue-500/30 rounded-tr-sm'
                                                    : 'bg-white/10 rounded-tl-sm'
                                                }`}>
                                                {msg.message}
                                            </div>
                                        </div>

                                        {isOdd && <Avatar src={msg.user.profilePicture || ""} className="mt-1" />}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Comments Section */}
                    <div className="mt-12">
                        <CommentsSection 
                            contentType="quote" 
                            contentId={quote.id}
                            initialComments={initialComments}
                        />
                    </div>
                </div>

                {/* RIGHT: Sidebar */}
                <div className="w-full lg:w-80 shrink-0 space-y-6 pt-14">
                    {/* Actions Card */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-3">
                        <Button 
                            className="w-full bg-white/5 text-white border border-white/5 font-bold"
                            startContent={<FontAwesomeIcon icon={faStar} className="text-yellow-400" />}
                            onPress={() => setIsRatingModalOpen(true)}
                        >
                            Rate
                        </Button>
                        <Button 
                            className="w-full bg-white/5 text-white border border-white/5 font-bold" 
                            startContent={<FontAwesomeIcon icon={faShare} />}
                            onPress={handleShare}
                        >
                            Share
                        </Button>
                        <Link href={`/quotes/${quote.id}/edit`}>
                            <Button className="w-full bg-purple-600 text-white font-bold shadow-lg shadow-purple-900/20">
                                Edit
                            </Button>
                        </Link>
                        <DeleteButton
                            id={quote.id}
                            type="quote"
                            ownerId={quote.uploadedBy.id}
                            redirectUrl="/quotes"
                        />
                    </div>

                    {/* Stats Card */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white/40 text-xs font-bold uppercase mb-4">Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                <FontAwesomeIcon icon={faEye} className="text-white/40 mb-1" />
                                <div className="text-xl font-bold text-white">{quote.views}</div>
                                <div className="text-[10px] text-white/30 uppercase">Views</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                <FontAwesomeIcon icon={faStar} className="text-yellow-500/80 mb-1" />
                                <div className="text-xl font-bold text-white">{rating}</div>
                                <div className="text-[10px] text-white/30 uppercase">Rating</div>
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white/40 text-xs font-bold uppercase mb-4">Participants</h3>
                        <div className="flex flex-col gap-3">
                            {quote.participants.map((participant, idx) => {
                                const name = participant.type === 'user' ? participant.data.username : participant.data.displayName;
                                const src = participant.type === 'user' ? participant.data.profilePicture : undefined;
                                return (
                                    <div key={idx} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                                        <Avatar src={src || undefined} size="sm" name={name} />
                                        <span className="text-white text-sm font-medium">{name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <RatingModal 
                contentType="quote" 
                contentId={quote.id} 
                isOpen={isRatingModalOpen} 
                onOpenChange={setIsRatingModalOpen} 
            />
        </div>
    );
}
