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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const res = await fetch('/api/media/getMovies', { 
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (res.status === 401) {
          // Try to refresh token
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });
          
          if (refreshRes.ok && retryCount < 2) {
            // Retry the original request
            return fetchMedia(retryCount + 1);
          } else {
            // Redirect to login
            window.location.href = '/login';
            return;
          }
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setMedia(data.items || []);
    } catch (error: any) {
      console.error('Failed to load media:', error);
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to load movies. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  if (loading) {
    return (
      <main className={`px-2 text-white pt-8${style ? ` ${style}` : ''}`}>
        <div className='w-full'>
          <h2 className='text-xl font-bold mb-4'>Movies</h2>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
            <span className='ml-3'>Loading movies...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`px-2 text-white pt-8${style ? ` ${style}` : ''}`}>
        <div className='w-full'>
          <h2 className='text-xl font-bold mb-4'>Movies</h2>
          <div className='flex flex-col items-center justify-center py-8'>
            <p className='text-red-400 mb-4'>{error}</p>
            <button 
              onClick={() => fetchMedia()} 
              className='px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors'
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`px-2 text-white pt-8${style ? ` ${style}` : ''}`}>
        <div className='w-full'>
        <Carousel key="movies-carousel" movies={media} label='Movies'  />
      </div>
    </main>
    
  );
}
