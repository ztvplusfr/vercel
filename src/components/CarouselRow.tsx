"use client";

import { TMDBContent } from '@/lib/tmdb';
import { MovieCard } from './MovieCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CarouselRowProps {
  title: string;
  contents: TMDBContent[];
  onContentClick?: (content: TMDBContent) => void;
}

export function CarouselRow({ title, contents, onContentClick }: CarouselRowProps) {
  const handleContentClick = (content: TMDBContent) => {
    if (onContentClick) {
      onContentClick(content);
    } else {
      // Navigation par défaut si pas de handler
      if ('title' in content) {
        window.location.href = `/movies/${content.id}`;
      } else {
        window.location.href = `/series/${content.id}`;
      }
    }
  };
  return (
    <div className="relative mb-8">
      <h2 className="text-white text-2xl font-bold mb-4 px-2 md:px-4">{title}</h2>
      
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full group"
      >
        <CarouselContent className="px-2 md:px-4">
          {contents.map((content) => (
            <CarouselItem key={content.id} className="basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7">
              <MovieCard
                content={content}
                onClick={() => handleContentClick(content)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex left-0 bg-red-600 hover:bg-red-700 border-red-600 text-white w-12 h-12 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110" />
        <CarouselNext className="hidden md:flex right-0 bg-red-600 hover:bg-red-700 border-red-600 text-white w-12 h-12 rounded-full shadow-lg transform transition-all duration-200 hover:scale-110" />
      </Carousel>
    </div>
  );
}
