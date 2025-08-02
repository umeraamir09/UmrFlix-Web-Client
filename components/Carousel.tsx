'use client';
import React, { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { Button } from './ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Play from './icons/Play';
import Popover from './Popover';

export interface Movie {
  Id: string
  Name: string
  Type: "Movie" | "Series" | "Episode"
  ImageUrl: string
  ContinueFrom?: number
  DurationTicks?: number
  Duration?: string
  SeriesName?: string
  SeasonName?: string
  IndexNumber?: number
  ParentIndexNumber?: number
}

interface MovieCarouselProps {
  movies: Movie[];
  scrollAmount?: number;
  label: string;
  ItemWidth?: number;
  ItemHeight?: number;
  wide?: boolean;
  showProgress?: boolean;
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({ movies, label, ItemWidth, ItemHeight, wide, showProgress }) => {
  // Embla carousel setup with dragFree to allow smooth touch dragging
  const [emblaRef, emblaApi] = useEmblaCarousel({ dragFree: true, containScroll: 'trimSnaps' });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Update button states
  const updateButtons = () => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  };

  useEffect(() => {
    if (!emblaApi) return;
    updateButtons();
    emblaApi.on('select', updateButtons);
    emblaApi.on('reInit', updateButtons);
  }, [emblaApi]);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();


  if (wide)

    return (
      <div className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      {/* Prev Button */}
      {canScrollPrev && (
        <Button
          key="prev-btn-wide"
          variant={"default"}
          aria-label="Scroll left"
          className="absolute left-6 sm:left-8 md:left-10 lg:left-14 xl:left-18 top-1/2 transform -translate-y-1/2 carousel-btn text-sm z-10"
          onClick={scrollPrev}
        >
         <ArrowLeft />
        </Button>
      )}

      {/* Next Button */}
      {canScrollNext && (
        <Button
          key="next-btn-wide"
          variant={"default"}
          aria-label="Scroll right"
          className="absolute right-6 sm:right-8 md:right-10 lg:right-14 xl:right-18 top-1/2 transform -translate-y-1/2 carousel-btn z-10"
          onClick={scrollNext}
        >
          <ArrowRight/>
        </Button>
      )}

      {/* Embla Carousel */}
      <h1 className='text-3xl mb-5 inline-flex items-center gap-2'>{label}</h1>
      <div 
        ref={emblaRef} 
        className="overflow-hidden w-full cursor-grab active:cursor-grabbing touch-pan-x"
        style={{ touchAction: 'pan-x' }}
      >
        <div className="flex gap-3">
            {movies.map((movie, index) => (
            <div
                key={movie.Id || `movie-wide-${index}`}
                className="flex-shrink-0 snap-start w-[75%] xs:w-[40%] sm:w-[45%] md:w-[35%] lg:w-[28%] xl:w-[24%] 2xl:w-[20%] select-none"
            >
                <div className="w-full">
                  <div className="relative w-full aspect-[16/9] overflow-hidden pointer-events-auto rounded group cursor-pointer">
                    <Image
                      src={movie.ImageUrl}
                      alt={movie.Name}
                      width={ItemWidth || 400}
                      height={ItemHeight || 225}
                      className="object-cover object-center w-full transition-transform duration-300 group-hover:scale-105"
                      draggable={false}
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    />
                    {/* Duration display on hover */}
                    {movie.Duration && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {movie.Duration}
                      </div>
                    )}
                    {/* Hover overlay with play button */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {label !== 'Next Up' && label !== 'Continue Watching' ? (
                        <Popover mediaId={movie.Id}>
                          <div className="bg-black/70 border-white rounded-full p-3 shadow-lg">
                            <Play width={32} height={32} color='white'/>
                          </div>
                        </Popover>
                      ) : (
                        <a href={`/watch/${movie.Id}`} className="bg-black/70 border-white rounded-full p-3 shadow-lg block">
                          <Play width={32} height={32} color='white'/>
                        </a>
                      )}
                    </div>
                  </div>
                  {showProgress && movie.ContinueFrom && movie.DurationTicks && (
                    <div className='flex justify-center'>
                    <div className="w-[75%] h-[2px] bg-gray-600 mt-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ux-primary transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min((movie.ContinueFrom / movie.DurationTicks) * 100, 100)}%` }}
                      />
                    </div>
                    </div>
                  )}
                  {/* Season and Episode information or Movie name */}
                  <div className="mt-2 text-white text-sm">
                    {movie.Type === 'Episode' ? (
                      <div className="text-center">
                        <div className="text-gray-300 text-xs">Season {movie.ParentIndexNumber} Ep: {movie.IndexNumber}</div>
                      </div>
                    ) : movie.Type === 'Movie' ? (
                      <div className="text-center">
                        <div className="text-gray-300 text-xs">{movie.Name}</div>
                      </div>
                    ) : null}
                  </div>
                  {/* Progress bar for continue watching - positioned below image */}

                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
    )

  return (
    <div className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      {/* Prev Button */}
      {canScrollPrev && (
        <Button
          key="prev-btn"
          variant={"default"}
          aria-label="Scroll left"
          className="absolute left-6 sm:left-8 md:left-10 lg:left-14 xl:left-18 top-1/2 transform -translate-y-1/2 carousel-btn text-sm z-10"
          onClick={scrollPrev}
        >
         <ArrowLeft />
        </Button>
      )}

      {/* Next Button */}
      {canScrollNext && (
        <Button
          key="next-btn"
          variant={"default"}
          aria-label="Scroll right"
          className="absolute right-6 sm:right-8 md:right-10 lg:right-14 xl:right-18 top-1/2 transform -translate-y-1/2 carousel-btn z-10"
          onClick={scrollNext}
        >
          <ArrowRight/>
        </Button>
      )}

      {/* Embla Carousel */}
      <h1 className='text-3xl mb-5 inline-flex items-center gap-2'>{label}</h1>
      <div 
        ref={emblaRef} 
        className="overflow-hidden w-full cursor-grab active:cursor-grabbing touch-pan-x"
        style={{ touchAction: 'pan-x' }}
      >
        <div className="flex gap-3">
            {movies.map((movie, index) => (
            <div
                key={movie.Id || `movie-${index}`}
                className="flex-shrink-0 snap-start w-[38%] xs:w-[32%] sm:w-[23%] md:w-[18%] lg:w-[15%] select-none"
            >
                <div className="relative w-full aspect-[2/3] overflow-hidden pointer-events-auto rounded-lg group cursor-pointer">
                  <Image
                    src={movie.ImageUrl}
                    alt={movie.Name}
                    width={ItemWidth || 200}
                    height={ItemHeight || 300}
                    className="object-cover w-full h-full rounded-lg transition-transform duration-300 group-hover:scale-105"
                    draggable={false}
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  />
                  {/* Duration display on hover */}
                  {movie.Duration && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {movie.Duration}
                    </div>
                  )}
                  {/* Hover overlay with play button */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {label !== 'Next Up' && label !== 'Continue Watching' ? (
                        <Popover mediaId={movie.Id}>
                          <div className="bg-black/70 border-white rounded-full p-3 shadow-lg">
                            <Play width={32} height={32} color='white'/>
                          </div>
                        </Popover>
                      ) : (
                        <a href={`/watch/${movie.Id}`} className="bg-black/70 border-white rounded-full p-3 shadow-lg block">
                          <Play width={32} height={32} color='white'/>
                        </a>
                      )}
                    </div>
                  {/* Progress bar for continue watching */}
                  {showProgress && movie.ContinueFrom && movie.DurationTicks && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${Math.min((movie.ContinueFrom / movie.DurationTicks) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MovieCarousel;
