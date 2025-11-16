'use client';

import { useState, useEffect } from 'react';
import { tmdbApi, TMDBTVShow } from '@/lib/tmdb';
import { ContentGrid } from '@/components/ContentGrid';

export default function TVShowsPage() {
  const [tvShows, setTVShows] = useState<TMDBTVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTVShows = async () => {
      try {
        const tvShowsData = await tmdbApi.getPopularTVShows();
        setTVShows(tvShowsData as TMDBTVShow[]);
      } catch (err) {
        setError('Erreur lors du chargement des séries');
      } finally {
        setLoading(false);
      }
    };

    fetchTVShows();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Séries Populaires</h1>
        <ContentGrid contents={tvShows} type="tv" />
      </div>
    </div>
  );
}
