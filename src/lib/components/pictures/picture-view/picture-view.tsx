"use client";

import { incrementView } from '@/src/lib/actions/views';
import { Comment, Picture } from '@/src/lib/types/types';
import { Button } from "@heroui/react";
import { Maximize2 } from 'lucide-react';
import NextImage from 'next/image';
import { useEffect, useState } from 'react';
import { CommentsSection } from '../../shared/comments-section';
import { ImageLightbox } from '../../shared/image-lightbox';
import { RatingModal } from '../../shared/rating-modal';
import { RecommendationsSection } from '../../shared/recommendations-section';
import { ActionBar, InfoCard, MetaRow, Participants, Stage, TitleRow, ViewPage } from '../../shared/view-parts';

export default function PictureView({ picture, initialComments = [] }: { picture: Picture, initialComments?: Comment[] }) {
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    useEffect(() => {
        incrementView('picture', picture.id);
    }, [picture.id]);

    return (
        <ViewPage backHref="/pictures">
            <div className="space-y-6 xl:col-span-3">
                <Stage className="flex aspect-video max-h-[75vh] items-center justify-center">
                    {/* Blurred backdrop fills the stage for any aspect ratio */}
                    <div className="absolute inset-0 z-0">
                        <NextImage
                            src={picture.imageUrl}
                            fill
                            sizes="75vw"
                            className="scale-110 object-cover opacity-20 blur-2xl"
                            alt=""
                            aria-hidden="true"
                        />
                        <div className="absolute inset-0 bg-black/60" />
                    </div>

                    {/* Image keeps its natural size when small (no upscaling) and fits when large or tall */}
                    <div className="relative z-10 flex h-full w-full items-center justify-center">
                        <NextImage
                            src={picture.imageUrl}
                            alt={picture.title}
                            width={1920}
                            height={1080}
                            priority
                            onClick={() => setIsLightboxOpen(true)}
                            className="h-auto max-h-full w-auto max-w-full cursor-zoom-in object-contain"
                        />
                    </div>

                    <div className="absolute right-4 top-4 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            aria-label="Open fullscreen"
                            className="rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md"
                            onPress={() => setIsLightboxOpen(true)}
                        >
                            <Maximize2 size={14} />
                        </Button>
                    </div>
                </Stage>

                <div className="space-y-6 px-2">
                    <TitleRow title={picture.title}>
                        <ActionBar
                            type="picture"
                            id={picture.id}
                            ownerId={picture.uploadedBy.id}
                            onRate={() => setIsRatingModalOpen(true)}
                        />
                    </TitleRow>

                    <MetaRow
                        uploader={picture.uploadedBy}
                        category={picture.category}
                        date={picture.createdAt}
                        views={picture.views}
                        rating={picture.averageRating}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <InfoCard title="Description" className="md:col-span-2">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                {picture.description || "No description provided."}
                            </p>
                        </InfoCard>
                        <InfoCard title="Participants">
                            <Participants participants={picture.participants} />
                        </InfoCard>
                    </div>

                    <div className="pt-4">
                        <CommentsSection contentType="picture" contentId={picture.id} initialComments={initialComments} />
                    </div>
                </div>
            </div>

            <div className="w-full xl:col-span-1">
                <RecommendationsSection contentType="picture" currentId={picture.id} categoryId={picture.category.id} />
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
        </ViewPage>
    );
}
