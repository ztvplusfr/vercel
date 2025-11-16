import './globals.css'
import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { Navbar } from '@/components/Navbar'

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
  children: ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className="min-h-screen bg-black text-white font-sans antialiased">
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
