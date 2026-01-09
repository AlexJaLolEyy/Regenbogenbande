"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@heroui/react";
import Link from 'next/link';
import { getVideoRecommendations, getPictureRecommendations } from '@/src/lib/actions/recommendations';
import NextImage from 'next/image';

interface RecommendationsSectionProps {
  contentType: 'video' | 'picture';
  currentId: string;
  categoryId: string;
}

interface RecommendationItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  views: number;
  uploadedBy: {
    username: string;
  };
}

export const RecommendationsSection = ({ contentType, currentId, categoryId }: RecommendationsSectionProps) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      if (!currentId) return;
      
      setIsLoading(true);
      try {
        console.log(`[RecommendationsSection] Fetching for ${contentType}, id: ${currentId}`);
        if (contentType === 'video') {
          const recs = await getVideoRecommendations(currentId, categoryId);
          setRecommendations(recs);
        } else {
          const recs = await getPictureRecommendations(currentId, categoryId);
          setRecommendations(recs);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecs();
  }, [contentType, currentId, categoryId]);

  // Don't return null immediately, let it render the container
  // Only hide if we are NOT loading and still have no recommendations after fallback
  if (!isLoading && recommendations.length === 0) {
    return (
      <div className="bg-[#121212]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sticky top-24">
        <h3 className="font-bold text-white mb-6 text-lg">
          {contentType === 'video' ? 'Up Next' : 'Recommended'}
        </h3>
        <p className="text-white/20 text-sm italic">No other {contentType === 'video' ? 'videos' : 'pictures'} found.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121212]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sticky top-24 min-h-[200px]">
      <h3 className="font-bold text-white mb-6 text-lg">
        {contentType === 'video' ? 'Up Next' : 'Recommended'}
      </h3>
      
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-32 aspect-video bg-white/5 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-full" />
                <div className="h-2 bg-white/5 rounded w-2/3" />
              </div>
            </div>
          ))
        ) : (
          recommendations.map((item) => (
            <Link 
              key={item.id} 
              href={`/${contentType === 'video' ? 'videos' : 'pictures'}/${item.id}`}
              className="flex gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition border border-transparent hover:border-white/5"
            >
              <div className="w-32 aspect-video bg-white/5 rounded-lg overflow-hidden relative shrink-0">
                {item.thumbnailUrl ? (
                  <NextImage
                    alt={item.title}
                    src={item.thumbnailUrl}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <span className="text-[10px] text-white/20">No Image</span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-mono text-white uppercase z-10">
                  {contentType === 'video' ? 'Video' : 'Image'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-white leading-tight mb-1 truncate group-hover:text-purple-400 max-w-full">
                  {item.title}
                </h4>
                <p className="text-xs text-white/40">{item.uploadedBy.username || 'Anonymous'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-white/30">{item.views} views</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      
      {!isLoading && recommendations.length >= 5 && (
        <Button 
          as={Link}
          href={`/${contentType === 'video' ? 'videos' : 'pictures'}`}
          className="w-full mt-6 bg-white/5 text-white font-bold hover:bg-white/10 rounded-xl" 
          size="sm"
        >
          View More
        </Button>
      )}
    </div>
  );
};
