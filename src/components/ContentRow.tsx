import { TMDBContent } from '@/lib/tmdb';
import { MovieCard } from './MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ContentRowProps {
  title: string;
  contents: TMDBContent[];
}

export function ContentRow({ title, contents }: ContentRowProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const maxScroll = Math.max(0, contents.length * 220 - window.innerWidth + 100);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`row-${title.replace(/\s+/g, '-')}`);
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(maxScroll, scrollPosition + scrollAmount);
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-white text-2xl font-bold mb-4">{title}</h2>
      
      <div className="relative group">
        {scrollPosition > 0 && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-black bg-opacity-50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75"
          >
            <ChevronLeft className="text-white" size={24} />
          </button>
        )}
        
        {scrollPosition < maxScroll && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-black bg-opacity-50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75"
          >
            <ChevronRight className="text-white" size={24} />
          </button>
        )}
        
        <div
          id={`row-${title.replace(/\s+/g, '-')}`}
          className="flex gap-4 overflow-x-hidden scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          {contents.map((content) => (
            <div key={content.id} className="flex-shrink-0 w-[200px]">
              <MovieCard content={content} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
