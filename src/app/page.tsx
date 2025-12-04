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

  return (
    <>
      <LocationPermissionPrompt />
      <HeroSection
        location={location}
        isLoading={isLoading}
        requestLocation={requestLocation}
      />
      <FilterSection />
      <CourtList userLocation={location} locationLoading={isLoading} />
      <BottomNav />
    </>
  )
}