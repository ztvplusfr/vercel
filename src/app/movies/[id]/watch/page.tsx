"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { tmdbApi, TMDBMovie } from "@/lib/tmdb";
import Image from "next/image";
import { Download, ExternalLink, Play, Settings } from "lucide-react";

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

        // Sources vidéo via notre API
        const res = await fetch(`/api/movies/${movieId}`);
        if (!res.ok) {
          setError("Aucune source vidéo trouvée pour ce film");
          return;
        }

        const data = (await res.json()) as MovieVideosResponse;
        if (!data.videos || data.videos.length === 0) {
          setError("Aucune source vidéo disponible");
          return;
        }

        setVideos(data.videos);
        setSelectedIndex(0);
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
              {selectedVideo && (
                <div className="hidden md:flex text-xs md:text-sm text-gray-400">
                  Serveur: {selectedVideo.server} • Version: {selectedVideo.lang?.toUpperCase() || 'FR'} • {selectedVideo.quality}
                  {selectedVideo.hasAds && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-600/30 text-yellow-400 rounded text-xs">
                      ⚠️ Contient des pubs
                    </span>
                  )}
                </div>
              )}
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
              <div className="w-full max-w-6xl">
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
                  <div className="space-y-2 mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {movie.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-300">
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                      <span>•</span>
                      <span>
                        {movie.runtime ? `${movie.runtime} min` : "Durée inconnue"}
                      </span>
                      <span>•</span>
                      <span>{movie.vote_average.toFixed(1)} ⭐</span>
                    </div>
                    {movie.overview && (
                      <p className="text-xs md:text-sm text-gray-400 line-clamp-3 md:line-clamp-4">
                        {movie.overview}
                      </p>
                    )}
                  </div>
                )}

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
            )}
          </div>
        </div>

        {/* Section sources, style similaire aux autres pages */}
        {!loading && !error && (
          <div className="px-4 md:px-8 lg:px-16 py-6 md:py-8 bg-black">
            <h2 className="text-lg md:text-xl font-semibold mb-3">
              Sources disponibles
            </h2>
            <p className="text-xs md:text-sm text-gray-400 mb-3">
              Choisissez une autre source si la lecture rencontre un problème.
            </p>
            <div className="flex flex-wrap gap-2">
              {videos.map((video, index) => (
                <button
                  key={video.url}
                  onClick={() => setSelectedIndex(index)}
                  className={`px-3 py-2 rounded-md text-xs md:text-sm border transition-colors ${
                    index === selectedIndex
                      ? "bg-red-600 border-red-600 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{video.server || 'Source'}</span>
                    <span>•</span>
                    <span>{video.lang?.toUpperCase() || 'FR'}</span>
                    <span>•</span>
                    <span>{video.quality}</span>
                    {video.hasAds && (
                      <span className="px-1.5 py-0.5 bg-yellow-600/30 text-yellow-400 rounded text-xs">
                        ⚠️ Pubs
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
