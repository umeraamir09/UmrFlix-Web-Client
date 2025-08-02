'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from './ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import Image from 'next/image';
import Play from './icons/Play';
import { Button } from './ui/button';
import { X, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MediaItem {
  Id: string;
  Name: string;
  Type: "Movie" | "Series";
  AgeRating?: string;
  ReleaseYear?: number;
  Overview?: string;
  Duration?: string;
  ImageUrl: string;
  BackdropUrl: string | null;
  LogoUrl?: string | null;
  Genres?: string[];
  People?: any[];
  ImdbRating?: number | null;
  ImdbId?: string | null;
}

interface Season {
  Id: string;
  Name: string;
  IndexNumber: number;
  ChildCount: number;
  ProductionYear?: number;
  Overview?: string;
}

interface Episode {
  Id: string;
  Name: string;
  IndexNumber: number;
  ParentIndexNumber: number;
  Overview?: string;
  Duration: string;
  RunTimeTicks: number;
  ImageUrl: string;
  SeriesId: string;
  SeasonId: string;
}

interface PopoverProps {
  mediaId: string;
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ mediaId, children }) => {
  const router = useRouter();
  const [mediaDetails, setMediaDetails] = useState<MediaItem | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Record<string, Episode[]>>({});
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const handleWatchClick = (itemId: string) => {
    router.push(`/watch/${itemId}`);
  };

  useEffect(() => {
    if (isOpen && mediaId) {
      setLoading(true);
      // Fetch media details
      fetch(`/api/media/getItemDetails?itemId=${mediaId}`)
        .then((res) => res.json())
        .then((data) => {
          setMediaDetails(data.item);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [mediaId, isOpen]);

  useEffect(() => {
    if (mediaDetails && mediaDetails.Type === "Series" && isOpen) {
      // Fetch seasons
      fetch(`/api/media/getSeasons?seriesId=${mediaId}`)
        .then((res) => res.json())
        .then((data) => setSeasons(data.seasons || []));
    }
  }, [mediaDetails, mediaId, isOpen]);

  const handleSeasonClick = (seasonId: string) => {
    if (!episodes[seasonId]) {
      // Fetch episodes for the particular season
      fetch(`/api/media/getEpisodes?seasonId=${seasonId}`)
        .then((res) => res.json())
        .then((data) =>
          setEpisodes((prevEpisodes) => ({
            ...prevEpisodes,
            [seasonId]: data.episodes || [],
          }))
        );
    }
  };

  const formatSeasonNumber = (num: number) => {
    return num === 0 ? "Specials" : `Season ${num}`;
  };

  if (loading || !mediaDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 bg-zinc-900 border-0 overflow-hidden">
          <DialogTitle className="sr-only">Loading media details</DialogTitle>
          <div className="flex items-center justify-center h-96">
            <div className="text-white">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-zinc-900 border-0 overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">{mediaDetails.Name}</DialogTitle>
        <div className="relative max-h-[90vh] overflow-y-auto">
          {/* Hero Section */}
          <div className="relative h-80 overflow-hidden">
            {mediaDetails.BackdropUrl ? (
              <Image 
                src={mediaDetails.BackdropUrl} 
                alt={mediaDetails.Name} 
                fill
                className="object-cover"
                priority
                onError={(e) => {
                  // Fallback to primary image when backdrop fails
                  const target = e.currentTarget as HTMLImageElement;
                  target.src = mediaDetails.ImageUrl;
                  target.className = "object-cover object-center w-full h-full";
                }}
              />
            ) : (
              <div className="relative w-full h-full overflow-hidden">
                <Image 
                  src={mediaDetails.ImageUrl} 
                  alt={mediaDetails.Name} 
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />
            
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 bg-zinc-800/80 hover:bg-zinc-800 rounded-full p-2 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            {/* Logo/Title */}
            <div className="absolute bottom-6 left-6 right-6">
              {mediaDetails.LogoUrl ? (
                <div className="mb-4">
                  <Image 
                    src={mediaDetails.LogoUrl}
                    alt={mediaDetails.Name}
                    width={200}
                    height={100}
                    className="object-contain max-h-20"
                  />
                </div>
              ) : (
                <h1 className="text-4xl font-bold text-white mb-4">{mediaDetails.Name}</h1>
              )}
              
              {/* Play Button */}
              <Button className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-2 rounded text-lg" onClick={() => handleWatchClick(mediaId)}>
                <div className="mr-2">
                  <Play width={20} height={20} color='black' />
                </div>
                Play
              </Button>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="p-6 space-y-6">
            {/* Movie Info */}
            <div className="flex items-center space-x-4 text-sm text-white">
              {mediaDetails.ReleaseYear && (
                <span className="text-green-400 font-semibold">{mediaDetails.ReleaseYear}</span>
              )}
              {mediaDetails.AgeRating && (
                <span className="border border-gray-500 px-1 text-xs">{mediaDetails.AgeRating}</span>
              )}
              {mediaDetails.Duration && mediaDetails.Type === "Movie" && (
                <span>{mediaDetails.Duration}</span>
              )}
              {mediaDetails.Type === "Series" && seasons.length > 0 && (
                <span>{seasons.length} Season{seasons.length > 1 ? 's' : ''}</span>
              )}
              {mediaDetails.ImdbRating && mediaDetails.ImdbRating > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-yellow-400 font-medium">
                    {mediaDetails.ImdbRating > 10 
                      ? (mediaDetails.ImdbRating / 10).toFixed(1) 
                      : mediaDetails.ImdbRating.toFixed(1)
                    }/10
                  </span>
                  <span className="text-gray-400 text-xs">IMDB</span>
                </div>
              )}
              <span className="text-gray-400">HD</span>
            </div>
            
            {/* Overview */}
            {mediaDetails.Overview && (
              <p className="text-white text-base leading-relaxed max-w-2xl">
                {mediaDetails.Overview}
              </p>
            )}
            
            {/* Cast */}
            {mediaDetails.People && mediaDetails.People.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-400">
                  <span className="text-white">Cast:</span>{' '}
                  {mediaDetails.People
                    .filter(person => person.Type === 'Actor')
                    .slice(0, 3)
                    .map(person => person.Name)
                    .join(', ')}
                </div>
                {mediaDetails.Genres && mediaDetails.Genres.length > 0 && (
                  <div className="text-sm text-gray-400">
                    <span className="text-white">Genres:</span>{' '}
                    {mediaDetails.Genres.join(', ')}
                  </div>
                )}
              </div>
            )}
            
            {/* TV Series - Episodes Section */}
            {mediaDetails.Type === "Series" && seasons.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Episodes</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {seasons
                    .sort((a, b) => (a.IndexNumber || 0) - (b.IndexNumber || 0))
                    .map((season) => (
                    <AccordionItem 
                      key={season.Id} 
                      value={season.Id} 
                      className="border-gray-700 bg-zinc-800/50 rounded-lg"
                    >
                      <AccordionTrigger 
                        onClick={() => handleSeasonClick(season.Id)}
                        className="px-4 py-3 text-white hover:no-underline hover:bg-zinc-800/70 rounded-lg transition-colors"
                      >
                        <span className="font-medium">{formatSeasonNumber(season.IndexNumber || 0)}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {episodes[season.Id]?.map((episode, index) => (
                            <div key={episode.Id} className="flex space-x-4 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => handleWatchClick(episode.Id)}>
                              <div className="flex-shrink-0">
                                <div className="relative w-24 h-14 bg-zinc-700 rounded overflow-hidden">
                                  <Image 
                                    src={episode.ImageUrl} 
                                    alt={episode.Name}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                                    <Play width={16} height={16} color='white' />
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-white font-medium text-sm truncate">
                                      {episode.IndexNumber}. {episode.Name}
                                    </h4>
                                    <p className="text-gray-400 text-xs mt-1">{episode.Duration}</p>
                                  </div>
                                </div>
                                {episode.Overview && (
                                  <p className="text-gray-300 text-xs mt-2 line-clamp-2 leading-relaxed">
                                    {episode.Overview}
                                  </p>
                                )}
                              </div>
                            </div>
                          )) || (
                            <div className="text-gray-400 text-sm py-4">Loading episodes...</div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Popover;
