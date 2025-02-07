'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/auth'
import { useRouter } from 'next/navigation'

interface SubscriptionData {
  status: string
  plan: string
  expiresAt?: string
}

export default function Subscription() {
  const { auth } = useAuth()
  const router = useRouter()

  if (!auth) {
    router.push('/auth/login')
    return null
  }
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await authService.get<SubscriptionData>('/api/user/subscription')
        // Handle empty array response as no subscription
        setSubscription(Array.isArray(response) && response.length === 0 ? null : response)
      } catch (err) {
        console.error('[Subscription] Failed to fetch subscription data:', err)
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Failed to fetch subscription data. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <h3 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
          Subscription
        </h3>
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <p className="text-light-muted dark:text-dark-muted">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <h3 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
          Subscription
        </h3>
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="space-y-6 p-4">
        <h3 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
          Subscription
        </h3>
        <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
          <p className="text-light-muted dark:text-dark-muted">No active subscription</p>
          <button
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => window.location.href = '/pricing'}
          >
            View Plans
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
        Subscription
      </h3>

      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
              Status
            </label>
            <div className="mt-1">
              <p className="text-light-muted dark:text-dark-muted capitalize">{subscription.status}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
              Plan
            </label>
            <div className="mt-1">
              <p className="text-light-muted dark:text-dark-muted">{subscription.plan}</p>
            </div>
          </div>

          {subscription.expiresAt && (
            <div>
              <label className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
                Expires At
              </label>
              <div className="mt-1">
                <p className="text-light-muted dark:text-dark-muted">
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          <div className="pt-4">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => window.location.href = '/pricing'}
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}