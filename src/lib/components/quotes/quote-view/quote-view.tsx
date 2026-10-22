"use client";

import { incrementView } from '@/src/lib/actions/views';
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import { cn } from '@/src/lib/utils';
import { Comment, Quote } from '@/src/lib/types/types';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CommentsSection } from '../../shared/comments-section';
import { RatingModal } from '../../shared/rating-modal';
import { ActionBar, InfoCard, MetaRow, Stage, TitleRow, ViewPage } from '../../shared/view-parts';

export default function QuoteView({ quote, initialComments = [] }: { quote: Quote, initialComments?: Comment[] }) {
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    useEffect(() => {
        incrementView('quote', quote.id);
    }, [quote.id]);

    // Bubble side flips only when the speaker changes, so consecutive
    // messages from the same user stay on the same side.
    let side = false;
    let lastUserId: string | null = null;

    return (
        <ViewPage backHref="/quotes">
            <div className="space-y-6 xl:col-span-3">
                <Stage className="flex min-h-[60vh] flex-col">
                    <div className="max-h-[75vh] flex-1 space-y-2 overflow-y-auto p-8 custom-scrollbar md:p-12">
                        {quote.messages.map((msg, idx) => {
                            if (msg.isContext) {
                                lastUserId = null;
                                return (
                                    <div key={msg.id ?? idx} className="flex w-full justify-center py-3">
                                        <div className="max-w-[85%] rounded-full border border-border bg-muted px-6 py-2 text-center text-xs text-muted-foreground">
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            }

                            const sameAsPrev = lastUserId === msg.user.id;
                            if (lastUserId !== null && !sameAsPrev) side = !side;
                            const isRight = side;
                            lastUserId = msg.user.id;

                            return (
                                <motion.div
                                    key={msg.id ?? idx}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn('flex gap-4', isRight && 'flex-row-reverse', !sameAsPrev && idx > 0 && 'pt-4')}
                                >
                                    <UserAvatar
                                        src={msg.user.profilePicture || undefined}
                                        name={msg.user.username?.[0]?.toUpperCase()}
                                        size="sm"
                                        className={cn('mt-1 shrink-0 border border-border', sameAsPrev && 'invisible')}
                                    />
                                    <div className={cn('flex max-w-[80%] flex-col gap-1 md:max-w-[70%]', isRight && 'items-end')}>
                                        {!sameAsPrev && (
                                            <span className="text-xs font-medium text-muted-foreground">{msg.user.username}</span>
                                        )}
                                        <div
                                            className={cn(
                                                'rounded-2xl border border-border p-4 text-sm leading-relaxed md:text-base',
                                                isRight ? 'rounded-tr-sm bg-muted' : 'rounded-tl-sm bg-card'
                                            )}
                                        >
                                            {msg.message}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </Stage>

                <div className="space-y-6 px-2">
                    <TitleRow title={`Quote by ${quote.uploadedBy.username}`}>
                        <ActionBar
                            type="quote"
                            id={quote.id}
                            ownerId={quote.uploadedBy.id}
                            onRate={() => setIsRatingModalOpen(true)}
                        />
                    </TitleRow>

                    <MetaRow
                        uploader={quote.uploadedBy}
                        date={quote.createdAt}
                        views={quote.views}
                        rating={quote.averageRating}
                    />

                    <div className="pt-4">
                        <CommentsSection contentType="quote" contentId={quote.id} initialComments={initialComments} />
                    </div>
                </div>
            </div>

            <div className="w-full xl:col-span-1">
                <InfoCard title="Participants">
                    <ul className="space-y-1">
                        {quote.participants.map((participant) => (
                            <li key={participant.id} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted">
                                <UserAvatar
                                    src={participant.profilePicture || undefined}
                                    name={participant.username?.[0]?.toUpperCase()}
                                    size="sm"
                                    className="border border-border"
                                />
                                <span className="text-sm font-medium text-foreground">{participant.username}</span>
                            </li>
                        ))}
                    </ul>
                </InfoCard>
            </div>

            <RatingModal
                contentType="quote"
                contentId={quote.id}
                isOpen={isRatingModalOpen}
                onOpenChange={setIsRatingModalOpen}
            />
        </ViewPage>
    );
}
