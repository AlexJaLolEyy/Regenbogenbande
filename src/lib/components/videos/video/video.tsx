import { formatDate } from '@/src/lib/utils/format';
import { Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { VideoListItem } from "../../../types/types";
import { CardMeta, MediaCard, MediaPill, ParticipantStack } from '../../ui/media-card';

export default function VideoComponent({ video }: { video: VideoListItem }) {
  return (
    <Link href={`/videos/${video.id}`} className="block rounded-2xl focus-visible:outline-2 outline-theme-accent">
      <MediaCard>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-black">
          <Image
            width={500}
            height={500}
            src={video.thumbnailUrl || "/bg-1.jpg"}
            alt={video.title}
            className="h-full w-full object-cover transition duration-500 group-hover:opacity-75"
          />

          {video.category?.name && (
            <MediaPill className="absolute left-2 top-2 z-20">{video.category.name}</MediaPill>
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md">
              <Play size={20} fill="currentColor" className="ml-0.5" />
            </div>
          </div>

          {video.participants?.length > 0 && (
            <div className="absolute bottom-2 left-2 z-20 opacity-0 transition duration-300 group-hover:opacity-100">
              <ParticipantStack participants={video.participants} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="space-y-2 border-t border-divider p-3">
          <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-foreground" title={video.title}>
            {video.title}
          </h3>
          <CardMeta
            user={video.uploadedBy}
            date={formatDate(video.createdAt)}
            views={video.views}
            rating={video.averageRating}
          />
        </div>
      </MediaCard>
    </Link>
  );
}
