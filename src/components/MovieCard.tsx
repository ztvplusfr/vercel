'use client';

import { useState } from 'react';
import { TMDBContent } from '@/lib/tmdb';
import { tmdbApi } from '@/lib/tmdb';
import { Play, Info } from 'lucide-react';
import Image from 'next/image';

interface MovieCardProps {
  content: TMDBContent;
  onClick?: () => void;
}

export function MovieCard({ content, onClick }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const title = 'title' in content ? content.title : content.name;
  const imageUrl = tmdbApi.getImageUrl(content.poster_path);
  const releaseDate = 'release_date' in content ? content.release_date : content.first_air_date;
  const year = new Date(releaseDate).getFullYear();
  
  return (
    <div
      className="relative cursor-pointer transition-all duration-300 transform hover:scale-105 hover:z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black">
        <Image
          src={imageUrl || '/placeholder.jpg'}
          alt={title}
          width={250}
          height={375}
          className="w-full h-auto object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.jpg';
          }}
        />
        
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-between p-4 transition-opacity duration-300">
            <div className="flex-1 flex items-center justify-center">
              <button className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center transform transition-all duration-200 hover:scale-110 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-white font-bold text-sm line-clamp-2">{title}</h3>
              <div className="flex items-center space-x-2 text-xs text-gray-300">
                <span>{year}</span>
                <span>•</span>
                <span>{content.vote_average.toFixed(1)} ⭐</span>
              </div>
              <p className="text-gray-300 text-xs line-clamp-3">{content.overview}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
