'use client'

import { faEye, faQuoteLeft, faStar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Avatar } from '@heroui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Quote } from '../../../types/types';

export default function QuoteComponent({ quote }: { quote: Quote }) {
  const displayMessages = quote.messages.slice(0, 4);
  const remaining = quote.messages.length - 4;
  const uploaderName = quote.uploadedBy?.username || 'Unknown';
  const rating = quote.averageRating ? quote.averageRating.toFixed(1) : 'N/A';
  const views = quote.views || 0;

  return (
    <Link href={`/quotes/${quote.id}`} className="block h-full mb-6">
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-[#18181b]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all shadow-lg group flex flex-col break-inside-avoid"
      >
        {/* Header (Minimal) */}
        <div className="px-5 pt-5 pb-2 flex justify-between items-start">
          <FontAwesomeIcon icon={faQuoteLeft} className="text-white/10 text-2xl" />
          <span className="text-[10px] text-white/30 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-full">
            {new Date(quote.uploadedAt).toLocaleDateString()}
          </span>
        </div>
        {/* Bubble stack */}
        <div className="px-5 pb-4 space-y-3 flex-1">
          {displayMessages.map((msg, idx) => (
            <div key={msg.id} className={`flex gap-3 ${idx % 2 !== 0 ? 'flex-row-reverse' : ''}`}>
              <Avatar src={msg.user.profilePicture || undefined} size="sm" className="shrink-0 w-6 h-6 mt-1" />
              <div className={`p-3 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap max-w-[85%] shadow-sm border border-white/5 \
                ${idx % 2 !== 0
                  ? 'bg-purple-500/10 border-purple-500/10 text-white rounded-tr-none'
                  : 'bg-white/5 border-white/5 text-white/90 rounded-tl-none'
                }`}>
                <span className="text-[10px] font-bold block opacity-60 mb-1">{msg.user.username}</span>
                {msg.message}
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <div className="text-center text-xs text-white/30 italic py-1 border-t border-white/5 border-dashed mt-2 pt-2">
              + {remaining} more messages...
            </div>
          )}
        </div>
        {/* Footer: Metadata */}
        <div className="px-5 py-3 border-t border-white/5 bg-white/5 flex items-center justify-between text-xs text-white/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition">
              <Avatar src={quote.uploadedBy?.profilePicture || undefined} className="w-4 h-4" />
              <span className="truncate max-w-[60px]">{uploaderName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faEye} /> {views}
            </div>
            <div className="flex items-center gap-1.5 text-yellow-500/80">
              <FontAwesomeIcon icon={faStar} /> {rating}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
