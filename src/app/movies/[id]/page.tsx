'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tmdbApi, TMDBMovie, TMDBCastMember, TMDBImage } from '@/lib/tmdb';
import Image from 'next/image';
import { Play, Share2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ImageModal } from '@/components/ImageModal';

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<TMDBMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVideos, setHasVideos] = useState<boolean | null>(null);
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie?.title || 'Film',
          text: `Regarde "${movie?.title}" sur ZTVPlus!`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers!');
    }
  };

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const movieId = params.id as string;
        if (!movieId) {
          setError('ID de film non valide');
          return;
        }

        const movieData = await tmdbApi.getMovieDetails(movieId);
        setMovie(movieData as TMDBMovie);
      } catch (err) {
        setError('Erreur lors du chargement du film');
        console.error('Error fetching movie:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [params.id]);

  // Met à jour le titre de l'onglet avec le titre du film
  useEffect(() => {
    if (movie?.title) {
      document.title = `${movie.title} - ZTVPlus`;
    }
  }, [movie?.title]);

  // Vérifier si des sources vidéo existent pour ce film (R2)
  useEffect(() => {
    const checkVideos = async () => {
      if (!movie) return;

      try {
        const res = await fetch(`/api/movies/${movie.id}`);
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
  }, [movie]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-xl">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-xl text-red-500">{error || 'Film non trouvé'}</div>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbApi.getHeroImageUrl(movie.backdrop_path);
  const posterUrl = tmdbApi.getImageUrl(movie.poster_path);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Hero Section */}
      <div className="relative h-[70vh]">
        <div className="absolute inset-0">
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={movie.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        </div>

        <div className="relative h-full flex items-end">
          <div className="px-4 md:px-8 lg:px-16 pb-10 w-full">
            <div className="flex flex-col md:flex-row gap-8 items-start max-w-5xl">
              {posterUrl && (
                <div className="hidden md:block flex-shrink-0">
                  <Image
                    src={posterUrl}
                    alt={movie.title}
                    width={260}
                    height={390}
                    className="rounded-lg shadow-2xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setModalImage({ src: posterUrl, alt: movie.title })}
                  />
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
                  {movie.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm md:text-base">
                  <span className="text-gray-300">
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-300">
                    {movie.runtime ? `${movie.runtime} min` : 'Durée non spécifiée'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">⭐</span>
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genres?.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-red-600 rounded-full text-xs md:text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                <p className="text-base md:text-lg text-gray-200 mb-6 leading-relaxed line-clamp-4 md:line-clamp-none">
                  {movie.overview}
                </p>

                <div className="flex flex-wrap gap-3 md:gap-4">
                  <button
                    onClick={() => hasVideos && router.push(`/movies/${movie.id}/watch`)}
                    disabled={hasVideos === false}
                    className={`flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 rounded-md transition-colors text-sm md:text-base ${
                      hasVideos === false
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <Play className="w-5 h-5 md:w-6 md:h-6" />
                    <span>{hasVideos === false ? 'Lecture indisponible' : 'Lecture'}</span>
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-gray-700 bg-opacity-80 text-white rounded-md hover:bg-gray-600 transition-colors text-sm md:text-base">
                    <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                    <span>Partager</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cast & Images */}
      <div className="border-t border-gray-800 bg-gradient-to-b from-black via-black to-black">
        <div className="px-4 md:px-8 lg:px-16 py-12">
          <div className="w-full">
          {/* Cast */}
          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-4">Acteurs principaux</h3>
              <Carousel
                opts={{
                  align: 'start',
                  dragFree: true,
                }}
                className="w-full group"
              >
                <CarouselContent className="px-2 md:px-4">
                  {movie.credits.cast.slice(0, 20).map((member: TMDBCastMember) => (
                    <CarouselItem
                      key={member.id}
                      className="basis-1/2 sm:basis-1/3 md:basis-1/5 lg:basis-1/6"
                    >
                      <div className="flex flex-col items-center text-center px-2">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-800 mb-3">
                          {member.profile_path ? (
                            <Image
                              src={tmdbApi.getImageUrl(member.profile_path) || '/placeholder.jpg'}
                              alt={member.name}
                              width={112}
                              height={112}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                              Aucun portrait
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-semibold line-clamp-2">{member.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {member.character}
                        </p>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex left-0 bg-red-600 hover:bg-red-700 border-red-600 text-white w-10 h-10 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110" />
                <CarouselNext className="hidden md:flex right-0 bg-red-600 hover:bg-red-700 border-red-600 text-white w-10 h-10 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110" />
              </Carousel>
            </div>
          )}

          {/* Images */}
          {movie.images?.backdrops && movie.images.backdrops.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold mb-4">Images</h3>
              <Carousel
                opts={{
                  align: 'start',
                  dragFree: true,
                }}
                className="w-full group"
              >
                <CarouselContent className="px-2 md:px-4">
                  {movie.images.backdrops.slice(0, 20).map((img: TMDBImage, index: number) => (
                    <CarouselItem
                      key={`${img.file_path}-${index}`}
                      className="basis-2/3 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                    >
                      <div className="w-full h-40 md:h-52 rounded-lg overflow-hidden bg-gray-800 cursor-pointer hover:opacity-90 transition-opacity">
                        <Image
                          src={tmdbApi.getImageUrl(img.file_path) || '/placeholder-hero.jpg'}
                          alt={`Image ${index + 1} de ${movie.title}`}
                          width={480}
                          height={270}
                          className="w-full h-full object-cover"
                          onClick={() => setModalImage({ 
                            src: tmdbApi.getImageUrl(img.file_path) || '/placeholder-hero.jpg', 
                            alt: `Image ${index + 1} de ${movie.title}` 
                          })}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex left-0 bg-red-600 hover:bg-red-700 border-red-600 text-white w-10 h-10 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110" />
                <CarouselNext className="hidden md:flex right-0 bg-red-600 hover:bg-red-700 border-red-600 text-white w-10 h-10 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110" />
              </Carousel>
            </div>
          )}
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      <ImageModal
        isOpen={modalImage !== null}
        onClose={() => setModalImage(null)}
        src={modalImage?.src || ''}
        alt={modalImage?.alt || ''}
      />
    </div>
  );
}
