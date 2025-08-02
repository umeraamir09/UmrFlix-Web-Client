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

export default function TvSection({ style }: Props) {
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch('/api/media/getShows', { credentials: 'include' });
        const data = await res.json();
        setMedia(data.items || []);
      } catch (error) {
        console.error('Failed to load media:', error);
      }
    };

    fetchMedia();
  }, []);

  return (
    <section className={`px-2 text-white py-4${style ? ` ${style}` : ''}`}>
      <div className='w-full mx-auto'>
        <Carousel key="tv-shows-carousel" movies={media} label='TV Shows'  />
      </div>
    </section>
  );
}
