"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { tmdbApi, TMDBEpisode, TMDBTVShow } from "@/lib/tmdb";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Play, SkipBack, SkipForward, Settings } from "lucide-react";

interface EpisodeVideo {
  url: string;
  lang: string;
  quality: string;
  pub: number;
  server?: string;
  hasAds?: boolean;
}

interface EpisodeVideosResponse {
  videos: EpisodeVideo[];
}

export default function SeriesWatchPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<EpisodeVideo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [episodesWithVideos, setEpisodesWithVideos] = useState<Set<number>>(new Set());
  const [episodesWithoutVideos, setEpisodesWithoutVideos] = useState<Set<number>>(new Set());
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [tvShow, setTvShow] = useState<TMDBTVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seasonParam = searchParams.get("season") ?? "1";
  const episodeParam = searchParams.get("episode") ?? "1";

  const fetchEpisodesWithVideos = async (seriesId: string, seasonNumber: string) => {
    try {
      const episodesWithVideoSet = new Set<number>();
      const episodesWithoutVideoSet = new Set<number>();
      
      // Vérifier les 20 premiers épisodes de la saison
      for (let episodeNum = 1; episodeNum <= 20; episodeNum++) {
        try {
          const res = await fetch(`/api/series/${seriesId}?season=${seasonNumber}&episode=${episodeNum}`);
          if (res.ok) {
            const data = await res.json();
            if (data.videos && data.videos.length > 0) {
              episodesWithVideoSet.add(episodeNum);
            } else {
              episodesWithoutVideoSet.add(episodeNum);
            }
          }
        } catch (err) {
          // Ignorer les erreurs pour les épisodes qui n'existent pas
          continue;
        }
      }
      
      setEpisodesWithVideos(episodesWithVideoSet);
      setEpisodesWithoutVideos(episodesWithoutVideoSet);
    } catch (err) {
      console.error("Error fetching episodes with videos:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const seriesId = params.id as string;
        if (!seriesId) {
          setError("ID de série non valide");
          return;
        }

        // Lancer les deux requêtes en parallèle
        const [tvDetails, episodesData] = await Promise.all([
          tmdbApi.getTVShowDetails(seriesId),
          tmdbApi.getTVSeason(seriesId, parseInt(seasonParam))
        ]);
        
        setTvShow(tvDetails as TMDBTVShow);
        setEpisodes(episodesData.episodes);
        setLoadingEpisodes(false);

        // Vérifier les vidéos en parallèle avec les autres requêtes
        const episodesWithVideoSet = new Set<number>();
        const episodesWithoutVideoSet = new Set<number>();
        
        // Vérifier tous les épisodes de la saison (pas seulement les 20 premiers)
        const videoCheckPromises = episodesData.episodes.map(async (episode: TMDBEpisode) => {
          try {
            const res = await fetch(`/api/series/${seriesId}?season=${seasonParam}&episode=${episode.episode_number}`);
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

        // Sources vidéo pour l'épisode actuel
        const res = await fetch(
          `/api/series/${seriesId}?season=${encodeURIComponent(
            seasonParam
          )}&episode=${encodeURIComponent(episodeParam)}`
        );
        if (!res.ok) {
          setError("Aucune source vidéo trouvée pour cette série");
          return;
        }
        const data = await res.json();
        setVideos(data.videos || []);
      } catch (err) {
        console.error("Error fetching series videos:", err);
        setError("Erreur lors du chargement des vidéos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, seasonParam, episodeParam]);

  const findPreviousEpisodeWithVideo = (currentEpisode: number) => {
    for (let i = currentEpisode - 1; i >= 1; i--) {
      if (!episodesWithoutVideos.has(i)) {
        return i;
      }
    }
    return null;
  };

  const findNextEpisodeWithVideo = (currentEpisode: number) => {
    for (let i = currentEpisode + 1; i <= episodes.length; i++) {
      if (!episodesWithoutVideos.has(i)) {
        return i;
      }
    }
    return null;
  };

  const handleBackToDetails = () => {
    const seriesId = params.id as string;
    router.push(`/series/${seriesId}`);
  };

  const handleEpisodeClick = (episodeNumber: number) => {
    const seriesId = params.id as string;
    router.push(`/series/${seriesId}/watch?season=${seasonParam}&episode=${episodeNumber}`);
  };

  const selectedVideo = videos[selectedIndex];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Video Player Section */}
      <div className="pt-16">
        {/* Zone player type "hero" */}
        <div className="bg-gradient-to-b from-black via-black/80 to-black">
          <div className="px-4 md:px-8 lg:px-16 py-6 md:py-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
                  <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
                </div>
                <div className="text-lg text-gray-300">
                  Chargement du lecteur...
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="text-lg text-red-500 text-center">{error}</div>
                <button
                  onClick={handleBackToDetails}
                  className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Retour à la série
                </button>
              </div>
            ) : (
              <div className="w-full">
                {videos.length === 0 ? (
                  /* Message d'erreur si aucune vidéo disponible */
                  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="text-6xl mb-4">🎬</div>
                    <h2 className="text-2xl font-bold text-white text-center">
                      Aucune vidéo disponible
                    </h2>
                    <p className="text-gray-400 text-center max-w-md">
                      Cet épisode n'est pas encore disponible ou n'a pas de source vidéo.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <button
                        onClick={handleBackToDetails}
                        className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-white font-medium"
                      >
                        Retour à la série
                      </button>
                      {episodes.length > 0 && (
                        <div className="text-sm text-gray-400">
                          Essayez un autre épisode ({episodes.length} disponibles)
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonne gauche : Lecteur vidéo */}
                    <div className="lg:col-span-2">
                      <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl mb-4">
                        <iframe
                          key={selectedVideo.url}
                          src={selectedVideo.url}
                          allowFullScreen
                          referrerPolicy="no-referrer"
                          className="w-full h-full border-0"
                        />
                      </div>

                      {/* Infos de la source actuelle */}
                      {selectedVideo && (
                        <div className="bg-gray-900/30 backdrop-blur-sm rounded-lg px-4 py-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="text-gray-300">
                              <span className="font-medium">Serveur:</span> {selectedVideo.server || 'Source'} • 
                              <span className="font-medium ml-2">Version:</span> {selectedVideo.lang?.toUpperCase() || 'FR'} • 
                              <span className="font-medium ml-2">Qualité:</span> {selectedVideo.quality}
                            </div>
                            {selectedVideo.hasAds && (
                              <span className="px-2 py-1 bg-yellow-600/30 text-yellow-400 rounded text-xs font-medium">
                                ⚠️ Contient des pubs
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Infos série et épisode sous le lecteur */}
                      <div className="space-y-4">
                        {/* Infos série */}
                        {tvShow && (
                          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex gap-4">
                              {/* Poster de la série */}
                              <div className="flex-shrink-0">
                                {tvShow.poster_path ? (
                                  <img
                                    src={tmdbApi.getImageUrl(tvShow.poster_path) || ''}
                                    alt={tvShow.name}
                                    className="w-24 h-36 object-cover rounded-lg shadow-lg"
                                  />
                                ) : (
                                  <div className="w-24 h-36 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <div className="text-gray-500 text-xs text-center">Pas d'affiche</div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Infos texte */}
                              <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white mb-2">
                                  {tvShow.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                                  <span>
                                    {new Date(tvShow.first_air_date).getFullYear()}
                                  </span>
                                  <span>•</span>
                                  {tvShow.number_of_seasons && (
                                    <>
                                      <span>
                                        {tvShow.number_of_seasons} saison
                                        {tvShow.number_of_seasons > 1 ? "s" : ""}
                                      </span>
                                      <span>•</span>
                                    </>
                                  )}
                                  <span>{tvShow.vote_average.toFixed(1)} ⭐</span>
                                </div>
                                {tvShow.overview && (
                                  <p className="text-sm text-gray-400 mt-3 line-clamp-3">
                                    {tvShow.overview}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Infos épisode actuel */}
                        {episodes.length > 0 && (
                          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h2 className="text-xl font-semibold text-white">
                                  S{seasonParam.toString().padStart(2, "0")} • E
                                  {episodeParam.toString().padStart(2, "0")}
                                </h2>
                                <h3 className="text-lg text-gray-200 mt-1">
                                  {episodes.find(ep => ep.episode_number === parseInt(episodeParam))?.name}
                                </h3>
                              </div>
                              {/* Sélecteur de sources */}
                              {videos.length > 0 && (
                                <div className="relative">
                                  <select
                                    value={selectedIndex}
                                    onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
                                    className="bg-gray-700 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none appearance-none cursor-pointer pr-8"
                                  >
                                    {videos.map((video, index) => (
                                      <option key={index} value={index}>
                                        {video.server || 'Source'} • {video.lang?.toUpperCase() || 'FR'} • {video.quality}
                                        {video.hasAds && ' ⚠️ Pubs'}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {episodes.find(ep => ep.episode_number === parseInt(episodeParam))?.overview && (
                              <p className="text-sm text-gray-400 mb-4">
                                {episodes.find(ep => ep.episode_number === parseInt(episodeParam))?.overview}
                              </p>
                            )}

                            {/* Boutons navigation épisodes */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                              <button
                                onClick={() => {
                                  const currentEpisode = parseInt(episodeParam);
                                  const previousWithVideo = findPreviousEpisodeWithVideo(currentEpisode);
                                  if (previousWithVideo) {
                                    handleEpisodeClick(previousWithVideo);
                                  }
                                }}
                                disabled={!findPreviousEpisodeWithVideo(parseInt(episodeParam))}
                                className={`w-full sm:w-auto px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                  !findPreviousEpisodeWithVideo(parseInt(episodeParam))
                                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                                    : "bg-gray-700 text-white hover:bg-gray-600"
                                }`}
                              >
                                <span className="text-sm sm:text-base">←</span>
                                <span className="hidden sm:inline">Épisode précédent</span>
                                <span className="sm:hidden">Précédent</span>
                              </button>
                              
                              <div className="text-xs sm:text-sm text-gray-400">
                                {episodeParam} / {episodes.length}
                              </div>
                              
                              <button
                                onClick={() => {
                                  const currentEpisode = parseInt(episodeParam);
                                  const nextWithVideo = findNextEpisodeWithVideo(currentEpisode);
                                  if (nextWithVideo) {
                                    handleEpisodeClick(nextWithVideo);
                                  }
                                }}
                                disabled={!findNextEpisodeWithVideo(parseInt(episodeParam))}
                                className={`w-full sm:w-auto px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                  !findNextEpisodeWithVideo(parseInt(episodeParam))
                                    ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                                    : "bg-gray-700 text-white hover:bg-gray-600"
                                }`}
                              >
                                <span className="hidden sm:inline">Épisode suivant</span>
                                <span className="sm:hidden">Suivant</span>
                                <span className="text-sm sm:text-base">→</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Colonne droite : Liste des épisodes */}
                    <div className="lg:col-span-1">
                      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                          <h3 className="text-lg font-semibold text-white">
                            Saison {seasonParam}
                          </h3>
                          <p className="text-xs text-blue-100 opacity-90">
                            {episodes.length} épisode{episodes.length > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="max-h-[300px] sm:max-h-[400px] lg:max-h-[600px] overflow-y-auto custom-scrollbar">
                          {episodes.map((episode, index) => {
                            const hasVideo = !episodesWithoutVideos.has(episode.episode_number);
                            const isCurrentEpisode = episode.episode_number === parseInt(episodeParam);
                            
                            return (
                            <button
                              key={episode.id}
                              onClick={() => handleEpisodeClick(episode.episode_number)}
                              className={`w-full text-left border-b border-gray-800/50 transition-all duration-200 relative ${
                                isCurrentEpisode
                                  ? "bg-gray-800/80 shadow-lg"
                                  : hasVideo
                                  ? "hover:bg-gray-800/40"
                                  : "opacity-50 cursor-not-allowed"
                              }`}
                              disabled={!hasVideo && !isCurrentEpisode}
                            >
                              {/* Badge de disponibilité */}
                              <div className="absolute top-2 right-2 z-10">
                                {hasVideo ? (
                                  <span className="text-xs text-white bg-green-600 px-1.5 py-0.5 rounded-full font-semibold shadow-lg">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-xs text-white bg-red-600 px-1.5 py-0.5 rounded-full font-semibold shadow-lg">
                                    ✗
                                  </span>
                                )}
                              </div>
                              <div className="p-4">
                                <div className="flex gap-4">
                                  {/* Thumbnail */}
                                  <div className="relative flex-shrink-0">
                                    {episode.still_path ? (
                                      <img
                                        src={tmdbApi.getImageUrl(episode.still_path) || ''}
                                        alt={episode.name}
                                        className="w-20 h-12 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-20 h-12 bg-gray-700 rounded flex items-center justify-center">
                                        <div className="text-gray-500 text-xs font-medium">
                                          E{episode.episode_number}
                                        </div>
                                      </div>
                                    )}
                                    {isCurrentEpisode && (
                                      <div className="absolute inset-0 bg-blue-600/30 rounded flex items-center justify-center">
                                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                          <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5"></div>
                                        </div>
                                      </div>
                                    )}
                                    {!hasVideo && (
                                      <div className="absolute inset-0 bg-gray-900/70 rounded flex items-center justify-center">
                                        <div className="text-gray-400 text-xs font-medium">
                                          Pas de vidéo
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Episode Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className={`text-xs font-medium ${
                                            isCurrentEpisode
                                              ? "text-blue-400"
                                              : hasVideo
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          }`}>
                                            {episode.episode_number.toString().padStart(2, "0")}
                                          </span>
                                          {episode.runtime && (
                                            <span className="text-xs text-gray-500">
                                              {episode.runtime}min
                                            </span>
                                          )}
                                          {!hasVideo && (
                                            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                                              Indisponible
                                            </span>
                                          )}
                                        </div>
                                        <h4 className={`text-sm font-medium line-clamp-1 ${
                                          isCurrentEpisode
                                            ? "text-white"
                                            : hasVideo
                                            ? "text-gray-200"
                                            : "text-gray-500"
                                        }`}>
                                          {episode.name}
                                        </h4>
                                      </div>
                                    </div>
                                    
                                    {episode.overview && (
                                      <p className={`text-xs line-clamp-2 mt-2 leading-relaxed ${
                                        hasVideo ? "text-gray-400" : "text-gray-600"
                                      }`}>
                                        {episode.overview}
                                      </p>
                                    )}
                                    
                                    {episode.air_date && (
                                      <div className="text-xs text-gray-500 mt-2">
                                        {new Date(episode.air_date).toLocaleDateString('fr-FR', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        </div>
    </div>
  );
}
