"use client";

import { faEye, faPlay, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { VideoListItem } from "../../../types/types";


export default function VideoComponent({ video }: { video: VideoListItem }) {
  return (
    <Link href={`/videos/${video.id}`}>
      <motion.div
        whileHover={{ y: -5 }}
        className="group relative bg-[#0a0a0a]/40 border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-purple-900/20 transition-all duration-300"
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
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <FontAwesomeIcon icon={faPlay} className="ml-1" />
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center justify-between gap-3">
          {/* Left: Title & User/Date */}
          <div className="flex flex-col min-w-0 flex-1 gap-1">
            <h3 className="text-white font-bold text-sm leading-tight line-clamp-1" title={video.title}>{video.title}</h3>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Image width={100} height={100} src={video.uploadedBy?.profilePicture || ""} className="w-5 h-5 shrink-0 rounded-full object-cover" alt={video.uploadedBy?.username || "User avatar"} />
                <span className="truncate max-w-24">{video.uploadedBy?.username}</span>
              </div>
              <span>•</span>
              <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
          {/* Right: Rating & Views */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
              <span>{video.averageRating ? video.averageRating.toFixed(1) : "0.0"}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-white/40">
              <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
              <span>{video.views || 0}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link >
  );
}

