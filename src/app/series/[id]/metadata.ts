import type { Metadata } from "next";
import { tmdbApi, TMDBTVShow } from "@/lib/tmdb";

interface Params {
  params: { id: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  try {
    const tvShow = (await tmdbApi.getTVShowDetails(params.id)) as TMDBTVShow;
    const title = tvShow.name || "Série";
    const imageUrl =
      tmdbApi.getHeroImageUrl(tvShow.backdrop_path) ||
      tmdbApi.getImageUrl(tvShow.poster_path) ||
      "/placeholder-hero.jpg";

    return {
      title: `${title} - ZTVPlus`,
      description: tvShow.overview || `Regardez ${title} sur ZTVPlus`,
      openGraph: {
        title: `${title} - ZTVPlus`,
        description: tvShow.overview || `Regardez ${title} sur ZTVPlus`,
        type: "video.tv_show",
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
        description: tvShow.overview || `Regardez ${title} sur ZTVPlus`,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Série - ZTVPlus",
      description: "Détail de la série sur ZTVPlus",
    };
  }
}
