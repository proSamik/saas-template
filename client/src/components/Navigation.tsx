'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { useState, useRef, useEffect } from 'react'
import { UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import useAuthStore from '@/lib/store'
import { useAuth } from '@/lib/useAuth'

/**
 * Navigation component that displays the top navigation bar
 * with authentication state and theme toggle
 */
export function Navigation() {
  const { user } = useAuthStore()
  const { isAuthenticated } = useAuth()
  const { clearAuth } = useAuthStore()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    clearAuth()
    router.push('/')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="fixed top-0 left-0 right-0 bg-light-background dark:bg-dark-background z-50 flex justify-center w-full mx-auto">
      <nav className="flex w-full max-w-7xl px-4 sm:px-6 lg:px-8 border-b border-light-accent dark:border-dark-accent">
        <div className="flex justify-between items-center w-full h-16">
          {/* Logo and Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="flex items-center font-semibold text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
            >
              SaaS Platform
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex space-x-6">
              <button
                onClick={() => {
                  if (window.location.pathname === '/') {
                    document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    router.push('/#pricing')
                  }
                }}
                className="text-sm font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  if (window.location.pathname === '/') {
                    document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    router.push('/#demo')
                  }
                }}
                className="text-sm font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
              >
                Demo
              </button>
              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Theme Toggle, Auth, and Mobile Menu Button */}
          <div className="flex items-center gap-6">
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden rounded-md p-2 text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center space-x-2 text-sm font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  <span className="hidden md:inline">{user?.name || 'User'}</span>
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        href="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent"
                        onClick={() => setIsOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 inset-x-0 bg-white dark:bg-gray-800 border-b border-light-accent dark:border-dark-accent">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  if (window.location.pathname === '/') {
                    document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    router.push('/#pricing')
                  }
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent rounded-md"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  if (window.location.pathname === '/') {
                    document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    router.push('/#demo')
                  }
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent rounded-md"
              >
                Demo
              </button>
              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent rounded-md"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}