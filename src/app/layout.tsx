import './globals.css'
import './home-styles.css'
import '../styles/location.css'
import '../styles/auth.css'
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/nextjs'
import { TourProvider } from './TourProvider'
import { TransitionProvider } from '@/context/TransitionContext'
import { getAllImageUrls } from '@/lib/image-preloader'
import FeedbackButton from '@/components/FeedbackButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Mysore Mess Menus',
  description: 'View daily menus for campus food courts',
}

// Loading component for Clerk initialization
function ClerkLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#FDFDE8' }}>
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent" style={{ borderColor: '#DCEB66', borderTopColor: 'transparent' }}></div>
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Validate required environment variables
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable');
  }

  return (
    <html lang="en">
      <head>
        {/* DM Sans Font */}
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
        {/* Remix Icon for auth pages */}
        <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
        {getAllImageUrls().map((url) => (
          <link key={url} rel="prefetch" as="image" href={url} />
        ))}
      </head>
      <body className={inter.className}>
        <ClerkProvider
          publishableKey={publishableKey}
          afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
          afterSignUpUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
          signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
          signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
          appearance={{
            variables: {
              colorPrimary: '#DCEB66',
              colorText: '#1F291F',
              colorTextSecondary: '#889287',
              colorBackground: '#FFFFFF',
              colorInputBackground: '#F9FAFB',
              colorInputText: '#2C3E2E',
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: '32px',
            },
            elements: {
              formButtonPrimary: 'bg-[#DCEB66] hover:bg-[#DCEB66] text-[#2C3E2E] font-bold normal-case shadow-lg',
              card: 'shadow-xl rounded-3xl',
              socialButtonsBlockButton: 'border border-gray-200 bg-white hover:bg-gray-50 rounded-full',
              formFieldInput: 'rounded-full border-gray-200 bg-gray-50',
              formFieldLabel: 'text-[#2C3E2E] font-bold',
              footerActionLink: 'text-[#2C3E2E] font-bold',
            },
          }}
        >
          <ClerkLoading>
            <ClerkLoadingComponent />
          </ClerkLoading>
          <ClerkLoaded>
            <TransitionProvider>
              <TourProvider>
                <div className="app-container">
                  {children}
                </div>
              </TourProvider>
              <FeedbackButton />
            </TransitionProvider>
          </ClerkLoaded>
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  )
}
