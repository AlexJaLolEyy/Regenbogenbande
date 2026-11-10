import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import type { VideoListItem } from "../../../types/types";
import { CategoryBadge } from '../../ui/category-badge';
import { CardMeta, CardTitle, HOVER_REVEAL, MediaCard, ParticipantStack, THUMB_ZOOM } from '../../ui/media-card';

export default function VideoComponent({ video }: { video: VideoListItem }) {
  return (
    <Link href={`/videos/${video.id}`} className="block rounded-2xl focus-visible:outline-2 outline-theme-accent">
      <MediaCard isNew={video.isSeen === false}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-black">
          <Image
            width={500}
            height={500}
            src={video.thumbnailUrl || "/bg-1.jpg"}
            alt={video.title}
            className={`h-full w-full object-cover ${THUMB_ZOOM}`}
          />

          {video.category?.name && (
            <CategoryBadge category={video.category} overlay className="absolute left-2 top-2 z-20" />
          )}

          <div className={`absolute inset-0 flex items-center justify-center ${HOVER_REVEAL}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md">
              <Play size={20} fill="currentColor" className="ml-0.5" />
            </div>
          </div>

          {video.participants?.length > 0 && (
            <div className={`absolute bottom-2 left-2 z-20 ${HOVER_REVEAL}`}>
              <ParticipantStack participants={video.participants} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="space-y-2 border-t border-divider p-3">
          <CardTitle title={video.title}>{video.title}</CardTitle>
          <CardMeta user={video.uploadedBy} date={video.createdAt} views={video.views} rating={video.averageRating} />
        </div>
      </MediaCard>
    </Link>
  );
}
