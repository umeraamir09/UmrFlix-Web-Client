'use client';
import { useEffect, useState } from 'react';
import Carousel from './Carousel';

interface Props {
  style?: string;
}

type MediaItem = {
  Id: string;
  Name: string;
  Type: 'Movie' | 'Series';
  ImageUrl: string;
};

export default function MediaCarousel({ style }: Props) {
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch('/api/media/getMovies', { credentials: 'include' });
        const data = await res.json();
        setMedia(data.items || []);
      } catch (error) {
        console.error('Failed to load media:', error);
      }
    };

    fetchMedia();
  }, []);

  return (
    <main className={`px-2 text-white pt-8${style ? ` ${style}` : ''}`}>
        <div className='w-full'>
        <Carousel key="movies-carousel" movies={media} label='Movies'  />
      </div>
    </main>
    
  );
}
