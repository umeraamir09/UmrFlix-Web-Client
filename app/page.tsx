import ContinueSection from '@/components/ContinueSection'
import Header from '@/components/Header'
import MostPopular from '@/components/MostPopular'
import MovieSection from '@/components/MovieSection'
import NextUpSection from '@/components/NextUpSection'
import TvSection from '@/components/TvSection'
import { requireAuth } from '@/lib/apiAuth'

export default async function Display() {

  const auth = await requireAuth()
  const token = auth.jellyfinToken
  const userId = auth.userId

  return (
    <div className="min-h-screen">
      <Header page='Home' token={token} userId={userId} />
      <div className="relative">
        <MostPopular />
        <ContinueSection style='absolute top-[90%] inset-x-0 z-10' />
      </div>
      <div className="mt-40 sm:mt-60 md:mt-50">
        <NextUpSection />
        <MovieSection style="mt-10" />
        <TvSection style='mt-10' />
      </div>
    </div>
  )
}
