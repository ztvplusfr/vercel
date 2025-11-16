'use client';

import { useState, useEffect } from 'react';
import { tmdbApi, TMDBMovie } from '@/lib/tmdb';
import { ContentGrid } from '@/components/ContentGrid';

export default function MoviesPage() {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const moviesData = await tmdbApi.getPopularMovies();
        setMovies(moviesData as TMDBMovie[]);
      } catch (err) {
        setError('Erreur lors du chargement des films');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
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
        <h1 className="text-4xl font-bold mb-8">Films Populaires</h1>
        <ContentGrid contents={movies} type="movie" />
      </div>
    </div>
  );
}
