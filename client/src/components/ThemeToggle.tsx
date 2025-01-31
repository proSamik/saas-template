'use client'

import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useTheme } from './ThemeProvider'

/**
 * ThemeToggle component that provides a button to switch between light and dark themes
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="rounded-md p-2 hover:bg-light-accent dark:hover:bg-dark-accent"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <MoonIcon className="h-5 w-5 text-light-muted" />
      ) : (
        <SunIcon className="h-5 w-5 text-dark-muted" />
      )}
    </button>
  )
} 