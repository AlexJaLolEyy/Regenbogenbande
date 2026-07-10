import { cn } from "@/src/lib/utils";
import { faClock, faEye, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { PictureListItem } from "../../../types/types";

export default function PictureComponent({ picture, mode = 'grid' }: { picture: PictureListItem, mode?: 'grid' | 'masonry' }) {
  return (
    <Link href={`/pictures/${picture.id}`} className={cn("block", mode === 'grid' ? "h-full" : "h-auto")}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        className={cn(
          "group relative flex flex-col bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-[0_0_20px_-5px_rgba(245,245,220,0.3)] hover:border-[#F5F5DC]/50 transition-all duration-300",
          mode === 'grid' ? "h-full" : "h-auto break-inside-avoid mb-6"
        )}
      >
        {/* Image Container */}
        <div className={cn(
          "relative bg-black overflow-hidden w-full",
          mode === 'grid' ? "aspect-video" : "min-h-40 max-h-[70vh]"
        )}>
          {/* Blurred Background for Odd Aspect Ratios */}
          <Image
            width={100}
            height={100}
            src={picture.thumbnailUrl}
            alt="background"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110"
            aria-hidden="true"
          />

          {/* Main Image */}
          <Image
            width={500}
            height={500}
            src={picture.thumbnailUrl}
            alt={picture.title || 'Picture'}
            className={cn(
              "relative z-10 w-full transition duration-500 scale-100 group-hover:scale-105 opacity-90 group-hover:opacity-100",
              mode === 'grid' ? "h-full object-contain" : "h-auto block min-h-40 max-h-[70vh] object-contain"
            )}
            loading="lazy"
          />

          {/* Date Pill - Matches Video Style */}
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white/90 z-20 shadow-lg">
            {new Date(picture.createdAt).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>

        {/* Footer - Unified with Video Style */}
        <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center justify-between gap-3 relative z-10 shrink-0">
          {/* Left: Title & User */}
          <div className="flex flex-col min-w-0 flex-1 gap-1.5">
            <h3 className="text-white font-bold text-sm leading-tight line-clamp-1 group-hover:text-purple-300 transition-colors" title={picture.title}>{picture.title || 'Untitled'}</h3>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <div className="flex items-center gap-1.5 min-w-0 group/user">
                <div className="w-5 h-5 shrink-0 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-white/10 group-hover/user:ring-purple-500/50 transition-all">
                  {picture.uploadedBy?.profilePicture ? (
                    <Image width={100} height={100} src={picture.uploadedBy.profilePicture} alt={picture.uploadedBy.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-white/50">?</div>
                  )}
                </div>
                <span className="truncate max-w-24 group-hover/user:text-white transition-colors">{picture.uploadedBy?.username || 'Anon'}</span>
              </div>
            </div>
          </div>

          {/* Right: Views & Rating & Clock - Standardized Two-Row Layout */}
          <div className="flex flex-col items-end gap-1 shrink-0 h-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-white/40">
                <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                <span>{picture.views || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 drop-shadow-sm">
                <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
                <span>{picture.averageRating ? picture.averageRating.toFixed(1) : "0.0"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
              <span>{new Date(picture.uploadedAt).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

