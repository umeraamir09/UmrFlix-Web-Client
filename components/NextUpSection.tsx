'use client';
import { useEffect, useState } from 'react';
import Carousel from './Carousel';

interface Props {
  style?: string;
}

type MediaItem = {
  Id: string;
  Name: string;
  Type: 'Movie' | 'Series' | 'Episode';
  ImageUrl: string;
  SeriesName?: string;
  SeasonName?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  ContinueFrom?: number;
  DurationTicks?: number;
  Duration?: string;
};

export default function NextUpSection({ style }: Props) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [continueWatching, setContinueWatching] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, fetch continue watching items
        const continueRes = await fetch('/api/media/getContinueWatching', { credentials: 'include' });
        let continueWatchingIds = new Set<string>();
        
        if (continueRes.ok) {
          const continueData = await continueRes.json();
          const ids = continueData.items.map((item: MediaItem) => item.Id);
          continueWatchingIds = new Set(ids);
          setContinueWatching(continueWatchingIds);
        }
        
        // Then fetch next up items
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const nextUpRes = await fetch('/api/media/getNextUp', { 
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!nextUpRes.ok) {
          throw new Error(`HTTP error! status: ${nextUpRes.status}`);
        }
        
        const nextUpData = await nextUpRes.json();
        // Filter out items that are already in continue watching
        const filteredItems = (nextUpData.items || []).filter((item: MediaItem) => 
          !continueWatchingIds.has(item.Id)
        );
        setMedia(filteredItems);
        
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setError('Request timed out. Please try again.');
          } else {
            setError(`Failed to load next up: ${error.message}`);
          }
        } else {
          setError('An unknown error occurred');
        }
        console.error('Failed to load media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className={`px-2 text-white py-4${style ? ` ${style}` : ''}`}>
        <div className='w-full mx-auto'>
          <h1 className='text-3xl mb-5'>Next Up</h1>
          <div className='text-center py-8'>Loading...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`px-2 text-white py-4${style ? ` ${style}` : ''}`}>
        <div className='w-full mx-auto'>
          <h1 className='text-3xl mb-5'>Next Up</h1>
          <div className='text-center py-8 text-red-400'>{error}</div>
        </div>
      </section>
    );
  }

  if (media.length === 0) {
    return (
      <section className={`px-2 text-white py-4${style ? ` ${style}` : ''}`}>
        <div className='w-full mx-auto'>
          <h1 className='text-3xl mb-5'>Next Up</h1>
          <div className='text-center py-8 text-gray-400'>No new episodes or items available</div>
        </div>
      </section>
    );
  }

  return (
    <section className={`px-2 text-white py-4${style ? ` ${style}` : ''}`}>
      <div className='w-full mx-auto'>
        <Carousel movies={media} label='Next Up' wide={true} />
      </div>
    </section>
  );
}
