'use client'

import { useState, useEffect } from 'react'
import { signIn, signUp } from '@/lib/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { logAuth, logger } from '@/lib/logger'

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const startTime = Date.now()
    
    logAuth('Form submission started', {
      operation: 'form_submit_start',
      isSignUp,
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially mask email
      hasDisplayName: !!displayName,
      redirectTo
    })
    
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        logAuth('Starting sign up process', {
          operation: 'sign_up_process_start',
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          hasDisplayName: !!displayName
        })
        
        await signUp(email, password, { display_name: displayName })
        
        const processingTime = Date.now() - startTime
        logAuth('Sign up process completed successfully', {
          operation: 'sign_up_process_success',
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          processingTime
        })
        
        setError('Check your email to verify your account')
      } else {
        logAuth('Starting sign in process', {
          operation: 'sign_in_process_start',
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          redirectTo
        })
        
        await signIn(email, password)
        
        const processingTime = Date.now() - startTime
        logAuth('Sign in process completed successfully', {
          operation: 'sign_in_process_success',
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          redirectTo,
          processingTime
        })
        
        router.push(redirectTo)
      }
    } catch (err: any) {
      const processingTime = Date.now() - startTime
      const errorMessage = err.message || 'An error occurred'
      
      logAuth('Form submission failed', {
        operation: 'form_submit_error',
        isSignUp,
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        processingTime,
        errorMessage,
        errorType: err.constructor?.name || 'Unknown'
      })
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFDE8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[28px] p-8 shadow-[0_8px_24px_rgba(44,62,46,0.08)]">
          <h1 className="text-2xl font-bold text-[#2C3E2E] mb-6 text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-[#1F291F] mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-[20px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#DCEB66]"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#1F291F] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-[20px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#DCEB66]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1F291F] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-[20px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#DCEB66]"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2C3E2E] text-white py-3 rounded-[20px] font-medium hover:bg-[#1F291F] transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#889287] text-sm hover:text-[#2C3E2E] transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}