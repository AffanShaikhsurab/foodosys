'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AnonymousUploadPopupProps {
  isOpen: boolean
  onClose: () => void
  onContinueAsAnonymous: () => void
}

export default function AnonymousUploadPopup({ 
  isOpen, 
  onClose, 
  onContinueAsAnonymous 
}: AnonymousUploadPopupProps) {
  const [countdown, setCountdown] = useState(3)
  const [canContinue, setCanContinue] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3)
      setCanContinue(false)
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanContinue(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  const handleSignUp = () => {
    onClose()
    router.push('/auth?redirectTo=/upload')
  }

  const handleContinueAsAnonymous = () => {
    if (canContinue) {
      onContinueAsAnonymous()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-user-unfollow-line text-2xl text-gray-600"></i>
          </div>
          <h2 className="text-xl font-bold mb-2">Anonymous Upload</h2>
          <p className="text-gray-600 mb-4">
            You're about to upload as an anonymous user. Your photo will help others find great food options!
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Sign up to get these benefits:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <i className="ri-user-line mr-2 mt-0.5"></i>
              <span>Your name displayed on your contributions</span>
            </li>
            <li className="flex items-start">
              <i className="ri-trophy-line mr-2 mt-0.5"></i>
              <span>Earn karma points for helping others</span>
            </li>
            <li className="flex items-start">
              <i className="ri-medal-line mr-2 mt-0.5"></i>
              <span>Appear on the community leaderboard</span>
            </li>
            <li className="flex items-start">
              <i className="ri-history-line mr-2 mt-0.5"></i>
              <span>Track your upload history</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSignUp}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign Up Now
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={handleContinueAsAnonymous}
            disabled={!canContinue}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              canContinue 
                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canContinue ? 'Continue as Anonymous' : `Wait ${countdown} second${countdown !== 1 ? 's' : ''}`}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}