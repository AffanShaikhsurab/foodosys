'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-[#FDFDE8] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-[#2C3E2E] rounded-full flex items-center justify-center mb-6 shadow-lg">
                <i className="ri-compass-3-line text-[#DCEB66] text-4xl"></i>
            </div>

            <h1 className="text-3xl font-bold text-[#2C3E2E] mb-2">Page Not Found</h1>

            <p className="text-[#889287] mb-8 max-w-xs mx-auto">
                Oops! The page you're looking for seems to have wandered off the menu.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                    onClick={() => router.back()}
                    className="w-full py-3 px-6 rounded-[20px] border-2 border-[#2C3E2E] text-[#2C3E2E] font-semibold hover:bg-[#2C3E2E] hover:text-white transition-colors"
                >
                    Go Back
                </button>

                <Link
                    href="/"
                    className="w-full py-3 px-6 rounded-[20px] bg-[#DCEB66] text-[#2C3E2E] font-semibold hover:bg-[#d4e455] transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                    <i className="ri-home-4-fill"></i>
                    Back to Home
                </Link>
            </div>
        </div>
    )
}
