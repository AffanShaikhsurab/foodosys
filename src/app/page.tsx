'use client'


import HeroSection from '@/components/HeroSection'
import FilterSection from '@/components/FilterSection'
import CourtList from '@/components/CourtList'
import BottomNav from '@/components/BottomNav'
import LocationPermissionPrompt from '@/components/LocationPermissionPrompt'
import { useLocation } from '@/hooks/useLocation'

export default function Home() {
  const { location, isLoading, requestLocation } = useLocation()

  console.log('Page component - location:', location)
  console.log('Page component - isLoading:', isLoading)

  return (
    <>
      <LocationPermissionPrompt />
      <HeroSection
        location={location}
        isLoading={isLoading}
        requestLocation={requestLocation}
      />
      <FilterSection />
      <div className="section-title">Nearby Courts</div>
      <CourtList userLocation={location} locationLoading={isLoading} />
      <BottomNav />
    </>
  )
}