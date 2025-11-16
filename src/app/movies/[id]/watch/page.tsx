"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { tmdbApi, TMDBMovie } from "@/lib/tmdb";
import Image from "next/image";
import { Download, ExternalLink, Play, Settings } from "lucide-react";

interface VideoSource {
  url: string;
  quality: string;
  lang: string;
  server: string;
  pub: boolean;
}

interface MovieVideo {
  url: string;
  lang: string;
  quality: string;
  pub: number;
  server?: string;
  hasAds?: boolean;
}

interface MovieVideosResponse {
  videos: MovieVideo[];
}

export default function MovieWatchPage() {
  const params = useParams();
  const router = useRouter();
  const [videos, setVideos] = useState<MovieVideo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [movie, setMovie] = useState<TMDBMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<'all' | 'FR' | 'VOSTFR'>('all');

  // Fetcher les vidéos directement côté client pour contourner les restrictions CORS
  const fetchVideos = async () => {
    try {
      // Appel direct à l'API depuis le client
      const response = await fetch(`https://api.movix.club/api/wiflix/movie/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch videos')
      const data = await response.json()
      
      const allVideos: MovieVideo[] = []
      
      // Parser la structure Wiflix avec players.vf et players.vostfr
      if (data.players) {
        const players = data.players
        
        // Ajouter les sources VF
        if (players.vf && Array.isArray(players.vf)) {
          players.vf.forEach((source: any, index: number) => {
            allVideos.push({
              url: source.url || '',
              quality: source.quality || 'HD',
              lang: 'FR',
              server: source.name || `Server ${index + 1}`,
              pub: source.pub ? 1 : 0,
              hasAds: source.pub || false
            })
          })
        }
        
        // Ajouter les sources VOSTFR
        if (players.vostfr && Array.isArray(players.vostfr)) {
          players.vostfr.forEach((source: any, index: number) => {
            allVideos.push({
              url: source.url || '',
              quality: source.quality || 'HD',
              lang: 'VOSTFR',
              server: source.name || `Server ${index + 1}`,
              pub: source.pub ? 1 : 0,
              hasAds: source.pub || false
            })
          })
        }
      }
      
      // Trier les vidéos : sans pubs en premier, puis FR/VF en priorité
      const sortedVideos = allVideos.sort((a, b) => {
        // D'abord trier par présence de pubs (sans pubs en premier)
        if (a.pub !== b.pub) {
          return a.pub ? 1 : -1
        }
        // Ensuite trier par langue (FR/VF en premier)
        if (a.lang === 'FR' && b.lang !== 'FR') return -1
        if (a.lang !== 'FR' && b.lang === 'FR') return 1
        return 0
      })
      
      setVideos(sortedVideos)
      if (sortedVideos.length > 0) {
        setSelectedIndex(0)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const movieId = params.id as string;
        if (!movieId) {
          setError("ID de film non valide");
          return;
        }

        // Infos du film via TMDB
        const movieDetails = await tmdbApi.getMovieDetails(movieId);
        setMovie(movieDetails as TMDBMovie);

        await fetchVideos();
      } catch (err) {
        console.error("Error fetching movie videos:", err);
        setError("Erreur lors du chargement des vidéos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleBackToDetails = () => {
    const movieId = params.id as string;
    router.push(`/movies/${movieId}`);
  };

  const selectedVideo = videos[selectedIndex];

  // Filtrer les vidéos selon la langue sélectionnée
  const filteredVideos = videos.filter(video => {
    if (selectedLang === 'all') return true;
    return video.lang === selectedLang;
  });

  // Trouver l'index dans les vidéos filtrées
  const filteredIndex = filteredVideos.findIndex(video => video.url === selectedVideo.url);
  const handleFilteredSelect = (index: number) => {
    const video = filteredVideos[index];
    const originalIndex = videos.findIndex(v => v.url === video.url);
    setSelectedIndex(originalIndex);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Video Player Section */}
      <div className="pt-16">
        {/* Zone player type "hero" */}
        <div className="bg-gradient-to-b from-black via-black/80 to-black">
          <div className="px-4 md:px-8 lg:px-16 py-6 md:py-8">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBackToDetails}
                className="text-sm md:text-base text-gray-300 hover:text-white flex items-center gap-2"
              >
                <span className="text-lg">←</span>
                <span>Retour au détail du film</span>
              </button>
            </div>

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
                  Retour au film
                </button>
              </div>
              ) : (
              <div className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Colonne principale : Lecteur vidéo et infos */}
                  <div className="lg:col-span-3">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl mb-4">
                      <iframe
                        key={selectedVideo.url}
                        src={selectedVideo.url}
                        allowFullScreen
                        referrerPolicy="no-referrer"
                        className="w-full h-full border-0"
                      />
                    </div>

                    {/* Infos film principales */}
                    {movie && (
                      <div className="space-y-4 mb-4">
                        {/* Titre et informations avec affiche */}
                        <div className="flex gap-4">
                          {/* Poster du film */}
                          {movie.poster_path && (
                            <div className="hidden md:block">
                              <img
                                src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`}
                                alt={movie.title}
                                className="w-24 h-36 object-cover rounded-lg shadow-lg"
                              />
                            </div>
                          )}
                          
                          {/* Titre et informations */}
                          <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">
                              {movie.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-300 mb-2">
                              <span>{new Date(movie.release_date).getFullYear()}</span>
                              <span>•</span>
                              <span>
                                {movie.runtime ? `${movie.runtime} min` : "Durée inconnue"}
                              </span>
                              <span>•</span>
                              <span>{movie.vote_average.toFixed(1)} ⭐</span>
                            </div>
                            
                            {/* Infos vidéo sous forme de badges */}
                            {selectedVideo && (
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-xs font-medium">
                                  📺 {selectedVideo.server || 'Source'}
                                </span>
                                <span className="px-2 py-1 bg-blue-600/30 text-blue-400 rounded text-xs font-medium">
                                  🌍 {selectedVideo.lang?.toUpperCase() || 'FR'}
                                </span>
                                <span className="px-2 py-1 bg-green-600/30 text-green-400 rounded text-xs font-medium">
                                  🎥 {selectedVideo.quality}
                                </span>
                                {selectedVideo.hasAds && (
                                  <span className="px-2 py-1 bg-yellow-600/30 text-yellow-400 rounded text-xs font-medium">
                                    ⚠️ Contient des pubs
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Synopsis sur toute la largeur */}
                        {movie.overview && (
                          <div className="w-full">
                            <p className="text-xs md:text-sm text-gray-400 line-clamp-3 md:line-clamp-4">
                              {movie.overview}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Version mobile uniquement */}
                    {selectedVideo && (
                      <div className="mt-2 text-xs md:text-sm text-gray-400 md:hidden">
                        Serveur: {selectedVideo.server} • Version: {selectedVideo.lang?.toUpperCase() || 'FR'} • {selectedVideo.quality}
                        {selectedVideo.hasAds && (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-600/30 text-yellow-400 rounded text-xs">
                            ⚠️ Contient des pubs
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Colonne droite : Sources avec scroll */}
                  <div className="lg:col-span-1">
                    <div className="lg:sticky lg:top-24 lg:h-screen lg:overflow-y-auto">
                      <div className="pb-20">
                        <h3 className="text-lg font-semibold mb-3 text-white">
                          Sources
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                          Choisissez une source si la lecture rencontre un problème.
                        </p>
                        
                        {/* Onglets de filtrage par langue */}
                        <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1">
                          <button
                            onClick={() => setSelectedLang('all')}
                            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                              selectedLang === 'all'
                                ? "bg-red-600 text-white"
                                : "text-gray-400 hover:text-white hover:bg-gray-700"
                            }`}
                          >
                            Toutes ({videos.length})
                          </button>
                          <button
                            onClick={() => setSelectedLang('FR')}
                            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                              selectedLang === 'FR'
                                ? "bg-red-600 text-white"
                                : "text-gray-400 hover:text-white hover:bg-gray-700"
                            }`}
                          >
                            VF ({videos.filter(v => v.lang === 'FR').length})
                          </button>
                          <button
                            onClick={() => setSelectedLang('VOSTFR')}
                            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                              selectedLang === 'VOSTFR'
                                ? "bg-red-600 text-white"
                                : "text-gray-400 hover:text-white hover:bg-gray-700"
                            }`}
                          >
                            VOSTFR ({videos.filter(v => v.lang === 'VOSTFR').length})
                          </button>
                        </div>
                        
                        {/* Liste des sources filtrées */}
                        <div className="space-y-2">
                          {filteredVideos.length > 0 ? (
                            filteredVideos.map((video, index) => (
                              <button
                                key={video.url}
                                onClick={() => handleFilteredSelect(index)}
                                className={`w-full px-3 py-3 rounded-lg text-sm border transition-colors text-left ${
                                  index === filteredIndex
                                    ? "bg-red-600 border-red-600 text-white"
                                    : "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="font-medium text-sm">
                                    {video.server || 'Source'}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs opacity-80">
                                    <span>{video.lang?.toUpperCase() || 'FR'}</span>
                                    <span>•</span>
                                    <span>{video.quality}</span>
                                  </div>
                                  {video.hasAds && (
                                    <div className="text-xs">
                                      <span className="px-1.5 py-0.5 bg-yellow-600/30 text-yellow-400 rounded">
                                        ⚠️ Contient des pubs
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <p className="text-sm">Aucune source {selectedLang === 'FR' ? 'VF' : selectedLang === 'VOSTFR' ? 'VOSTFR' : ''} disponible</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
