'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './ThemeProvider'
import { Toaster } from 'react-hot-toast'
import React from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            className: 'bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground',
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  )
}