'use client'

import { useUserData } from '@/contexts/UserDataContext'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function UserOverview() {
  const { userData, loading, error } = useUserData()

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading user data: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-light-foreground dark:text-dark-foreground">
        Overview
      </h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2">Subscription Status</h2>
            <div className="space-y-2">
              <p>Status: {userData?.subscription.status || 'No active subscription'}</p>
              {userData?.subscription.productId && (
                <p>Product ID: {userData.subscription.productId}</p>
              )}
              {userData?.subscription.variantId && (
                <p>Variant ID: {userData.subscription.variantId}</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 