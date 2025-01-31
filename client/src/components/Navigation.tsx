'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { Menu } from '@headlessui/react'
import { UserCircleIcon } from '@heroicons/react/24/outline'

/**
 * Navigation component that displays the top navigation bar
 * with authentication state and theme toggle
 */
export function Navigation() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <nav className="border-b border-light-accent dark:border-dark-accent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <Link href="/" className="flex items-center font-semibold">
              SaaS Platform
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {status === 'loading' ? null : session ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center gap-2 rounded-md p-2 hover:bg-light-accent dark:hover:bg-dark-accent">
                  <UserCircleIcon className="h-6 w-6" />
                  <span>{session.user?.name}</span>
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-light-background dark:bg-dark-background border border-light-accent dark:border-dark-accent shadow-lg">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/dashboard"
                          className={`block px-4 py-2 text-sm ${
                            active ? 'bg-light-accent dark:bg-dark-accent' : ''
                          }`}
                        >
                          Dashboard
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleSignOut}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            active ? 'bg-light-accent dark:bg-dark-accent' : ''
                          }`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium hover:text-primary-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 