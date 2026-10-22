"use client";

import { incrementView } from '@/src/lib/actions/views';
import { Comment, Video } from '@/src/lib/types/types';
import NextImage from 'next/image';
import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { CommentsSection } from '../../shared/comments-section';
import { RatingModal } from '../../shared/rating-modal';
import { RecommendationsSection } from '../../shared/recommendations-section';
import { ActionBar, InfoCard, MetaRow, Participants, Stage, TitleRow, ViewPage } from '../../shared/view-parts';

export default function VideoView({ video, initialComments = [] }: { video: Video, initialComments?: Comment[] }) {
    const [hasWindow, setHasWindow] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const viewIncrementedRef = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => setHasWindow(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!viewIncrementedRef.current) {
            viewIncrementedRef.current = true;
            incrementView('video', video.id);
        }
    }, [video.id]);

    return (
        <ViewPage backHref="/videos">
            {/* Stage */}
            <div className="space-y-6 xl:col-span-3">
                <Stage className="flex aspect-video max-h-[75vh] items-center justify-center">
                    {video.thumbnailUrl && (
                        <div className="absolute inset-0 z-0">
                            <NextImage
                                src={video.thumbnailUrl}
                                fill
                                className="scale-110 object-cover opacity-20 blur-2xl"
                                alt=""
                                aria-hidden="true"
                            />
                            <div className="absolute inset-0 bg-black/60" />
                        </div>
                    )}
                    <div className="relative z-10 h-full w-full">
                        {hasWindow && (
                            <ReactPlayer
                                src={video.videoUrl}
                                width="100%"
                                height="100%"
                                controls
                                playing={!isRatingModalOpen}
                                className="react-player"
                            />
                        )}
                    </div>
                </Stage>

                <div className="space-y-6 px-2">
                    <TitleRow title={video.title}>
                        <ActionBar
                            type="video"
                            id={video.id}
                            ownerId={video.uploadedBy.id}
                            onRate={() => setIsRatingModalOpen(true)}
                        />
                    </TitleRow>

                    <MetaRow
                        uploader={video.uploadedBy}
                        category={video.category}
                        date={video.createdAt}
                        views={video.views}
                        rating={video.averageRating}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <InfoCard title="Description" className="md:col-span-2">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                {video.description || "No description provided."}
                            </p>
                        </InfoCard>
                        <InfoCard title="Participants">
                            <Participants participants={video.participants} />
                        </InfoCard>
                    </div>

                    <div className="pt-4">
                        <CommentsSection contentType="video" contentId={video.id} initialComments={initialComments} />
                    </div>
                </div>
            </div>

            {/* Rail */}
            <div className="w-full xl:col-span-1">
                <RecommendationsSection contentType="video" currentId={video.id} categoryId={video.category.id} />
            </div>

            <RatingModal
                contentType="video"
                contentId={video.id}
                isOpen={isRatingModalOpen}
                onOpenChange={setIsRatingModalOpen}
            />
        </ViewPage>
    );
}
