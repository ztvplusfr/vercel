"use client";

import { useRouter } from "next/navigation";
import { TMDBContent } from "@/lib/tmdb";
import { MovieCard } from "./MovieCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";

interface RankedRowProps {
  title: string;
  contents: TMDBContent[];
  onContentClick?: (content: TMDBContent) => void;
}

export function RankedRow({ title, contents, onContentClick }: RankedRowProps) {
  const router = useRouter();

  const topTen = contents.slice(0, 10);

  const handleContentClick = (content: TMDBContent) => {
    if (onContentClick) {
      onContentClick(content);
      return;
    }

    if ("title" in content) {
      router.push(`/movies/${content.id}`);
    } else {
      router.push(`/series/${content.id}`);
    }
  };

  if (topTen.length === 0) return null;

  return (
    <section className="relative mb-8">
      <h2 className="text-white text-2xl font-bold mb-4 px-2 md:px-4">
        {title}
      </h2>

      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full group"
      >
        <CarouselContent className="px-2 md:px-4">
          {topTen.map((content, index) => (
            <CarouselItem
              key={content.id}
              className="basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7"
            >
              <div className="relative">
                <MovieCard
                  content={content}
                  onClick={() => handleContentClick(content)}
                />
                {/* Rang sous forme d'étoile, en haut à gauche, sans modifier la taille de la carte */}
                <div className="absolute left-1 top-1 z-10 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <Star className="w-7 h-7 md:w-9 md:h-9 text-yellow-400 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)] fill-yellow-400" />
                    <span className="absolute text-[10px] md:text-xs font-bold text-black">
                      {index + 1}
                    </span>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex left-0 bg-red-600 hover:bg-red-700 border-red-600 text-white w-12 h-12 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110" />
        <CarouselNext className="hidden md:flex right-0 bg-red-600 hover:bg-red-700 border-red-600 text-white w-12 h-12 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110" />
      </Carousel>
    </section>
  );
}
