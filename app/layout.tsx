import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Image Converter - Fast, Private, Browser-Based',
  description: 'Convert images to JPG, PNG, and WEBP instantly in your browser. 100% private, no server uploads.',
  keywords: 'image converter, jpg, png, webp, browser, free, private',
  authors: [{ name: 'Image Converter' }],
  openGraph: {
    title: 'Image Converter - Fast, Private, Browser-Based',
    description: 'Convert images to JPG, PNG, and WEBP instantly in your browser. 100% private, no server uploads.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  )
}
