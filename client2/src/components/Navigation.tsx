'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { signOut, useSession } from 'next-auth/react'
import { ThemeToggle } from './ThemeToggle'
import { Button } from './ui/button'

/**
 * Navigation component that displays the top navigation bar
 * with authentication state and theme toggle
 */
export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full mx-auto bg-light-background/80 dark:bg-dark-background/80 backdrop-blur supports-[backdrop-filter]:bg-light-background/60 supports-[backdrop-filter]:dark:bg-dark-background/80">
      <nav className="flex w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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
                  if (pathname === '/') {
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
                  if (pathname === '/') {
                    document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    router.push('/#demo')
                  }
                }}
                className="text-sm font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
              >
                Demo
              </button>
              {session && (
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
            
            {/* Desktop Auth Menu */}
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center space-x-2 text-sm font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <span>Account</span>
                  </button>

                  {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-light-background dark:bg-dark-background rounded-md shadow-lg border border-light-accent dark:border-dark-accent">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent"
                        onClick={() => setIsOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setIsOpen(false)
                          signOut({ callbackUrl: '/auth/login' })
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-light-background dark:bg-dark-background border-b border-light-accent dark:border-dark-accent">
            <div className="px-4 py-2 space-y-1">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  if (pathname === '/') {
                    document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    router.push('/#pricing')
                  }
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  if (pathname === '/') {
                    document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    router.push('/#demo')
                  }
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
              >
                Demo
              </button>
              {session && (
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {session ? (
                <>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      signOut({ callbackUrl: '/auth/login' })
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}