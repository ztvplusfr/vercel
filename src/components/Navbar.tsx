"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Home, Film, Tv, X, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { tmdbApi, TMDBContent } from "@/lib/tmdb";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBContent[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Détecter si on est sur une page de détail (movies ou series)
  const [isDetailPage, setIsDetailPage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const pathname = window.location.pathname;
    // Pages de détail : /movies/[id], /movies/[id]/watch, /series/[id], ...
    const isMovieDetail = pathname.startsWith('/movies/') && pathname !== '/movies/';
    const isSeriesDetail = pathname.startsWith('/series/') && pathname !== '/series/';
    setIsDetailPage(isMovieDetail || isSeriesDetail);
  }, []);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    await performSearch();
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const searchResponse = await tmdbApi.searchMulti(searchQuery.trim());
      const filteredResults = (searchResponse.results || []).filter(
        (item: any) => item.media_type === "movie" || item.media_type === "tv"
      );
      setSearchResults(filteredResults.slice(0, 10) as TMDBContent[]);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300); // Délai de 300ms pour éviter trop de requêtes

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCloseResults = () => {
    setShowResults(false);
    setSearchQuery('');
    setMobileSearchOpen(false);
  };

  const handleResultClick = (content: TMDBContent) => {
    setSearchQuery('');
    setShowResults(false);
    // Redirige vers la page de détail correspondante
    if ('title' in content) {
      router.push(`/movies/${content.id}`);
    } else {
      router.push(`/series/${content.id}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const searchContainer = target.closest('.search-container');
      
      if (!searchContainer && showResults) {
        setShowResults(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 md:h-20 transition-all duration-300 ${
          isScrolled ? "bg-black bg-opacity-90 backdrop-blur-md" : "bg-transparent"
        } relative`}
      >
        <div className="flex h-full items-center justify-between px-4 md:px-16">
          <div className="flex items-center gap-8">
            {isDetailPage && (
              <Link 
                href="/" 
                className="flex items-center gap-2 text-white hover:text-gray-300 transition"
              >
                <ArrowLeft size={20} />
                <span>Retour</span>
              </Link>
            )}
            
            <Link
              href="/"
              className={`${isDetailPage ? 'hidden md:flex' : 'flex'} items-center`}
            >
              <Image
                src="/logo.png"
                alt="ZTVPlus"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-white hover:text-gray-300 transition">Accueil</Link>
              <Link href="/series" className="text-white hover:text-gray-300 transition">Séries</Link>
              <Link href="/movies" className="text-white hover:text-gray-300 transition">Films</Link>
            </div>
          </div>

          {/* Mobile centered logo on detail pages */}
          {isDetailPage && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center md:hidden pointer-events-none">
              <Link href="/" className="flex items-center pointer-events-auto">
                <Image
                  src="/logo.png"
                  alt="ZTVPlus"
                  width={100}
                  height={28}
                  className="h-7 w-auto"
                  priority
                />
              </Link>
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Desktop search */}
            <div className="relative hidden md:block search-container">
              <form onSubmit={handleSearch}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  className="pl-10 bg-gray-700 bg-opacity-50 text-white border-gray-600 focus:border-red-600 w-64"
                />
              </form>
              
              {showResults && (
                <div className="absolute top-full mt-2 w-full bg-black bg-opacity-95 backdrop-blur-md rounded-lg shadow-xl max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between p-3 border-b border-gray-700">
                    <div className="text-white text-sm font-medium">Résultats de recherche</div>
                    <button
                      onClick={handleCloseResults}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  {isSearching ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="text-gray-400 text-sm">Recherche en cours...</div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((content) => (
                      <div
                        key={content.id}
                        onClick={() => handleResultClick(content)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer transition"
                      >
                        <img
                          src={tmdbApi.getImageUrl(content.poster_path) || '/placeholder.jpg'}
                          alt={'title' in content ? content.title : content.name}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-medium">
                            {'title' in content ? content.title : content.name}
                          </h4>
                          <p className="text-gray-400 text-xs">
                            {'release_date' in content ? content.release_date?.split('-')[0] : content.first_air_date?.split('-')[0]}
                            {' • '}
                            {content.vote_average?.toFixed(1)} ⭐
                          </p>
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                            {content.overview}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : searchQuery.trim() ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="text-gray-400 text-sm">Aucun résultat trouvé</div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            {/* Mobile search overlay + results */}
            {mobileSearchOpen && (
              <div className="absolute inset-x-0 top-full md:hidden z-50 bg-black bg-opacity-95 backdrop-blur-md border-b border-gray-800 search-container">
                <div className="px-4 py-2">
                  <div className="relative">
                    <form onSubmit={handleSearch}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <Input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="pl-10 pr-10 bg-black bg-opacity-80 text-white border-gray-700 focus:border-red-600 w-full"
                      />
                    </form>
                    <button
                      type="button"
                      onClick={handleCloseResults}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {showResults && (
                  <div className="max-h-80 overflow-y-auto border-t border-gray-800">
                    {isSearching ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="text-gray-400 text-sm">Recherche en cours...</div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((content) => (
                        <div
                          key={content.id}
                          onClick={() => handleResultClick(content)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900 cursor-pointer transition"
                        >
                          <img
                            src={tmdbApi.getImageUrl(content.poster_path) || '/placeholder.jpg'}
                            alt={'title' in content ? content.title : content.name}
                            className="w-10 h-14 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="text-white text-sm font-medium">
                              {'title' in content ? content.title : content.name}
                            </h4>
                            <p className="text-gray-400 text-xs">
                              {'release_date' in content ? content.release_date?.split('-')[0] : content.first_air_date?.split('-')[0]}
                              {' • '}
                              {content.vote_average?.toFixed(1)} ⭐
                            </p>
                          </div>
                        </div>
                      ))
                    ) : searchQuery.trim() ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="text-gray-400 text-sm">Aucun résultat trouvé</div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Mobile icon bar (hidden on detail pages) */}
            {!isDetailPage && (
              <div className="flex items-center gap-3 md:hidden">
                <button
                  onClick={() => router.push("/")}
                  className="text-white hover:text-gray-300 transition"
                  aria-label="Accueil"
                >
                  <Home size={20} />
                </button>
                <button
                  onClick={() => router.push("/movies")}
                  className="text-white hover:text-gray-300 transition"
                  aria-label="Films"
                >
                  <Film size={20} />
                </button>
                <button
                  onClick={() => router.push("/series")}
                  className="text-white hover:text-gray-300 transition"
                  aria-label="Séries"
                >
                  <Tv size={20} />
                </button>
                <button
                  onClick={() => {
                    setMobileSearchOpen(true);
                    setShowResults(true);
                  }}
                  className="text-white hover:text-gray-300 transition"
                  aria-label="Rechercher"
                >
                  <Search size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
