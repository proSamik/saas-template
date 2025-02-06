'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground">
        {children}
      </div>
    </NextThemesProvider>
  )
}