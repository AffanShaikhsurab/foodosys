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
      
      {/* Install prompt element for tour */}
      <div className="step-install-prompt" style={{ 
        position: 'fixed', 
        bottom: '100px', 
        right: '20px', 
        width: '40px', 
        height: '40px', 
        borderRadius: '50%', 
        backgroundColor: '#DCEB66', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 1000,
        opacity: 0.8
      }}>
        <i className="ri-download-line" style={{ color: '#1F291F', fontSize: '20px' }}></i>
      </div>
    </>
  )
}