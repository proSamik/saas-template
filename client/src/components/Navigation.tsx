'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { useState, useRef, useEffect } from 'react'
import { UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

/**
 * Navigation component that displays the top navigation bar
 * with authentication state and theme toggle
 */
export function Navigation() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    const data = await signOut({ redirect: false, callbackUrl: '/' })
    router.push(data.url)
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
            
            {/* Auth Section */}
            {session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-2 rounded-md p-2 hover:bg-light-accent dark:hover:bg-dark-accent cursor-pointer"
                >
                  <UserCircleIcon className="h-6 w-6" />
                  <span className="text-light-foreground dark:text-dark-foreground">
                    {session.user?.name}
                  </span>
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-light-background dark:bg-dark-background border border-light-accent dark:border-dark-accent shadow-lg focus:outline-none z-50">
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setIsOpen(false)
                          handleSignOut()
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-light-foreground dark:text-dark-foreground hover:text-primary-600 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 inset-x-0 bg-light-background dark:bg-dark-background border-b border-light-accent dark:border-dark-accent">
            <div className="space-y-1 px-4 py-4">
              <button
                onClick={() => {
                  if (window.location.pathname === '/') {
                    document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    router.push('/#pricing')
                  }
                  setIsMobileMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent rounded-md"
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
                  setIsMobileMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent rounded-md"
              >
                Demo
              </button>
              {session && (
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-base font-medium text-light-foreground dark:text-dark-foreground hover:bg-light-accent dark:hover:bg-dark-accent rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
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