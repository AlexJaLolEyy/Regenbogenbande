import { faEye, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Picture } from "../../../types/types";

export default function PictureComponent({ picture }: { picture: Picture }) {
  return (
    <Link href={`/pictures/${picture.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        viewport={{ once: true }}
        className="group relative break-inside-avoid mb-6 rounded-2xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md hover:border-purple-500/50 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)] transition-all duration-300 w-full cursor-pointer"
      >
        {/* Image */}
        <div className="relative w-full">
          <img
            src={picture.thumbnailUrl || picture.imageUrl}
            alt={picture.title || 'Picture'}
            className="w-full h-auto object-cover block"
            loading="lazy"
          />
          {/* Hover overlay for title */}
          <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pr-16 bg-blend-multiply">
            <h3 className="text-white font-bold text-shadow line-clamp-2 text-sm">{picture.title || 'Untitled'}</h3>
          </div>
          {/* Hover overlay for rating badge */}
          {typeof picture.averageRating === 'number' && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-full px-2 py-1 text-[10px] font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-amber-500/20 shadow-lg flex items-center gap-1">
              <FontAwesomeIcon icon={faStar} />
              <span>{picture.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-3 bg-black/20 backdrop-blur-sm border-t border-white/5 flex items-center justify-between gap-2">
          {/* Uploader (left) */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 shrink-0 rounded-full overflow-hidden bg-neutral-800 border border-white/10">
              {picture.uploadedBy?.profilePicture ? (
                <img src={picture.uploadedBy.profilePicture} alt={picture.uploadedBy.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-white/50">?</div>
              )}
            </div>
            <span className="text-xs text-neutral-300 truncate font-medium">{picture.uploadedBy?.username || 'Anon'}</span>
          </div>
          {/* Date & Views (right) */}
          <div className="flex items-center gap-3 text-[10px] text-neutral-400 shrink-0">
            <span className="whitespace-nowrap">{format(new Date(picture.createdAt), 'dd.MM.yy')}</span>
            <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/5">
              <FontAwesomeIcon icon={faEye} />
              {picture.views}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

