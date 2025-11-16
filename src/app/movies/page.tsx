import { ContentGrid } from '@/components/ContentGrid';
import { Navbar } from '@/components/Navbar';

export default function MoviesPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-8 md:pt-10">
        <ContentGrid 
          contentType="movie" 
          title="Films" 
        />
      </div>
    </div>
  );
}
