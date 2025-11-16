'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { tmdbApi, TMDBTVShow, TMDBCastMember, TMDBImage, TMDBEpisode } from '@/lib/tmdb';
import Image from 'next/image';
import { Share2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export default function TVShowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tvShow, setTvShow] = useState<TMDBTVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [episodesWithVideos, setEpisodesWithVideos] = useState<Set<number>>(new Set());
  const [episodesWithoutVideos, setEpisodesWithoutVideos] = useState<Set<number>>(new Set());
  const [episodesLoading, setEpisodesLoading] = useState(false);

  useEffect(() => {
    const fetchTVShow = async () => {
      try {
        const tvShowId = params.id as string;
        if (!tvShowId) {
          setError('ID de série non valide');
          return;
        }

        const tvShowData = await tmdbApi.getTVShowDetails(tvShowId);
        setTvShow(tvShowData as TMDBTVShow);
      } catch (err) {
        setError('Erreur lors du chargement de la série');
        console.error('Error fetching TV show:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTVShow();
  }, [params.id]);

  // Met à jour le titre de l'onglet avec le titre de la série
  useEffect(() => {
    if (tvShow?.name) {
      document.title = `${tvShow.name} - ZTVPlus`;
    }
  }, [tvShow?.name]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!tvShow) return;

      try {
        setEpisodesLoading(true);
        const tvShowId = tvShow.id.toString();
        const seasonData = await tmdbApi.getTVSeason(tvShowId, selectedSeason);
        setEpisodes(seasonData.episodes as TMDBEpisode[]);
        
        // Vérifier les vidéos en parallèle pour tous les épisodes de la saison
        const episodesWithVideoSet = new Set<number>();
        const episodesWithoutVideoSet = new Set<number>();
        
        const videoCheckPromises = seasonData.episodes.map(async (episode: TMDBEpisode) => {
          try {
            const res = await fetch(`/api/series/${tvShowId}?season=${selectedSeason}&episode=${episode.episode_number}`);
            if (res.ok) {
              const data = await res.json();
              if (data.videos && data.videos.length > 0) {
                episodesWithVideoSet.add(episode.episode_number);
              } else {
                episodesWithoutVideoSet.add(episode.episode_number);
              }
            } else {
              episodesWithoutVideoSet.add(episode.episode_number);
            }
          } catch (err) {
            episodesWithoutVideoSet.add(episode.episode_number);
          }
        });
        
        await Promise.all(videoCheckPromises);
        setEpisodesWithVideos(episodesWithVideoSet);
        setEpisodesWithoutVideos(episodesWithoutVideoSet);
        
      } catch (err) {
        console.error('Error fetching episodes:', err);
        setEpisodes([]);
      } finally {
        setEpisodesLoading(false);
      }
    };

    fetchEpisodes();
  }, [tvShow, selectedSeason]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-xl">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error || !tvShow) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-xl text-red-500">{error || 'Série non trouvée'}</div>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbApi.getHeroImageUrl(tvShow.backdrop_path);
  const posterUrl = tmdbApi.getImageUrl(tvShow.poster_path);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[70vh]">
        <div className="absolute inset-0">
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={tvShow.name}
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
                    alt={tvShow.name}
                    width={260}
                    height={390}
                    className="rounded-lg shadow-2xl"
                  />
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
                  {tvShow.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm md:text-base">
                  <span className="text-gray-300">
                    {new Date(tvShow.first_air_date).getFullYear()}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-300">
                    {tvShow.number_of_seasons
                      ? `${tvShow.number_of_seasons} saison${tvShow.number_of_seasons > 1 ? 's' : ''}`
                      : 'Nombre de saisons non spécifié'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">⭐</span>
                    <span>{tvShow.vote_average.toFixed(1)}</span>
                  </div>
                </div>

              <div className="flex flex-wrap gap-2 mb-6">
                  {tvShow.genres?.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-red-600 rounded-full text-xs md:text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                <p className="text-base md:text-lg text-gray-200 mb-6 leading-relaxed line-clamp-4 md:line-clamp-none">
                  {tvShow.overview}
                </p>

                <button className="flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-gray-700 bg-opacity-80 text-white rounded-md hover:bg-gray-600 transition-colors text-sm md:text-base">
                  <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                  <span>Partager</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes, Cast & Images */}
      <div className="border-t border-gray-800 bg-gradient-to-b from-black via-black to-black">
        <div className="px-4 md:px-8 lg:px-16 py-12 space-y-10">
          {/* Episodes */}
          {tvShow.number_of_seasons && tvShow.number_of_seasons > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-2xl font-bold">
                  Épisodes – Saison {selectedSeason}
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-300">
                    Saison
                  </label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:border-red-600 focus:outline-none text-sm"
                  >
                    {Array.from({ length: tvShow.number_of_seasons }).map((_, index) => {
                      const seasonNumber = index + 1;
                      return (
                        <option key={seasonNumber} value={seasonNumber}>
                          Saison {seasonNumber}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              {episodesLoading ? (
                <div className="text-gray-400">Chargement des épisodes...</div>
              ) : episodes.length === 0 ? (
                <div className="text-gray-400">
                  Aucun épisode trouvé pour cette saison.
                </div>
              ) : (
                <div className="space-y-3">
                  {episodes.map((episode) => {
                    const hasVideo = !episodesWithoutVideos.has(episode.episode_number);
                    
                    return (
                    <div
                      key={episode.id}
                      className={`p-3 md:p-4 rounded-lg transition-colors max-w-4xl ${
                        hasVideo
                          ? "bg-gray-900/70 hover:bg-gray-900 cursor-pointer"
                          : "bg-gray-900/50 opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (hasVideo) {
                          router.push(
                            `/series/${tvShow.id}/watch?season=${selectedSeason}&episode=${episode.episode_number}`
                          );
                        }
                      }}
                    >
                      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                        {episode.still_path && (
                          <div className="w-full md:w-64 h-40 md:h-36 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
                            <Image
                              src={
                                tmdbApi.getImageUrl(episode.still_path) ||
                                '/placeholder-hero.jpg'
                              }
                              alt={episode.name}
                              width={640}
                              height={360}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-between text-left">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-white">
                                  Épisode {episode.episode_number}
                                </span>
                                <span className={`text-sm ${
                                  hasVideo ? "text-gray-300" : "text-gray-500"
                                }`}>
                                  {episode.name}
                                </span>
                                {!hasVideo && (
                                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                    Indisponible
                                  </span>
                                )}
                              </div>
                              {episode.runtime && (
                                <span className="text-xs text-gray-400">
                                  {episode.runtime} min
                                </span>
                              )}
                            </div>
                            <p className="text-xs md:text-sm text-gray-400 line-clamp-3">
                              {episode.overview ||
                                'Pas de description disponible.'}
                            </p>
                          </div>
                          {episode.air_date && (
                            <div className="mt-2 text-[11px] text-gray-500">
                              {new Date(
                                episode.air_date
                              ).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="w-full space-y-10">
          {/* Cast */}
          {tvShow.credits?.cast && tvShow.credits.cast.length > 0 && (
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
                  {tvShow.credits.cast.slice(0, 20).map((member: TMDBCastMember) => (
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
          {tvShow.images?.backdrops && tvShow.images.backdrops.length > 0 && (
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
                  {tvShow.images.backdrops.slice(0, 20).map((img: TMDBImage, index: number) => (
                    <CarouselItem
                      key={`${img.file_path}-${index}`}
                      className="basis-2/3 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                    >
                      <div className="w-full h-40 md:h-52 rounded-lg overflow-hidden bg-gray-800">
                        <Image
                          src={tmdbApi.getImageUrl(img.file_path) || '/placeholder-hero.jpg'}
                          alt={`Image ${index + 1} de ${tvShow.name}`}
                          width={480}
                          height={270}
                          className="w-full h-full object-cover"
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
    </div>
  );
}
