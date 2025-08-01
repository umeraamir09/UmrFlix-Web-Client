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
  ContinueFrom?: number;
  DurationTicks?: number;
  Duration?: string;
};

export default function TvSection({ style }: Props) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const res = await fetch('/api/media/getContinueWatching', { 
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setMedia(data.items || []);
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setError('Request timed out. Please try again.');
          } else {
            setError(`Failed to load continue watching: ${error.message}`);
          }
        } else {
          setError('An unknown error occurred');
        }
        console.error('Failed to load media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  if (loading) {
    return (
      <section className={`px-2 text-white py-4${style ? ` ${style}` : ''}`}>
        <div className='w-full mx-auto'>
          <h1 className='text-3xl mb-5'>Continue Watching</h1>
          <div className='text-center py-8'>Loading...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`px-2 text-white py-4${style ? ` ${style}` : ''}`}>
        <div className='w-full mx-auto'>
          <h1 className='text-3xl mb-5'>Continue Watching</h1>
          <div className='text-center py-8 text-red-400'>{error}</div>
        </div>
      </section>
    );
  }

  if (media.length === 0) {
    return (
      <section className={`px-2 text-white py-4${style ? ` ${style}` : ''}`}>
        <div className='w-full mx-auto'>
          <h1 className='text-3xl mb-5'>Continue Watching</h1>
          <div className='text-center py-8 text-gray-400'>No items to continue watching</div>
        </div>
      </section>
    );
  }

  return (
    <section className={`px-2 text-white py-4${style ? ` ${style}` : ''}`}>
      <div className='w-full mx-auto'>
        <Carousel movies={media} label='Continue Watching' wide={true} showProgress={true} />
      </div>
    </section>
  );
}
