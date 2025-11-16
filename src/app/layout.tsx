import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ZTVPlus - Streaming Platform',
  description: 'Plateforme de streaming de films et séries',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-black text-white">
          <Navbar />
          <div className="bg-yellow-600/90 text-yellow-50 px-4 py-2 text-center text-sm font-medium border-b border-yellow-700">
            ⚠️ Certains programmes peuvent ne pas être disponibles
          </div>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
