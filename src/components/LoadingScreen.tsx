'use client'

import Lottie from 'lottie-react'
import { useEffect, useState } from 'react'
import foodAnimation from '@/../../public/Food animation.json'

interface LoadingScreenProps {
  isLoading: boolean
  minDisplayTime?: number
}

export default function LoadingScreen({ isLoading, minDisplayTime = 2000 }: LoadingScreenProps) {
  const [shouldShow, setShouldShow] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      // Ensure loading screen shows for at least minDisplayTime
      const timer = setTimeout(() => {
        setShouldShow(false)
      }, minDisplayTime)

      return () => clearTimeout(timer)
    }
  }, [isLoading, minDisplayTime])

  if (!shouldShow && !isLoading) {
    return null
  }

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <Lottie
          animationData={foodAnimation}
          loop={true}
          style={{ width: 300, height: 300 }}
        />
        <p className="loading-text">Loading delicious menus...</p>
      </div>
    </div>
  )
}
