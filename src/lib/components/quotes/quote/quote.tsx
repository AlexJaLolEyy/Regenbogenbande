'use client'

import { computeBubbleLayout } from "../bubble-layout";
import { cn } from '@/src/lib/utils';
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import { Quote as QuoteIcon } from 'lucide-react';
import Link from 'next/link';
import { QuoteListItem } from '../../../types/types';
import { CardMeta, MediaCard, ParticipantStack } from '../../ui/media-card';

const MAX_PREVIEW = 4;

export default function QuoteComponent({ quote }: { quote: QuoteListItem }) {
  const displayMessages = quote.messages.slice(0, MAX_PREVIEW);
  const remaining = quote.messages.length - MAX_PREVIEW;

  // Bubble side flips only when the speaker changes, so consecutive
  // messages from the same user stay bound to the same side.
  const layout = computeBubbleLayout(displayMessages.map((m) => (m.isContext ? null : m.user.id)));

  return (
    <Link href={`/quotes/${quote.id}`} className="mb-6 block h-full rounded-2xl focus-visible:outline-2 outline-theme-accent">
      <MediaCard isNew={quote.isSeen === false} className="flex break-inside-avoid flex-col">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          {quote.participants?.length > 0 ? (
            <ParticipantStack participants={quote.participants} max={4} tone="card" />
          ) : (
            <span />
          )}
          <QuoteIcon size={18} className="text-faint" />
        </div>

        <div className="flex-1 space-y-3 px-5 pb-4">
          {displayMessages.map((msg, idx) => {
            if (msg.isContext) {
              return (
                <div key={msg.id} className="flex w-full justify-center px-2">
                  <div className="max-w-[90%] rounded-full border border-border bg-muted px-4 py-1.5 text-center text-[11px] italic text-muted-foreground">
                    {msg.message}
                  </div>
                </div>
              );
            }

            const { isRight, sameAsPrev } = layout[idx];

            return (
              <div key={msg.id} className={cn('flex gap-3', isRight && 'flex-row-reverse', sameAsPrev && '-mt-1.5')}>
                <UserAvatar
                  src={msg.user.profilePicture || undefined}
                  name={msg.user.username?.[0]?.toUpperCase()}
                  size="sm"
                  className={cn('mt-1 h-6 w-6 shrink-0', sameAsPrev && 'invisible')}
                />
                <div
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-2xl border border-border p-3 text-sm leading-relaxed',
                    idx === 0 && 'text-base',
                    isRight ? 'rounded-tr-none bg-muted' : 'rounded-tl-none bg-card'
                  )}
                >
                  {!sameAsPrev && (
                    <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{msg.user.username}</span>
                  )}
                  {msg.message}
                </div>
              </div>
            );
          })}
          {remaining > 0 && (
            <div className="flex justify-center pt-1">
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                +{remaining} more
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-divider p-3">
          <CardMeta
            user={quote.uploadedBy}
            date={quote.createdAt}
            views={quote.views}
            rating={quote.averageRating}
          />
        </div>
      </MediaCard>
    </Link>
  );
}
