import HeroSection from '@/components/HeroSection'
import FilterSection from '@/components/FilterSection'
import CourtList from '@/components/CourtList'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FilterSection />
      <div className="section-title">Nearby Courts</div>
      <CourtList />
      <BottomNav />
    </>
  )
}