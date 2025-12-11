'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { logAuth, logger } from '@/lib/logger'
import { SignIn, SignUp } from '@clerk/nextjs'

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/settings'

  // Log component mount
  useEffect(() => {
    logAuth('Auth page component mounted', {
      operation: 'component_mount',
      redirectTo,
      isSignUp
    })
    logger.componentMount('AuthPage')

    return () => {
      logAuth('Auth page component unmounted', { operation: 'component_unmount' })
      logger.componentUnmount('AuthPage')
    }
  }, [redirectTo, isSignUp])

  return (
    <div className="min-h-screen bg-[#FDFDE8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[28px] p-8 shadow-[0_8px_24px_rgba(44,62,46,0.08)]">
          <h1 className="text-2xl font-bold text-[#2C3E2E] mb-6 text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>

          {isSignUp ? (
            <SignUp 
              redirectUrl={redirectTo}
              afterSignUpUrl="/settings"
            />
          ) : (
            <SignIn 
              redirectUrl={redirectTo}
              afterSignInUrl="/settings"
            />
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#889287] text-sm hover:text-[#2C3E2E] transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Terms and Conditions Notice */}
          {isSignUp && (
            <div className="mt-6 p-4 bg-[#FEF3C7] rounded-[16px] border border-[#DCEB66]">
              <p className="text-sm text-[#1F291F] leading-relaxed">
                By signing up, you accept{' '}
                <Link
                  href="/terms"
                  className="text-[#2C3E2E] font-semibold underline hover:text-[#1F291F] transition-colors"
                  target="_blank"
                >
                  Terms and Conditions
                </Link>
                {' '}and acknowledge that this platform is independent and not affiliated with Infosys Limited.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}