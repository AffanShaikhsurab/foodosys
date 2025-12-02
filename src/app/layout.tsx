import './globals.css'
import '../styles/location.css'
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Mysore Mess Menus',
  description: 'View daily menus for campus food courts',
}

// Loading component for Clerk initialization
function ClerkLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
      <body className={inter.className}>
        <ClerkProvider
          publishableKey={publishableKey}
          afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
          afterSignUpUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
          signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
          signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              card: 'shadow-lg',
            },
          }}
        >
          <ClerkLoading>
            <ClerkLoadingComponent />
          </ClerkLoading>
          <ClerkLoaded>
            <div className="app-container">
              {children}
            </div>
          </ClerkLoaded>
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  )
}