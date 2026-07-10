"use client";

import { incrementView } from '@/src/lib/actions/views';
import { Comment, Video } from '@/src/lib/types/types';
import { faEdit, faEllipsisVertical, faEye, faShare, faStar, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar, AvatarGroup, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Tooltip } from "@heroui/react";
import NextImage from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { CommentsSection } from '../../shared/comments-section';
import { RatingModal } from '../../shared/rating-modal';
import { RecommendationsSection } from '../../shared/recommendations-section';
import { DeleteButton } from '../../ui/delete-button';
import { PageShell } from '../../ui/page-shell';

export default function VideoView({ video, initialComments = [] }: { video: Video, initialComments?: Comment[] }) {
    const [hasWindow, setHasWindow] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const viewIncrementedRef = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setHasWindow(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
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
        <PageShell variant="aurora">
            <div className="relative z-10 w-full pt-24 pb-8 px-4 md:px-8">
                {/* Back Button */}
                <Link
                    href="/videos"
                    className="fixed top-24 right-8 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition z-50 border border-white/10 group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <FontAwesomeIcon icon={faTimes} className="relative z-10" />
                </Link>

                <div className="max-w-450 mx-auto grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                    {/* LEFT COLUMN: Main Player Area */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Video Player Container with Backdrop */}
                        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative group w-full aspect-video max-h-[75vh] flex items-center justify-center">
                            {/* Blurry Backdrop (fills the space if video aspect deviates) */}
                            {video.thumbnailUrl && (
                                <div className="absolute inset-0 z-0">
                                    <NextImage
                                        src={video.thumbnailUrl}
                                        fill
                                        className="object-cover opacity-20 blur-2xl scale-110"
                                        alt="background"
                                        aria-hidden="true"
                                    />
                                    <div className="absolute inset-0 bg-black/60" />
                                </div>
                            )}

                            {/* Main Player */}
                            <div className="relative z-10 w-full h-full">
                                {hasWindow && (
                                    <ReactPlayer
                                        src={video.videoUrl}
                                        width="100%"
                                        height="100%"
                                        controls
                                        playing
                                        className="react-player"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Title & Actions Row */}
                        <div className="space-y-6 px-2">
                            <div className="flex flex-col gap-6">
                                {/* Header Row: Title + Buttons */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight text-glow">
                                        {video.title}
                                    </h1>

                                    <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shrink-0">
                                        <Button
                                            size="sm"
                                            className="bg-transparent text-white font-bold hover:bg-white/10 rounded-xl px-4"
                                            startContent={<FontAwesomeIcon icon={faStar} className="text-amber-400" />}
                                            onPress={() => setIsRatingModalOpen(true)}
                                        >
                                            Rate
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-transparent text-white font-bold hover:bg-white/10 rounded-xl px-4"
                                            startContent={<FontAwesomeIcon icon={faShare} />}
                                            onPress={handleShare}
                                        >
                                            Share
                                        </Button>

                                        <Dropdown placement="bottom-end">
                                            <DropdownTrigger>
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-transparent text-white/40 hover:text-white rounded-xl"
                                                >
                                                    <FontAwesomeIcon icon={faEllipsisVertical} />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu aria-label="Administrative Actions" className="p-2">
                                                <DropdownItem
                                                    key="edit"
                                                    href={`/videos/${video.id}/edit`}
                                                    as={Link}
                                                    startContent={<FontAwesomeIcon icon={faEdit} className="text-xs" />}
                                                >
                                                    Edit Video
                                                </DropdownItem>
                                                <DropdownItem
                                                    key="delete"
                                                    className="text-danger"
                                                    color="danger"
                                                    variant="flat"
                                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                >
                                                    <DeleteButton
                                                        id={video.id}
                                                        type="video"
                                                        ownerId={video.uploadedBy.id}
                                                        redirectUrl="/videos"
                                                    />
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                </div>

                                {/* Second Row: Uploader/Category + Stats */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-t border-white/5 pt-6">
                                    <div className="flex items-center gap-6 flex-wrap">
                                        <div className="flex items-center gap-4">
                                            <Avatar src={video.uploadedBy.profilePicture || undefined} size="md" className="border border-white/10" />
                                            <span className="text-white font-bold text-lg leading-none">{video.uploadedBy.username}</span>
                                        </div>

                                        <div className="h-4 w-px bg-white/10" />

                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-white/50 font-black uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 flex items-center gap-2">
                                                {video.category.iconUrl && (
                                                    <NextImage src={video.category.iconUrl} alt="" width={12} height={12} className="opacity-70" />
                                                )}
                                                {video.category.name}
                                            </span>
                                            <span className="text-[11px] text-white/20 font-bold px-2.5 py-1 border border-white/5 rounded-lg uppercase tracking-widest">
                                                {new Date(video.uploadedAt).toLocaleDateString("de-DE")}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 shrink-0">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Total Views</span>
                                            <div className="flex items-center gap-2 text-xl font-black text-white/90">
                                                <FontAwesomeIcon icon={faEye} className="text-white/10 text-xs" />
                                                {video.views.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-white/5" />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Member Rating</span>
                                            <div className="flex items-center gap-2 text-xl font-black text-amber-400">
                                                <FontAwesomeIcon icon={faStar} className="text-xs" />
                                                {rating}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="md:col-span-2 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                                    <h3 className="text-sm font-bold text-white/40 mb-3">Description</h3>
                                    <p className="text-white/70 leading-relaxed whitespace-pre-wrap text-sm">{video.description || "No transmission description provided."}</p>
                                </div>

                                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                                    <h3 className="text-sm font-bold text-white/40 mb-3">Group Members</h3>
                                    <AvatarGroup max={6} size="sm" isGrid className="justify-start">
                                        {video.participants.map((participant, idx) => (
                                            <Tooltip key={idx} content={participant.username} className="font-bold">
                                                <Avatar src={participant.profilePicture || undefined} name={participant.username} className="border-2 border-white/10" />
                                            </Tooltip>
                                        ))}
                                    </AvatarGroup>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="pt-4">
                                <CommentsSection
                                    contentType="video"
                                    contentId={video.id}
                                    initialComments={initialComments}
                                />
                            </div>
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
        </PageShell>
    );
}
