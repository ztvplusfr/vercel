const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_HERO_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

export const tmdbApi = {
  async fetch(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', process.env.NEXT_PUBLIC_TMDB_API_KEY!);
    url.searchParams.set('language', 'fr-FR');
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }
    
    return response.json();
  },

  getTrending: (timeWindow: 'day' | 'week' = 'week') => 
    tmdbApi.fetch(`/trending/all/${timeWindow}`),

  getPopularMovies: () => 
    tmdbApi.fetch('/movie/popular'),

  getPopularTVShows: () => 
    tmdbApi.fetch('/tv/popular'),

  getTopRatedMovies: () => 
    tmdbApi.fetch('/movie/top_rated'),

  getTopRatedTVShows: () => 
    tmdbApi.fetch('/tv/top_rated'),

  getNowPlayingMovies: () => 
    tmdbApi.fetch('/movie/now_playing'),

  getOnTheAirTVShows: () => 
    tmdbApi.fetch('/tv/on_the_air'),

  searchMulti: (query: string) => 
    tmdbApi.fetch('/search/multi', { query }),

  // Get movies with filters
  async getMovies(page: number = 1, sortBy: string = 'popularity.desc', genre: string = '', year: string = '', minRating: string = '') {
    const params: Record<string, string> = {
      page: page.toString(),
      sort_by: sortBy,
      include_adult: 'false',
      language: 'fr-FR'
    };

    if (genre) params.with_genres = genre;
    if (year) params.primary_release_year = year;
    if (minRating) params['vote_average.gte'] = minRating;

    return this.fetch('/discover/movie', params);
  },

  // Get TV shows with filters
  async getTVShows(page: number = 1, sortBy: string = 'popularity.desc', genre: string = '', year: string = '', minRating: string = '') {
    const params: Record<string, string> = {
      page: page.toString(),
      sort_by: sortBy,
      include_adult: 'false',
      language: 'fr-FR'
    };

    if (genre) params.with_genres = genre;
    if (year) params.first_air_date_year = year;
    if (minRating) params['vote_average.gte'] = minRating;

    return this.fetch('/discover/tv', params);
  },

  // Get movie details
  async getMovieDetails(movieId: string) {
    return this.fetch(`/movie/${movieId}`, {
      language: 'fr-FR',
      append_to_response: 'credits,images',
      include_image_language: 'fr,null,en'
    });
  },

  // Get TV show details
  async getTVShowDetails(tvShowId: string) {
    return this.fetch(`/tv/${tvShowId}`, {
      language: 'fr-FR',
      append_to_response: 'credits,images',
      include_image_language: 'fr,null,en'
    });
  },

  // Get TV show season (episodes)
  async getTVSeason(tvShowId: string, seasonNumber: number | string) {
    return this.fetch(`/tv/${tvShowId}/season/${seasonNumber}`, {
      language: 'fr-FR',
    });
  },

  getImageUrl: (path: string) => 
    path ? `${TMDB_IMAGE_BASE_URL}${path}` : null,

  getHeroImageUrl: (path: string) => 
    path ? `${TMDB_HERO_IMAGE_BASE_URL}${path}` : null,
};

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TMDBImage {
  file_path: string;
  aspect_ratio: number;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  runtime?: number;
  air_date?: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  runtime?: number;
  genres?: Array<{
    id: number;
    name: string;
  }>;
  original_language: string;
  budget?: number;
  revenue?: number;
  production_companies?: Array<{
    id: number;
    name: string;
  }>;
  production_countries?: Array<{
    iso_3166_1: string;
    name: string;
  }>;
  credits?: {
    cast: TMDBCastMember[];
  };
  images?: {
    backdrops: TMDBImage[];
    posters: TMDBImage[];
  };
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  first_air_date: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: Array<{
    id: number;
    name: string;
  }>;
  original_language: string;
  status?: string;
  production_companies?: Array<{
    id: number;
    name: string;
  }>;
  production_countries?: Array<{
    iso_3166_1: string;
    name: string;
  }>;
  credits?: {
    cast: TMDBCastMember[];
  };
  images?: {
    backdrops: TMDBImage[];
    posters: TMDBImage[];
  };
}

export type TMDBContent = TMDBMovie | TMDBTVShow;
