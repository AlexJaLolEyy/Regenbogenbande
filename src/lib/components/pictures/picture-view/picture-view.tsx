"use client";

import { incrementView } from '@/src/lib/actions/views';
import { Comment, Picture } from '@/src/lib/types/types';
import { faExpand, faEye, faShare, faStar, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, AvatarGroup, Button, Image, Tooltip } from "@heroui/react";
import NextImage from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CommentsSection } from '../../shared/comments-section';
import { ImageLightbox } from '../../shared/image-lightbox';
import { RatingModal } from '../../shared/rating-modal';
import { RecommendationsSection } from '../../shared/recommendations-section';
import { DeleteButton } from '../../ui/delete-button';

export default function PictureView({ picture, initialComments = [] }: { picture: Picture, initialComments?: Comment[] }) {
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    useEffect(() => {
        incrementView('picture', picture.id);
    }, [picture.id]);

    const rating = picture.averageRating ? picture.averageRating.toFixed(1) : "0.0";

    const handleShare = async () => {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
    };

    return (
        <div className="relative z-10 w-full pt-4 pb-32 px-4 md:px-8">

            {/* Back Button */}
            <Link href="/pictures" className="fixed top-24 right-8 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition z-50 border border-white/10">
                <FontAwesomeIcon icon={faTimes} />
            </Link>

            <div className="max-w-450 mx-auto grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">

                {/* LEFT COLUMN: Main Content */}
                <div className="xl:col-span-3 space-y-6">

                    {/* Image Stage */}
                    <div className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative group w-full h-[65vh] flex items-center justify-center p-0">
                        {/* Blurry Background */}
                        <div className="absolute inset-0">
                            <Image
                                as={NextImage}
                                src={picture.imageUrl}
                                className="w-full h-full object-cover opacity-30 blur-3xl scale-110"
                                alt="background"
                                removeWrapper
                                width={1920}
                                height={1080}
                            />
                            <div className="absolute inset-0 bg-black/40" />
                        </div>

                        {/* Main Image */}
                        <Image
                            as={NextImage}
                            src={picture.imageUrl}
                            className="relative z-10 w-full h-full object-contain cursor-zoom-in"
                            alt={picture.title}
                            removeWrapper
                            width={1920}
                            height={1080}
                            onClick={() => setIsLightboxOpen(true)}
                        />

                        {/* Overlay Controls */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition flex gap-2 z-20">
                            <Button
                                isIconOnly
                                variant="flat"
                                className="bg-black/60 text-white rounded-full backdrop-blur-md"
                                onClick={() => setIsLightboxOpen(true)}
                            >
                                <FontAwesomeIcon icon={faExpand} />
                            </Button>
                        </div>
                    </div>

                    {/* Title & Stats */}
                    <div className="space-y-4 px-2">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{picture.title}</h1>
                                <div className="flex items-center gap-4 text-sm text-white/50 flex-wrap">
                                    <span className="flex items-center gap-2">
                                        <Avatar src={picture.uploadedBy.profilePicture || ""} size="sm" />
                                        <span className="text-white font-bold">{picture.uploadedBy.username}</span>
                                    </span>
                                    <span className="hidden md:inline">•</span>
                                    <span>{new Date(picture.uploadedAt).toLocaleDateString()}</span>
                                    <span className="hidden md:inline">•</span>
                                    <span className="flex items-center gap-1">
                                        <FontAwesomeIcon icon={faEye} /> {picture.views}
                                    </span>
                                    <span className="hidden md:inline">•</span>
                                    <span className="flex items-center gap-1 text-yellow-400">
                                        <FontAwesomeIcon icon={faStar} size="xs" /> {rating}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="rounded-full bg-white/5 text-white border border-white/5 font-bold"
                                    startContent={<FontAwesomeIcon icon={faStar} className="text-yellow-400" />}
                                    onPress={() => setIsRatingModalOpen(true)}
                                >
                                    Rate
                                </Button>
                                <Button
                                    className="rounded-full bg-white/5 text-white border border-white/5 font-bold"
                                    startContent={<FontAwesomeIcon icon={faShare} />}
                                    onPress={handleShare}
                                >
                                    Share
                                </Button>
                                <Link href={`/pictures/${picture.id}/edit`}>
                                    <Button className="rounded-full bg-purple-600 text-white font-bold shadow-lg shadow-purple-900/20">Edit</Button>
                                </Link>
                                <DeleteButton
                                    id={picture.id}
                                    type="picture"
                                    ownerId={picture.uploadedBy.id}
                                    redirectUrl="/pictures"
                                />
                            </div>
                        </div>

                        {/* Description & Participants */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="md:col-span-2 bg-[#0a0a0a]/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 hover:bg-[#0a0a0a]/60 transition">
                                <h3 className="text-sm font-bold text-white/40 uppercase mb-4">Description</h3>
                                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{picture.description || "No description provided."}</p>
                            </div>

                            <div className="bg-[#0a0a0a]/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 hover:bg-[#0a0a0a]/60 transition">
                                <h3 className="text-sm font-bold text-white/40 uppercase mb-4">Participants</h3>
                                <AvatarGroup max={5} size="sm" isGrid>
                                    {picture.participants.map((participant, idx) => {
                                        const name = participant.username;
                                        const src = participant.profilePicture;
                                        return (
                                            <Tooltip key={idx} content={name}>
                                                <Avatar src={src || undefined} name={name} />
                                            </Tooltip>
                                        );
                                    })}
                                </AvatarGroup>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <CommentsSection
                            contentType="picture"
                            contentId={picture.id}
                            initialComments={initialComments}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: Recommendations */}
                <div className="w-full xl:col-span-1">
                    <RecommendationsSection
                        contentType="picture"
                        currentId={picture.id}
                        categoryId={picture.category.id}
                    />
                </div>
            </div>

            <RatingModal
                contentType="picture"
                contentId={picture.id}
                isOpen={isRatingModalOpen}
                onOpenChange={setIsRatingModalOpen}
            />

            <ImageLightbox
                imageUrl={picture.imageUrl}
                title={picture.title}
                isOpen={isLightboxOpen}
                onOpenChange={setIsLightboxOpen}
            />
        </div>
    );
}
