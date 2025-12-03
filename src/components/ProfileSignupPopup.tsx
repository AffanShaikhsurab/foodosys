'use client'

import { useRouter } from 'next/navigation'

interface ProfileSignupPopupProps {
    isOpen: boolean
    onClose: () => void
}

export default function ProfileSignupPopup({
    isOpen,
    onClose
}: ProfileSignupPopupProps) {
    const router = useRouter()

    if (!isOpen) return null

    const handleSignUp = () => {
        onClose()
        router.push('/sign-in?redirectTo=/settings')
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-user-star-line text-3xl text-blue-600"></i>
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-gray-900">Sign Up to Access Profile</h2>
                    <p className="text-gray-600">
                        Create an account to unlock your personal dashboard and track your impact!
                    </p>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Member Benefits</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-3">
                                <i className="ri-check-line text-green-600 text-sm"></i>
                            </div>
                            <span className="text-gray-700 text-sm">Track your contribution history</span>
                        </li>
                        <li className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-3">
                                <i className="ri-check-line text-green-600 text-sm"></i>
                            </div>
                            <span className="text-gray-700 text-sm">Earn Karma points & badges</span>
                        </li>
                        <li className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-3">
                                <i className="ri-check-line text-green-600 text-sm"></i>
                            </div>
                            <span className="text-gray-700 text-sm">Compete on the leaderboard</span>
                        </li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleSignUp}
                        className="w-full bg-[#2C3E2E] text-white py-3 rounded-lg font-medium hover:bg-[#1a261c] transition-colors flex items-center justify-center"
                    >
                        <i className="ri-login-circle-line mr-2"></i>
                        Sign Up Now
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    )
}
