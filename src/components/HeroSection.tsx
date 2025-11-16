'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Info } from 'lucide-react';
import { tmdbApi, TMDBContent, TMDBMovie, TMDBTVShow } from '@/lib/tmdb';

interface HeroSectionProps {
  content?: TMDBContent;
  onContentClick?: (content: TMDBContent) => void;
}

export function HeroSection({ content: propContent, onContentClick }: HeroSectionProps) {
  const [heroContent, setHeroContent] = useState<TMDBContent | null>(propContent || null);
  const [hasVideos, setHasVideos] = useState<boolean | null>(null);

  useEffect(() => {
    if (!propContent) {
      const fetchHeroContent = async () => {
        try {
          const trending = await tmdbApi.getTrending();
          const randomContent = trending.results[Math.floor(Math.random() * trending.results.length)];
          setHeroContent(randomContent);
        } catch (error) {
          console.error('Error fetching hero content:', error);
        }
      };

      fetchHeroContent();
    }
  }, [propContent]);

  // Vérifier la disponibilité de vidéos uniquement pour les films
  useEffect(() => {
    const checkVideos = async () => {
      if (!heroContent || !('title' in heroContent)) {
        setHasVideos(null);
        return;
      }

      try {
        const res = await fetch(`/api/movies/${heroContent.id}`);
        if (!res.ok) {
          setHasVideos(false);
          return;
        }
        const data = await res.json();
        setHasVideos(Array.isArray(data.videos) && data.videos.length > 0);
      } catch {
        setHasVideos(false);
      }
    };

    checkVideos();
  }, [heroContent]);

  if (!heroContent) {
    return (
      <div className="relative h-[60vh] md:h-[70vh] bg-gray-900 flex items-center justify-center px-4">
        <div className="text-white text-lg md:text-xl text-center">Chargement...</div>
      </div>
    );
  }

  const heroImageUrl = tmdbApi.getHeroImageUrl(heroContent.backdrop_path);
  const isMovie = 'title' in heroContent;
  const year = 'title' in heroContent 
    ? new Date((heroContent as TMDBMovie).release_date).getFullYear()
    : new Date((heroContent as TMDBTVShow).first_air_date).getFullYear();
  const title = 'title' in heroContent ? heroContent.title : (heroContent as TMDBTVShow).name;
  const rating = heroContent.vote_average.toFixed(1);

  const handlePlayClick = () => {
    if (!heroContent) return;

    // Séries : on garde le comportement actuel (page détail)
    if (!('title' in heroContent)) {
      if (onContentClick) {
        onContentClick(heroContent);
      } else {
        window.location.href = `/series/${heroContent.id}`;
      }
      return;
    }

    // Films : si pas de vidéo dispo, on ne fait rien
    if (hasVideos === false) return;

    // Si vidéos dispo -> page watch, sinon fallback sur la page détail
    const target =
      hasVideos === true
        ? `/movies/${heroContent.id}/watch`
        : `/movies/${heroContent.id}`;

    if (onContentClick) {
      onContentClick(heroContent);
    } else {
      window.location.href = target;
    }
  };

  const handleInfoClick = () => {
    if (!heroContent) return;

    if (onContentClick) {
      onContentClick(heroContent);
      return;
    }

    if ('title' in heroContent) {
      window.location.href = `/movies/${heroContent.id}`;
    } else {
      window.location.href = `/series/${heroContent.id}`;
    }
  };

  return (
    <div className="relative h-[60vh] md:h-[70vh]">
      <div className="absolute inset-0">
        <Image
          src={heroImageUrl || '/placeholder-hero.jpg'}
          alt={title}
          fill
          className="object-cover"
          priority
          onError={(e) => {
            e.currentTarget.src = '/placeholder-hero.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent md:bg-gradient-to-r" />
      </div>

      <div className="relative h-full flex items-end md:items-center">
        <div className="px-4 md:px-8 lg:px-16 pb-8 md:pb-0 w-full">
          <div className="max-w-xl md:max-w-2xl">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4">
              {title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6 text-sm md:text-base">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">⭐</span>
                <span className="text-white">{rating}</span>
              </div>
              <span className="text-gray-300">•</span>
              <span className="text-gray-300">{year}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-300">
                {'title' in heroContent ? 'Film' : 'Série TV'}
              </span>
            </div>

            <p className="hidden sm:block text-sm md:text-lg text-gray-200 mb-6 md:mb-8 leading-relaxed line-clamp-3">
              {heroContent.overview}
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4">
              <button
                onClick={handlePlayClick}
                disabled={isMovie && hasVideos === false}
                className={`flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 rounded-md transition-colors text-sm md:text-base ${
                  isMovie && hasVideos === false
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <Play className="w-5 h-5 md:w-6 md:h-6" />
                <span>
                  {isMovie && hasVideos === false ? 'Lecture indisponible' : 'Lecture'}
                </span>
              </button>
              <button
                onClick={handleInfoClick}
                className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-gray-700 bg-opacity-80 text-white rounded-md hover:bg-gray-600 transition-colors text-sm md:text-base"
              >
                <Info className="w-5 h-5 md:w-6 md:h-6" />
                <span>Plus d&apos;infos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
