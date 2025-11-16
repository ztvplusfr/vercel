import type { Metadata } from "next";
import { tmdbApi, TMDBMovie } from "@/lib/tmdb";

interface Params {
  params: { id: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    const movie = (await tmdbApi.getMovieDetails(params.id)) as TMDBMovie;
    const title = movie.title || "Film";
    const imageUrl =
      tmdbApi.getHeroImageUrl(movie.backdrop_path) ||
      tmdbApi.getImageUrl(movie.poster_path) ||
      "/placeholder-hero.jpg";

    return {
      title: `${title} - ZTVPlus`,
      description: movie.overview || `Regardez ${title} sur ZTVPlus`,
      openGraph: {
        title: `${title} - ZTVPlus`,
        description: movie.overview || `Regardez ${title} sur ZTVPlus`,
        type: "video.movie",
        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 1280,
                height: 720,
                alt: title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} - ZTVPlus`,
        description: movie.overview || `Regardez ${title} sur ZTVPlus`,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Film - ZTVPlus",
      description: "Détail du film sur ZTVPlus",
    };
  }
}
