import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SaaS Platform',
  description: 'A modern SaaS platform with authentication and theme support',
}

/**
 * Root layout component that wraps all pages with necessary providers
 * and global styles
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster 
              position="bottom-right"
              toastOptions={{
                className: 'bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground',
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
