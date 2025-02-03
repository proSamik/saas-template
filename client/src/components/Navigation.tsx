'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/auth'

const Navigation = () => {
  const pathname = usePathname()
  const { auth, logout: contextLogout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authService.logout()
      contextLogout()
    } catch (error) {
      console.error('[Navigation] Logout failed:', error)
      // Still clear local state even if API call fails
      contextLogout()
    }
  }

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Payments', href: '/payments' },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-light-background dark:bg-dark-background border-b border-light-accent dark:border-dark-accent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-light-foreground dark:text-dark-foreground">
                SaaS Platform
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8 relative z-10">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium cursor-pointer ${isActive(item.href)
                    ? 'border-b-2 border-primary-500 text-light-foreground dark:text-dark-foreground'
                    : 'text-light-muted dark:text-dark-muted hover:text-light-foreground dark:hover:text-dark-foreground'
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-light-muted dark:text-dark-muted hover:bg-light-accent dark:hover:bg-dark-accent"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {auth ? (
              <div className="relative ml-3 z-50">
                <button
                  type="button"
                  className="flex rounded-full text-sm focus:outline-none"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    {auth.name?.[0]?.toUpperCase() || auth.email[0].toUpperCase()}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-light-background dark:bg-dark-background py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent cursor-pointer"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLogout()
                        setIsProfileOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent cursor-pointer"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-light-foreground dark:text-dark-foreground hover:text-primary-500"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-primary-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-400"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block py-2 pl-3 pr-4 text-base font-medium ${isActive(item.href)
                    ? 'bg-primary-50 dark:bg-primary-900 text-primary-500'
                    : 'text-light-muted dark:text-dark-muted hover:bg-light-accent dark:hover:bg-dark-accent'
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {!auth && (
              <div className="border-t border-light-accent dark:border-dark-accent pb-3 pt-4">
                <div className="space-y-1">
                  <Link
                    href="/auth/login"
                    className="block px-4 py-2 text-base font-medium text-light-muted dark:text-dark-muted hover:bg-light-accent dark:hover:bg-dark-accent"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-4 py-2 text-base font-medium text-light-muted dark:text-dark-muted hover:bg-light-accent dark:hover:bg-dark-accent"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}
            {auth && (
              <div className="border-t border-light-accent dark:border-dark-accent pb-3 pt-4">
                <div className="flex items-center px-4">
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    {auth.name?.[0]?.toUpperCase() || auth.email[0].toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-light-foreground dark:text-dark-foreground">
                      {auth.name || 'User'}
                    </div>
                    <div className="text-sm font-medium text-light-muted dark:text-dark-muted">
                      {auth.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-base font-medium text-light-muted dark:text-dark-muted hover:bg-light-accent dark:hover:bg-dark-accent"
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-light-muted dark:text-dark-muted hover:bg-light-accent dark:hover:bg-dark-accent"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation