import { faClock, faEye, faPlay, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { VideoListItem } from "../../../types/types";


export default function VideoComponent({ video }: { video: VideoListItem }) {
  return (
    <Link href={`/videos/${video.id}`}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="group relative bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-[0_0_20px_-5px_rgba(245,245,220,0.3)] hover:border-[#F5F5DC]/50 transition-all duration-300"
      >
        {/* Thumbnail Container */}
        <div className="aspect-video bg-black relative overflow-hidden">
          <Image
            width={500}
            height={500}
            src={video.thumbnailUrl || "/bg-1.jpg"}
            alt={video.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition duration-500 scale-100"
          />
          {/* Creation Date Pill */}
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white/90 z-20 shadow-lg">
            {new Date(video.createdAt).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <FontAwesomeIcon icon={faPlay} className="ml-1 text-lg drop-shadow-md" />
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center justify-between gap-3 relative z-10">
          {/* Left: Title & User */}
          <div className="flex flex-col min-w-0 flex-1 gap-1.5">
            <h3 className="text-white font-bold text-sm leading-tight line-clamp-1 group-hover:text-purple-300 transition-colors" title={video.title}>{video.title}</h3>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <div className="flex items-center gap-1.5 min-w-0 group/user">
                <Image width={100} height={100} src={video.uploadedBy?.profilePicture || ""} className="w-5 h-5 shrink-0 rounded-full object-cover ring-1 ring-white/10 group-hover/user:ring-purple-500/50 transition-all" alt={video.uploadedBy?.username || "User avatar"} />
                <span className="truncate max-w-24 group-hover/user:text-white transition-colors">{video.uploadedBy?.username}</span>
              </div>
            </div>
          </div>
          {/* Right: Views, Rating & Upload Date */}
          <div className="flex flex-col items-end gap-1 shrink-0 h-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-white/40">
                <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                <span>{video.views || 0}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400 drop-shadow-sm">
                <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
                <span>{video.averageRating ? video.averageRating.toFixed(1) : "0.0"}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
              <span>{new Date(video.uploadedAt).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </motion.div>

    </Link >
  );
}

