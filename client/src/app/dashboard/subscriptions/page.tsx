'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { Sidebar } from '@/components/Sidebar'
import api from '@/lib/axios'

interface Subscription {
  id: number
  subscription_id: string
  user_id: string
  order_id: number
  customer_id: number
  product_id: number
  variant_id: number
  status: string
  cancelled: boolean
  renews_at: string | null
  ends_at: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export default function Subscriptions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      api.get('/api/user/subscription')
        .then(response => {
          setSubscription(response.data)
          setLoading(false)
        })
        .catch()
    }
  }, [session])

  if (status === 'loading' || loading) {
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
        <div className="flex flex-1 flex-col md:pl-64">
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
                  Subscription
                </h1>
              </div>

              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <div className="mt-8">
                  {subscription ? (
                    <div className="overflow-hidden bg-light-background dark:bg-dark-background border border-light-accent dark:border-dark-accent shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-light-muted dark:text-dark-muted">Status</dt>
                            <dd className="mt-1 text-sm text-light-foreground dark:text-dark-foreground">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {subscription.status}
                              </span>
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-light-muted dark:text-dark-muted">Cancelled</dt>
                            <dd className="mt-1 text-sm text-light-foreground dark:text-dark-foreground">
                              {subscription.cancelled ? 'Yes' : 'No'}
                            </dd>
                          </div>
                          {subscription.renews_at && (
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-light-muted dark:text-dark-muted">Renews At</dt>
                              <dd className="mt-1 text-sm text-light-foreground dark:text-dark-foreground">
                                {new Date(subscription.renews_at).toLocaleDateString()}
                              </dd>
                            </div>
                          )}
                          {subscription.ends_at && (
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-light-muted dark:text-dark-muted">Ends At</dt>
                              <dd className="mt-1 text-sm text-light-foreground dark:text-dark-foreground">
                                {new Date(subscription.ends_at).toLocaleDateString()}
                              </dd>
                            </div>
                          )}
                          {subscription.trial_ends_at && (
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-light-muted dark:text-dark-muted">Trial Ends At</dt>
                              <dd className="mt-1 text-sm text-light-foreground dark:text-dark-foreground">
                                {new Date(subscription.trial_ends_at).toLocaleDateString()}
                              </dd>
                            </div>
                          )}
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-light-muted dark:text-dark-muted">Created At</dt>
                            <dd className="mt-1 text-sm text-light-foreground dark:text-dark-foreground">
                              {new Date(subscription.created_at).toLocaleDateString()}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-light-background dark:bg-dark-background border border-light-accent dark:border-dark-accent rounded-lg">
                      <p className="text-light-muted dark:text-dark-muted">No active subscription found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}