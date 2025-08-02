"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Info, Play } from './icons'
import { Button } from './ui/button'


type MediaItem = {
  Id: string
  Name: string
  Type: 'Movie' | 'Series'
  Overview: string
  Rating: number
  Duration: string
  ImageUrl: string
  BgImgUrl: string
  LogoImgUrl: string
}

const MostPopular = () => {
  const [popular, setPopular] = useState<MediaItem | null>(null)

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch('/api/media/getMostPopular', {
          credentials: 'include',
        })
        const data = await res.json()

        setPopular({
          Id: data.id,
          Name: data.name,
          Type: data.type,
          Overview: data.overview,
          Rating: data.rating,
          Duration: data.runtimeTicks,
          ImageUrl: data.image,
          BgImgUrl: data.imageBg,
          LogoImgUrl: data.imageLogo,
        })
      } catch (error) {
        console.error('Failed to load media:', error)
      }
    }

    fetchMedia()
  }, [])

  if (!popular) return <p>Loading...</p>

  return (
    <div className="relative w-full h-[90vh] text-white">
      
      <div className="absolute inset-0 z-0 -bottom-3  bg-gradient-to-b from-transparent to-[#0a0a0a]" />
      <Image
        src={popular.BgImgUrl}
        alt={popular.Name}
        fill
        className="object-cover object-center brightness-[.6] z-[-1]"
        priority
        unoptimized
      />
      <div className="relative z-10 h-full flex flex-col justify-center px-15 md:px-16 max-w-[700px]">
        {/* Logo or Title */}
        {popular.LogoImgUrl ? (
          <Image
            src={popular.LogoImgUrl}
            alt={popular.Name}
            width={400}
            height={200}
            className="mb-4 w-30  md:w-56 sm:w-50 lg:w-60 h-auto"
            unoptimized
            draggable="false"
          />
        ) : (
          <h1 className="text-4xl font-bold mb-4">{popular.Name}</h1>
        )}

        {/* Description */}
        <p className="text-sm w-50 sm:w-100 md:w-90 lg:w-full md:text-base text-gray-200 line-clamp-2 sm:line-clamp-4 md:line-clamp-4 lg:line-clamp-4 mb-6">
          {popular.Overview}
        </p>

        {/* Buttons */}
        <div className="md:hidden">
          <Button className="bg-white text-black rounded-md text-sm md:text-base font-semibold w-full hover:bg-gray-200 transition mb-2">
            <Play /> Play
          </Button>
          <Button className="bg-gray-600/70 text-white w-full rounded-md text-sm md:text-base font-semibold hover:bg-gray-500 transition">
           <Info />  More Info
          </Button>
        </div>
        <div className="md:flex gap-4 hidden ">
          <Button className="bg-white w-30 text-black rounded-md text-sm md:text-base font-semibold hover:bg-gray-200 transition">
            <Play /> Play
          </Button>
          <Button className="bg-gray-600/70 text-white w-30 rounded-md text-sm md:text-base font-semibold hover:bg-gray-500 transition">
           <Info />  More Info
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MostPopular
