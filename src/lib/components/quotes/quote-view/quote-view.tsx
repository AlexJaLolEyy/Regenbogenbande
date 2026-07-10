"use client";

import { incrementView } from '@/src/lib/actions/views';
import { Comment, Quote } from '@/src/lib/types/types';
import { faEdit, faEllipsisVertical, faQuoteLeft, faShare, faStar, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CommentsSection } from '../../shared/comments-section';
import { RatingModal } from '../../shared/rating-modal';
import { DeleteButton } from '../../ui/delete-button';
import { PageShell } from '../../ui/page-shell';

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
        <PageShell variant="aurora">
            <div className="relative z-10 w-full pt-24 pb-8 px-4 md:px-8">
                {/* Back Button */}
                <Link
                    href="/quotes"
                    className="fixed top-24 right-8 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition z-50 border border-white/10 group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <FontAwesomeIcon icon={faTimes} className="relative z-10" />
                </Link>

                <div className="max-w-450 mx-auto grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                    {/* LEFT COLUMN: Quote Content */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Quote Stage with Frosty Glass */}
                        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative min-h-[70vh] flex flex-col group">
                            {/* Header */}
                            <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-white/5 relative shrink-0">
                                <div className="flex items-center gap-4">
                                    <Avatar src={quote.uploadedBy.profilePicture || ""} size="md" className="w-12 h-12" />
                                    <div>
                                        <h2 className="text-white font-black text-xl leading-tight">{quote.uploadedBy.username}</h2>
                                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
                                            Archivist
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform group-hover:rotate-12 transition-transform duration-700">
                                    <FontAwesomeIcon icon={faQuoteLeft} className="text-4xl text-white" />
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 p-8 md:p-12 space-y-8 bg-linear-to-b from-transparent to-black/20 overflow-y-auto max-h-[85vh] custom-scrollbar">
                                {(() => {
                                    let actualMsgIdx = 0;
                                    return quote.messages.map((msg, idx) => {
                                        if (msg.isContext) {
                                            return (
                                                <div key={idx} className="flex justify-center w-full">
                                                    <div className="bg-white/10 border border-white/5 text-white/60 text-[11px] md:text-xs px-6 py-2 rounded-full text-center max-w-[85%] shadow-lg backdrop-blur-md font-medium">
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const isRight = actualMsgIdx % 2 !== 0;
                                        actualMsgIdx++;

                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex gap-4 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}
                                            >
                                                <Avatar src={msg.user.profilePicture || ""} size="sm" className="mt-1 shadow-xl border border-white/10 shrink-0" />
                                                <div className={`max-w-[80%] md:max-w-[70%] space-y-1.5 ${isRight ? 'items-end flex flex-col' : ''}`}>
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                                                        <span className="text-white/60">{msg.user.username}</span>
                                                    </div>
                                                    <div className={`p-4 md:p-5 rounded-2xl text-white text-sm md:text-base leading-relaxed shadow-2xl backdrop-blur-md border border-white/5 group/bubble transition-all duration-300 ${isRight
                                                        ? 'bg-purple-600/20 border-purple-500/30 rounded-tr-sm hover:bg-purple-600/30'
                                                        : 'bg-white/10 rounded-tl-sm hover:bg-white/20 hover:border-white/20'
                                                        }`}>
                                                        {msg.message}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Comments Row */}
                        <div className="space-y-4 px-2">
                            <div className="pt-4">
                                <CommentsSection
                                    contentType="quote"
                                    contentId={quote.id}
                                    initialComments={initialComments}
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Info & Metadata */}
                    <div className="space-y-6">
                        {/* Status Boxes */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Views</span>
                                <span className="text-xl font-black text-white">{quote.views.toLocaleString()}</span>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Rating</span>
                                <span className="text-xl font-black text-amber-400">{rating}</span>
                            </div>
                        </div>

                        {/* Details Box */}
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16" />
                            <h3 className="text-sm font-bold text-white/40 mb-6">Transmission Intel</h3>

                            <div className="space-y-6">
                                <div className="flex items-center gap-6 flex-wrap">
                                    <div className="flex items-center gap-4">
                                        <Avatar src={quote.uploadedBy.profilePicture || undefined} size="md" className="border border-white/10" />
                                        <span className="text-white font-bold text-lg leading-none">{quote.uploadedBy.username}</span>
                                    </div>

                                    <div className="h-4 w-px bg-white/10" />

                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-white/50 font-black uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                            Memory Archive
                                        </span>
                                        <span className="text-[11px] text-white/20 font-bold px-2.5 py-1 border border-white/5 rounded-lg uppercase tracking-widest">
                                            {new Date(quote.uploadedAt).toLocaleDateString("de-DE")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md justify-center">
                            <Button
                                size="md"
                                className="bg-transparent text-white font-bold hover:bg-white/10 rounded-xl flex-1"
                                startContent={<FontAwesomeIcon icon={faStar} className="text-amber-400" />}
                                onPress={() => setIsRatingModalOpen(true)}
                            >
                                Rate
                            </Button>
                            <Button
                                size="md"
                                className="bg-transparent text-white font-bold hover:bg-white/10 rounded-xl flex-1"
                                startContent={<FontAwesomeIcon icon={faShare} />}
                                onPress={handleShare}
                            >
                                Share
                            </Button>

                            <Dropdown placement="bottom-end">
                                <DropdownTrigger>
                                    <Button
                                        isIconOnly
                                        size="md"
                                        variant="flat"
                                        className="bg-transparent text-white/40 hover:text-white rounded-xl"
                                    >
                                        <FontAwesomeIcon icon={faEllipsisVertical} />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Administrative Actions" className="p-2">
                                    <DropdownItem
                                        key="edit"
                                        href={`/quotes/${quote.id}/edit`}
                                        as={Link}
                                        startContent={<FontAwesomeIcon icon={faEdit} className="text-xs" />}
                                    >
                                        Edit Quote
                                    </DropdownItem>
                                    <DropdownItem
                                        key="delete"
                                        className="text-danger"
                                        color="danger"
                                        variant="flat"
                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                    >
                                        <DeleteButton
                                            id={quote.id}
                                            type="quote"
                                            ownerId={quote.uploadedBy.id}
                                            redirectUrl="/quotes"
                                        />
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>

                        {/* Participants Box */}
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 group hover:border-purple-500/30 transition-all duration-300">
                            <h3 className="text-sm font-bold text-white/40 mb-3">Transmission Group</h3>
                            <div className="space-y-4">
                                {quote.participants.map((participant, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group/member p-2 rounded-xl hover:bg-white/5 transition-colors">
                                        <Avatar src={participant.profilePicture || undefined} size="sm" className="border-2 border-white/5 group-hover/member:border-purple-500/30" />
                                        <div>
                                            <p className="text-white/90 font-bold text-sm tracking-wide leading-none mb-1">{participant.username}</p>
                                            <p className="text-[9px] text-white/30 uppercase font-black">Member</p>
                                        </div>
                                    </div>
                                ))}
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
        </PageShell>
    );
}
