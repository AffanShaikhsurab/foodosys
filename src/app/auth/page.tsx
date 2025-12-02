'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Clerk sign-in page
    router.push('/sign-in')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to sign in...</p>
      </div>
    </div>
  )
}