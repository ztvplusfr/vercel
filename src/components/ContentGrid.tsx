'use client';

import { useState, useEffect } from 'react';
import { MovieCard } from './MovieCard';
import { tmdbApi, TMDBContent } from '@/lib/tmdb';

interface ContentGridProps {
  contentType: 'movie' | 'tv';
  title: string;
}

export function ContentGrid({ contentType, title }: ContentGridProps) {
  const [contents, setContents] = useState<TMDBContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filtres
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [minRating, setMinRating] = useState('');

  const genres = contentType === 'movie' 
    ? [
        { id: 28, name: 'Action' },
        { id: 12, name: 'Aventure' },
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comédie' },
        { id: 80, name: 'Crime' },
        { id: 99, name: 'Documentaire' },
        { id: 18, name: 'Drame' },
        { id: 10751, name: 'Familial' },
        { id: 14, name: 'Fantastique' },
        { id: 36, name: 'Histoire' },
        { id: 27, name: 'Horreur' },
        { id: 10402, name: 'Musique' },
        { id: 9648, name: 'Mystère' },
        { id: 10749, name: 'Romance' },
        { id: 878, name: 'Science-fiction' },
        { id: 10770, name: 'Téléfilm' },
        { id: 53, name: 'Thriller' },
        { id: 10752, name: 'Guerre' },
        { id: 37, name: 'Western' }
      ]
    : [
        { id: 10759, name: 'Action & Aventure' },
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comédie' },
        { id: 80, name: 'Crime' },
        { id: 99, name: 'Documentaire' },
        { id: 18, name: 'Drame' },
        { id: 10751, name: 'Familial' },
        { id: 10762, name: 'Kids' },
        { id: 9648, name: 'Mystère' },
        { id: 10763, name: 'News' },
        { id: 10764, name: 'Reality' },
        { id: 10765, name: 'Sci-Fi & Fantasy' },
        { id: 10766, name: 'Soap' },
        { id: 10767, name: 'Talk' },
        { id: 10768, name: 'War & Politics' },
        { id: 37, name: 'Western' }
      ];

  const sortOptions = [
    { value: 'popularity.desc', label: 'Plus populaire' },
    { value: 'popularity.asc', label: 'Moins populaire' },
    { value: 'vote_average.desc', label: 'Mieux notés' },
    { value: 'vote_average.asc', label: 'Moins bien notés' },
    { value: 'release_date.desc', label: 'Plus récents' },
    { value: 'release_date.asc', label: 'Plus anciens' },
    { value: 'title.asc', label: 'Titre (A-Z)' },
    { value: 'title.desc', label: 'Titre (Z-A)' }
  ];

  const fetchContents = async (options?: { page?: number; reset?: boolean }) => {
    const { reset = false, page: requestedPage } = options ?? {};

    try {
      setLoading(true);
      const currentPage = reset ? 1 : requestedPage ?? page;

      let response;
      if (contentType === 'movie') {
        response = await tmdbApi.getMovies(currentPage, sortBy, genre, year, minRating);
      } else {
        response = await tmdbApi.getTVShows(currentPage, sortBy, genre, year, minRating);
      }

      if (reset) {
        setContents(response.results);
        setPage(1);
      } else {
        setContents(prev => [...prev, ...response.results]);
        if (requestedPage) {
          setPage(currentPage);
        }
      }

      setHasMore(response.results.length > 0);
    } catch (error) {
      console.error('Error fetching contents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents({ reset: true });
  }, [sortBy, genre, year, minRating, contentType]);

  const handleLoadMore = () => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;
    fetchContents({ page: nextPage });
  };

  const handleContentClick = (content: TMDBContent) => {
    if ('title' in content) {
      // C'est un film
      window.location.href = `/movies/${content.id}`;
    } else {
      // C'est une série TV
      window.location.href = `/series/${content.id}`;
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <>
      {/* Header */}
      <div className="bg-black border-b border-white/10">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-1 md:mb-2">{title}</h1>
          <p className="text-gray-400 text-sm md:text-base">Découvrez notre collection complète</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="px-4 md:px-8 py-4 bg-black border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm md:text-base font-semibold text-white tracking-wide">
            Filtres
          </h2>
          {(sortBy !== 'popularity.desc' || genre || year || minRating) && (
            <button
              type="button"
              onClick={() => {
                setSortBy('popularity.desc');
                setGenre('');
                setYear('');
                setMinRating('');
              }}
              className="text-xs md:text-sm text-gray-300 hover:text-white underline underline-offset-2"
            >
              Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tri */}
          <div className="bg-gradient-to-b from-gray-900/90 to-black border border-white/10 rounded-lg px-3 py-3 shadow-sm">
            <label className="block text-xs md:text-sm font-medium mb-2 text-gray-200">
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-black/80 text-white border border-white/20 rounded-md focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs md:text-sm transition-colors"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Genre */}
          <div className="bg-gradient-to-b from-gray-900/90 to-black border border-white/10 rounded-lg px-3 py-3 shadow-sm">
            <label className="block text-xs md:text-sm font-medium mb-2 text-gray-200">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 bg-black/80 text-white border border-white/20 rounded-md focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs md:text-sm transition-colors"
            >
              <option value="">Tous les genres</option>
              {genres.map(g => (
                <option key={g.id} value={g.id.toString()}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Année */}
          <div className="bg-gradient-to-b from-gray-900/90 to-black border border-white/10 rounded-lg px-3 py-3 shadow-sm">
            <label className="block text-xs md:text-sm font-medium mb-2 text-gray-200">
              Année
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 bg-black/80 text-white border border-white/20 rounded-md focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs md:text-sm transition-colors"
            >
              <option value="">Toutes les années</option>
              {years.map(y => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Note minimale */}
          <div className="bg-gradient-to-b from-gray-900/90 to-black border border-white/10 rounded-lg px-3 py-3 shadow-sm">
            <label className="block text-xs md:text-sm font-medium mb-2 text-gray-200">
              Note minimale
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full px-3 py-2 bg-black/80 text-white border border-white/20 rounded-md focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs md:text-sm transition-colors"
            >
              <option value="">Toutes les notes</option>
              <option value="8">8+ ⭐</option>
              <option value="7">7+ ⭐</option>
              <option value="6">6+ ⭐</option>
              <option value="5">5+ ⭐</option>
              <option value="4">4+ ⭐</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grille de contenu */}
      <div className="px-4 md:px-8 py-6 bg-black min-h-[50vh]">
        {loading && contents.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400 text-lg">Chargement...</div>
          </div>
        ) : contents.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400 text-lg">Aucun résultat trouvé</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {contents.map((content) => (
                <MovieCard
                  key={content.id}
                  content={content}
                  onClick={() => handleContentClick(content)}
                />
              ))}
            </div>

            {/* Bouton charger plus */}
            {hasMore && !loading && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Charger plus
                </button>
              </div>
            )}

            {loading && contents.length > 0 && (
              <div className="flex justify-center mt-8">
                <div className="text-gray-400">Chargement...</div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
