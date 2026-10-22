'use client'

import { cn } from '@/src/lib/utils';
import { UserAvatar } from "@/src/lib/components/ui/user-avatar";
import { formatDate } from '@/src/lib/utils/format';
import { Quote as QuoteIcon } from 'lucide-react';
import Link from 'next/link';
import { QuoteListItem } from '../../../types/types';
import { CardMeta, MediaCard } from '../../ui/media-card';

const MAX_PREVIEW = 4;

export default function QuoteComponent({ quote }: { quote: QuoteListItem }) {
  const displayMessages = quote.messages.slice(0, MAX_PREVIEW);
  const remaining = quote.messages.length - MAX_PREVIEW;

  // Bubble side flips only when the speaker changes, so consecutive
  // messages from the same user stay bound to the same side.
  let side = false; // false = left, true = right
  let lastUserId: string | null = null;

  return (
    <Link href={`/quotes/${quote.id}`} className="mb-6 block h-full rounded-2xl focus-visible:outline-2 outline-theme-accent">
      <MediaCard className="flex break-inside-avoid flex-col">
        <div className="flex items-start justify-between px-5 pb-2 pt-5">
          <QuoteIcon size={22} className="text-faint" />
        </div>

        <div className="flex-1 space-y-3 px-5 pb-4">
          {displayMessages.map((msg) => {
            if (msg.isContext) {
              return (
                <div key={msg.id} className="flex w-full justify-center px-2">
                  <div className="max-w-[90%] rounded-full border border-border bg-muted px-4 py-1.5 text-center text-[11px] italic text-muted-foreground">
                    {msg.message}
                  </div>
                </div>
              );
            }

            if (lastUserId !== null && lastUserId !== msg.user.id) side = !side;
            const isRight = side;
            const sameAsPrev = lastUserId === msg.user.id;
            lastUserId = msg.user.id;

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
            <div className="mt-2 border-t border-dashed border-divider pt-2 text-center text-xs italic text-faint">
              + {remaining} more messages...
            </div>
          )}
        </div>

        <div className="border-t border-divider p-3">
          <CardMeta
            user={quote.uploadedBy}
            date={formatDate(quote.createdAt)}
            views={quote.views}
            rating={quote.averageRating}
          />
        </div>
      </MediaCard>
    </Link>
  );
}
