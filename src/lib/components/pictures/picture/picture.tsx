import { cn } from "@/src/lib/utils";
import { formatDate } from '@/src/lib/utils/format';
import Image from 'next/image';
import Link from 'next/link';
import type { PictureListItem } from "../../../types/types";
import { CardMeta, MediaCard, MediaPill, ParticipantStack } from '../../ui/media-card';

export default function PictureComponent({ picture, mode = 'grid' }: { picture: PictureListItem, mode?: 'grid' | 'masonry' }) {
  return (
    <Link href={`/pictures/${picture.id}`} className={cn("block rounded-2xl focus-visible:outline-2 outline-theme-accent", mode === 'grid' ? "h-full" : "h-auto")}>
      <MediaCard className={cn("flex flex-col", mode === 'grid' ? "h-full" : "h-auto break-inside-avoid mb-6")}>
        {/* Image */}
        <div
          className={cn(
            "relative w-full overflow-hidden bg-black",
            mode === 'grid' ? "aspect-video" : "min-h-40 max-h-[70vh]"
          )}
        >
          {/* Blurred backdrop for odd aspect ratios */}
          <Image
            width={100}
            height={100}
            src={picture.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
            aria-hidden="true"
          />

          <Image
            width={500}
            height={500}
            src={picture.thumbnailUrl}
            alt={picture.title || 'Picture'}
            className={cn(
              "relative z-10 w-full transition duration-500 group-hover:opacity-90",
              mode === 'grid' ? "h-full object-contain" : "block h-auto min-h-40 max-h-[70vh] object-contain"
            )}
            loading="lazy"
          />

          {picture.category?.name && (
            <MediaPill className="absolute left-2 top-2 z-20">{picture.category.name}</MediaPill>
          )}

          {picture.participants?.length > 0 && (
            <div className="absolute bottom-2 left-2 z-20 opacity-0 transition duration-300 group-hover:opacity-100">
              <ParticipantStack participants={picture.participants} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 space-y-2 border-t border-divider p-3">
          <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-foreground" title={picture.title}>
            {picture.title || 'Untitled'}
          </h3>
          <CardMeta
            user={picture.uploadedBy}
            date={formatDate(picture.createdAt)}
            views={picture.views}
            rating={picture.averageRating}
          />
        </div>
      </MediaCard>
    </Link>
  );
}
