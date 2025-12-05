'use client'

import { useLocationContext } from '@/context/LocationContext'

export function useLocation() {
  return useLocationContext()
}
