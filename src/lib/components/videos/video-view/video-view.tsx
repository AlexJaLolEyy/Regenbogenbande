"use client";

import { incrementView } from '@/src/lib/actions/views';
import { Comment, Video } from '@/src/lib/types/types';
import { faEye, faPlay, faShare, faStar, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, AvatarGroup, Button, Tooltip } from "@heroui/react";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { CommentsSection } from '../../shared/comments-section';
import { RatingModal } from '../../shared/rating-modal';
import { RecommendationsSection } from '../../shared/recommendations-section';
import { DeleteButton } from '../../ui/delete-button';

export default function VideoView({ video, initialComments = [] }: { video: Video, initialComments?: Comment[] }) {
    const [hasWindow, setHasWindow] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const viewIncrementedRef = useRef(false);

    useEffect(() => {
        // Using setTimeout(..., 0) avoids "cascading renders" warning from React.
        const timer = setTimeout(() => {
            setHasWindow(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Increment view count once per mount.
        // Use a ref to prevent double-counting in React Strict Mode (development).
        if (!viewIncrementedRef.current) {
            viewIncrementedRef.current = true;
            incrementView('video', video.id);
        }
    }, [video.id]);

    const rating = video.averageRating ? video.averageRating.toFixed(1) : "0.0";

    const handleShare = async () => {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
    };

    return (
        <div className="relative z-10 w-full pt-4 pb-32 px-4 md:px-8">

            {/* Back Button */}
            <Link href="/videos" className="fixed top-24 right-8 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition z-50 border border-white/10">
                <FontAwesomeIcon icon={faTimes} />
            </Link>

            <div className="max-w-425 mx-auto grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">

                {/* LEFT COLUMN: Main Player Area */}
                <div className="xl:col-span-3 space-y-6">

                    {/* Video Player Container */}
                    <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative group w-full aspect-video max-h-[70vh] border border-white/10 mx-auto">
                        {hasWindow && (
                            <ReactPlayer
                                src={video.videoUrl}
                                width="100%"
                                height="100%"
                                controls={true}
                                playing={true}
                                light={video.thumbnailUrl && video.thumbnailUrl !== "" ? video.thumbnailUrl : false}
                                playIcon={
                                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:scale-110 transition">
                                        <FontAwesomeIcon icon={faPlay} className="text-white text-3xl ml-1" />
                                    </div>
                                }
                            />
                        )}
                    </div>

                    {/* Title & Actions Row */}
                    <div className="space-y-4 px-2">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{video.title}</h1>
                                <div className="flex items-center gap-4 text-sm text-white/50 flex-wrap">
                                    <span className="flex items-center gap-2">
                                        <Avatar src={video.uploadedBy.profilePicture || ""} size="sm" />
                                        <span className="text-white font-bold">{video.uploadedBy.username}</span>
                                    </span>
                                    <span className="hidden md:inline">•</span>
                                    <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                                    <span className="hidden md:inline">•</span>
                                    <span className="flex items-center gap-1">
                                        <FontAwesomeIcon icon={faEye} /> {video.views}
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
                                <Link href={`/videos/${video.id}/edit`}>
                                    <Button className="rounded-full bg-purple-600 text-white font-bold shadow-lg shadow-purple-900/20">Edit</Button>
                                </Link>
                                <DeleteButton
                                    id={video.id}
                                    type="video"
                                    ownerId={video.uploadedBy.id}
                                    redirectUrl="/videos"
                                />
                            </div>
                        </div>

                        {/* Description & Participants */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="md:col-span-2 bg-[#0a0a0a]/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 hover:bg-[#0a0a0a]/60 transition">
                                <h3 className="text-sm font-bold text-white/40 uppercase mb-4">Description</h3>
                                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{video.description || "No description provided."}</p>
                            </div>

                            <div className="bg-[#0a0a0a]/40 backdrop-blur-md rounded-3xl p-6 border border-white/5 hover:bg-[#0a0a0a]/60 transition">
                                <h3 className="text-sm font-bold text-white/40 uppercase mb-4">Participants</h3>
                                <AvatarGroup max={5} size="sm" isGrid>
                                    {video.participants.map((participant, idx) => {
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
                            contentType="video"
                            contentId={video.id}
                            initialComments={initialComments}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: Recommendations */}
                <div className="w-full xl:col-span-1">
                    <RecommendationsSection
                        contentType="video"
                        currentId={video.id}
                        categoryId={video.category.id}
                    />
                </div>
            </div>

            <RatingModal
                contentType="video"
                contentId={video.id}
                isOpen={isRatingModalOpen}
                onOpenChange={setIsRatingModalOpen}
            />
        </div>
    );
}
