'use client'

import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from 'react'
import Joyride, {
  CallBackProps,
  EVENTS,
  STATUS,
  Step,
} from 'react-joyride'

type TourContextType = {
  startTour: () => void;
  isFirstVisit: boolean;
  completeTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null)

// STEP DEFINITIONS
const steps: Step[] = [
  {
    target: '.step-hero-title',
    content: 'Welcome to Foodosys! This is your main dashboard where you can see what meals are available right now.',
    disableBeacon: true,
  },
  {
    target: '.step-location',
    content: 'Your location helps us show you the most relevant menus. Click here to update it anytime.',
  },
  {
    target: '.step-status-widget',
    content: 'This widget shows how many menus are currently available. No more walking to find closed food courts!',
  },
  {
    target: '.step-filter-section',
    content: 'Use these filters to find exactly what you\'re looking for - by meal type, dietary preferences, and more.',
  },
  {
    target: '.step-scan-button',
    content: 'This is the magic button! When you\'re near a restaurant, use it to scan QR codes and upload menus instantly.',
  },
  {
    target: '.step-install-prompt',
    content: 'Want the full app experience? In Chrome, click the menu (⋮) and select "Add to Home Screen" to install this as an app on your phone! This way you can access it directly from your home screen just like a native app.',
    disableBeacon: true,
  },
]

export function TourProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [locationPermissionResolved, setLocationPermissionResolved] = useState(false)

  // Check if it's the user's first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('foodosys-tour-completed')
    if (!hasVisitedBefore) {
      setIsFirstVisit(true)
    }
  }, [])

  // Listen for location permission resolution
  useEffect(() => {
    const handleLocationPermissionResolved = () => {
      setLocationPermissionResolved(true)
    }

    // Custom event that will be dispatched from LocationPermissionPrompt
    window.addEventListener('locationPermissionResolved', handleLocationPermissionResolved)
    
    return () => {
      window.removeEventListener('locationPermissionResolved', handleLocationPermissionResolved)
    }
  }, [])

  // Start tour only after location permission is resolved
  useEffect(() => {
    if (isFirstVisit && locationPermissionResolved) {
      // Auto-start tour after a short delay to let the page load
      setTimeout(() => {
        setRun(true)
      }, 1000)
    }
  }, [isFirstVisit, locationPermissionResolved])

  const handleCallback = (data: CallBackProps) => {
    const { status, type, index } = data

    const finished =
      status === STATUS.FINISHED || status === STATUS.SKIPPED

    if (finished) {
      setRun(false)
      setStepIndex(0)
      completeTour()
      return
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + 1)
    }
  }

  const startTour = () => {
    setStepIndex(0)
    setRun(true)
  }

  const completeTour = () => {
    localStorage.setItem('foodosys-tour-completed', 'true')
    setIsFirstVisit(false)
  }

  return (
    <TourContext.Provider value={{ startTour, isFirstVisit, completeTour }}>
      {children}

      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showSkipButton
        scrollToFirstStep
        spotlightClicks
        styles={{
          options: {
            zIndex: 9999,
            arrowColor: '#DCEB66',
            backgroundColor: '#1F291F',
            primaryColor: '#DCEB66',
            textColor: '#FFFFFF',
            overlayColor: 'rgba(0, 0, 0, 0.7)',
          },
          buttonNext: {
            backgroundColor: '#DCEB66',
            color: '#1F291F',
          },
          buttonBack: {
            color: '#DCEB66',
          },
          buttonSkip: {
            color: '#889287',
          },
        }}
        callback={handleCallback}
      />
    </TourContext.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within TourProvider')
  return ctx
}