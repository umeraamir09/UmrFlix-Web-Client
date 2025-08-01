'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Menu } from 'lucide-react'
import Image from 'next/image'
import NavBtn from '@/components/NavBtn'
import { useRouter } from 'next/navigation'
import { handleLogout } from "@/lib/handleLogout"
import { useEffect, useState } from 'react'
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import ArrowDown from './icons/ArrowDown'
import RefreshButton from "./RefreshButton"
import { handleRefresh } from '@/lib/handleRefresh';
import { Separator } from "./ui/separator"


interface Props {
  page: string;
  token?: string;
  userId?: string;
}

const Header = ({ page, token, userId }: Props) => {

  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const avatarUrl = token ? `${process.env.NEXT_PUBLIC_JELLYFIN_SRVR_URL}/Users/${userId}/Images/Primary?quality=90` : ""
  
   useEffect(() => {
     const onScroll = () => {
       setScrolled(window.scrollY > 50)
     }

  
     window.addEventListener("scroll", onScroll)
     return () => window.removeEventListener("scroll", onScroll)
   }, [])

  return (
    <div className={cn(
      "fixed w-full z-50 transition-colors duration-500 ease-in-out min-h-10",
      scrolled ? "bg-[#0a0a0a]/80 backdrop-blur-md" : "bg-transparent",


    )}>
      <div className="flex items-center justify-between px-4 py-3 h-16 text-sm md:text-base">
        
        {/* Left: Logo + Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu (ShadCN Dropdown) */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1" aria-label="Open menu">
                  <Menu size={24} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-black text-white mt-2 z-[60]">
                <DropdownMenuItem onClick={() => router.push('/')}>
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/movies')}>
                  Movies
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/series')}>
                  Series
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('#continue')}>
                  Continue Watching
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Logo */}
          <div className="cursor-pointer mx-2 md:mx-5" onClick={() => router.push('/')}>
            <Image 
              src={'/branding/logo_header.png'}
              alt='UmrFlix Logo'
              width={130}
              height={0}
              unoptimized
              draggable="false"
            />
          </div>
        </div>

        <div className="hidden md:flex gap-3 flex-1 mx-20 ">
          <NavBtn label='Home' href='/' page={page} />
          <NavBtn label='Movies' href='/movies' page={page} />
          <NavBtn label='Series' href='/series' page={page} />
          <NavBtn label='Continue Watching' href='#continue' page={page} />
        </div>


        <div className="flex items-center justify-center w-[10%] ">
        <DropdownMenu>
          <DropdownMenuTrigger className="focus-visible:hidden">
            <div className="inline-flex items-center">
                <Avatar className="size-10 border-white transition-transform duration-200 cursor-pointer">
                    <AvatarImage src={avatarUrl} alt="User Avatar" />
                    <AvatarFallback>UM</AvatarFallback>
                </Avatar>
                {/* <ChevronDown></ChevronDown> */}
                <ArrowDown />
                </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-[60] bg-black text-white border-gray-800">
            <DropdownMenuItem onClick={handleRefresh}>Refresh Media</DropdownMenuItem>
            <DropdownMenuItem className="bg-ux-secondary" onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        </div>
      </div>
    </div>
  )
}

export default Header
