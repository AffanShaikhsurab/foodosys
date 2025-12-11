'use client'

import { useState, useEffect } from 'react'
import HeroSection from '@/components/HeroSection'
import FilterSection from '@/components/FilterSection'
import CourtList from '@/components/CourtList'
import BottomNav from '@/components/BottomNav'
import LocationPermissionPrompt from '@/components/LocationPermissionPrompt'
import { useLocation } from '@/hooks/useLocation'

export default function Home() {
  const { location, isLoading, requestLocation } = useLocation()
  const [stats, setStats] = useState<{ restaurantCount: number, menuCount: number } | undefined>(undefined)

  return (
    <>
      <LocationPermissionPrompt />
      <HeroSection
        location={location}
        isLoading={isLoading}
        requestLocation={requestLocation}
        stats={stats}
      />
      <FilterSection />
      <CourtList
        userLocation={location}
        locationLoading={isLoading}
        onStatsUpdate={setStats}
      />
      <BottomNav />
    </>
  )
}