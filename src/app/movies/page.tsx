'use client';

import { ContentGrid } from '@/components/ContentGrid';

export default function MoviesPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <div className="container mx-auto px-4 py-8">
        <ContentGrid contentType="movie" title="Films Populaires" />
      </div>
    </div>
  );
}
