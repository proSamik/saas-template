'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Navigation } from '@/components/Navigation'
import { Sidebar } from '@/components/Sidebar'

const stats = [
  { name: 'Total Projects', value: '12' },
  { name: 'Active Projects', value: '5' },
  { name: 'Completed Projects', value: '7' },
  { name: 'Completion Rate', value: '87%' },
]

/**
 * Dashboard page component that displays user information and key metrics
 * Protected route that requires authentication
 */
export default function Dashboard() {
  const { data: session, status } = useSession({
    required: false,
    onUnauthenticated() {
      router.push('/auth/login')
    }
  })
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-light-muted dark:text-dark-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <Navigation />

      <div className="flex">
        <Sidebar />
        {/* Main content */}
        <div className="flex flex-1 flex-col md:pl-64">
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
                  Welcome back, {session.user?.name}!
                </h1>
              </div>
              
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {/* Stats */}
                <div className="mt-8">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                      <div
                        key={stat.name}
                        className="overflow-hidden rounded-lg bg-light-background dark:bg-dark-background border border-light-accent dark:border-dark-accent px-4 py-5 shadow sm:p-6"
                      >
                        <dt className="truncate text-sm font-medium text-light-muted dark:text-dark-muted">
                          {stat.name}
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold text-light-foreground dark:text-dark-foreground">
                          {stat.value}
                        </dd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                  <div className="overflow-hidden rounded-lg bg-light-background dark:bg-dark-background border border-light-accent dark:border-dark-accent shadow">
                    <div className="p-6">
                      <h3 className="text-lg font-medium leading-6 text-light-foreground dark:text-dark-foreground">
                        Recent Activity
                      </h3>
                      <div className="mt-6">
                        <div className="text-center text-sm text-light-muted dark:text-dark-muted">
                          No recent activity to show.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}