import './globals.css'
import '../styles/location.css'
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Mysore Mess Menus',
  description: 'View daily menus for campus food courts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-container">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  )
}