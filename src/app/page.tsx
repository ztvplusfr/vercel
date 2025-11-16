'use client';

import { useState, useEffect } from 'react';
import { tmdbApi, TMDBMovie, TMDBTVShow } from '@/lib/tmdb';
import { ContentGrid } from '@/components/ContentGrid';
import { ChevronRight, TrendingUp, Star, Calendar, Play } from 'lucide-react';

type TMDBContent = TMDBMovie | TMDBTVShow;

import { RankedRow } from '@/components/RankedRow';
import { CarouselRow } from '@/components/CarouselRow';
import { HeroSection } from '@/components/HeroSection';

export default function Home() {
  const [trending, setTrending] = useState<TMDBContent[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBContent[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<TMDBContent[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<TMDBContent[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<TMDBContent[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<TMDBContent[]>([]);
  const [onTheAirTVShows, setOnTheAirTVShows] = useState<TMDBContent[]>([]);
  const [loading, setLoading] = useState(true);

  const handleContentClick = (content: TMDBContent) => {
    if ('title' in content) {
      // C'est un film
      window.location.href = `/movies/${content.id}`;
    } else {
      // C'est une série TV
      window.location.href = `/series/${content.id}`;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          trendingData,
          popularMoviesData,
          popularTVShowsData,
          topRatedMoviesData,
          topRatedTVShowsData,
          nowPlayingMoviesData,
          onTheAirTVShowsData
        ] = await Promise.all([
          tmdbApi.getTrending(),
          tmdbApi.getPopularMovies(),
          tmdbApi.getPopularTVShows(),
          tmdbApi.getTopRatedMovies(),
          tmdbApi.getTopRatedTVShows(),
          tmdbApi.getNowPlayingMovies(),
          tmdbApi.getOnTheAirTVShows()
        ]);

        setTrending(trendingData.results);
        setPopularMovies(popularMoviesData.results);
        setPopularTVShows(popularTVShowsData.results);
        setTopRatedMovies(topRatedMoviesData.results);
        setTopRatedTVShows(topRatedTVShowsData.results);
        setNowPlayingMovies(nowPlayingMoviesData.results);
        setOnTheAirTVShows(onTheAirTVShowsData.results);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection />

      {/* Décalage du reste de la page sous le navbar, avec espace réduit */}
      <div className="px-4 md:px-8 py-6 mt-8 md:mt-10 space-y-8">
        <CarouselRow
          title="Tendances"
          contents={trending}
          onContentClick={handleContentClick}
        />
        {/* Sections Top 10 à la Netflix, juste sous les tendances */}
        <RankedRow
          title="Top 10 Films"
          contents={popularMovies}
          onContentClick={handleContentClick}
        />
        <RankedRow
          title="Top 10 Séries"
          contents={popularTVShows}
          onContentClick={handleContentClick}
        />
        <CarouselRow
          title="Films à l'Affiche"
          contents={nowPlayingMovies}
          onContentClick={handleContentClick}
        />
        <CarouselRow
          title="Films Populaires"
          contents={popularMovies}
          onContentClick={handleContentClick}
        />
        <CarouselRow
          title="Séries en Diffusion"
          contents={onTheAirTVShows}
          onContentClick={handleContentClick}
        />
        <CarouselRow
          title="Séries Populaires"
          contents={popularTVShows}
          onContentClick={handleContentClick}
        />
        <CarouselRow
          title="Films Mieux Notés"
          contents={topRatedMovies}
          onContentClick={handleContentClick}
        />
        <CarouselRow
          title="Séries Mieux Notées"
          contents={topRatedTVShows}
          onContentClick={handleContentClick}
        />
      </div>
    </div>
  );
}
