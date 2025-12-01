'use client'

import { useState, useEffect } from 'react'
import HeroSection from '@/components/HeroSection'
import FilterSection from '@/components/FilterSection'
import CourtList from '@/components/CourtList'
import BottomNav from '@/components/BottomNav'
import LocationPermissionPrompt from '@/components/LocationPermissionPrompt'
import LoadingScreen from '@/components/LoadingScreen'
import { useLocation } from '@/hooks/useLocation'

export default function Home() {
  const { location, isLoading, requestLocation } = useLocation()
  const [appLoading, setAppLoading] = useState(true)

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setAppLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  console.log('Page component - location:', location)
  console.log('Page component - isLoading:', isLoading)

  return (
    <>
      <LoadingScreen isLoading={appLoading} />
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