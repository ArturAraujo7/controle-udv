import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './providers'
import AuthProvider from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Guardião',
  description: 'Controle UDV • Jardim Real',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Guardião',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} transition-colors duration-300 bg-gray-100 dark:bg-black text-foreground antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="max-w-5xl mx-auto min-h-screen sm:min-h-[calc(100vh-2rem)] sm:my-4 sm:rounded-3xl bg-gray-50 dark:bg-gray-900 shadow-2xl sm:border border-x-0 sm:border-x border-gray-200 dark:border-gray-800 relative overflow-hidden">
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}