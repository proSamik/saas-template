'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import api from '@/lib/axios'

interface DashboardStat {
  name: string
  value: string
}

const defaultStats: DashboardStat[] = [
  { name: 'Total Projects', value: '0' },
  { name: 'Active Projects', value: '0' },
  { name: 'Completed Projects', value: '0' },
  { name: 'Completion Rate', value: '0%' },
]

/**
 * Dashboard page component that displays user information and key metrics
 * Protected route that requires authentication
 */
export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated, loading, user } = useAuth()
  const [dashboardStats, setDashboardStats] = useState<DashboardStat[]>(defaultStats)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/user/stats')
        setDashboardStats(response.data.stats)
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
          Welcome back, {user?.name}!
        </h1>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        {/* Stats */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardStats.map((stat) => (
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
              <h3 className="text-lg font-medium text-light-foreground dark:text-dark-foreground">
                Recent Activity
              </h3>
              <div className="mt-6">
                <p className="text-light-muted dark:text-dark-muted">
                  No recent activity to display.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}